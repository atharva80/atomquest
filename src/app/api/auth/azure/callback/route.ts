/**
 * Azure AD SSO — OAuth2 Callback Handler
 * GET /api/auth/azure/callback?code=...&state=...
 *
 * Full flow:
 * 1. Validate CSRF state
 * 2. Exchange code for tokens (PKCE)
 * 3. Decode id_token to get user identity
 * 4. Call Graph API for manager + group membership
 * 5. Find or provision Supabase user
 * 6. Sync manager_id + role into profiles table
 * 7. Create Supabase session via generateLink → verifyOtp
 * 8. Redirect to role-specific dashboard
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

/** Decode a JWT payload without signature verification.
 *  Safe here — token was received directly from Microsoft over HTTPS. */
function decodeJwtPayload(token: string): Record<string, any> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid JWT format');
  const padded = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const json = Buffer.from(padded + '='.repeat((4 - (padded.length % 4)) % 4), 'base64').toString('utf8');
  return JSON.parse(json);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const stateParam = url.searchParams.get('state');
  const errorParam = url.searchParams.get('error');
  const errorDesc = url.searchParams.get('error_description');

  const origin = url.origin;
  const loginUrl = `${origin}/login`;

  // Microsoft-side error (e.g. user cancelled, org policy blocked)
  if (errorParam) {
    console.error('[azure/callback] Microsoft error:', errorParam, errorDesc);
    const msg = errorDesc || errorParam;
    return NextResponse.redirect(`${loginUrl}?sso_error=${encodeURIComponent(msg)}`);
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(`${loginUrl}?sso_error=missing_code_or_state`);
  }

  // ── Step 1: Validate CSRF state ───────────────────────────────────────────
  const cookieStore = await cookies();
  const rawCookie = cookieStore.get('azure_oauth_state')?.value;
  if (!rawCookie) {
    return NextResponse.redirect(`${loginUrl}?sso_error=state_cookie_missing`);
  }

  let savedState: { state: string; codeVerifier: string; redirectUri: string };
  try {
    savedState = JSON.parse(rawCookie);
  } catch {
    return NextResponse.redirect(`${loginUrl}?sso_error=state_cookie_corrupt`);
  }

  if (savedState.state !== stateParam) {
    return NextResponse.redirect(`${loginUrl}?sso_error=state_mismatch`);
  }

  // ── Step 2: Load Azure Config ─────────────────────────────────────────────
  const supabase = await createClient();
  const { data: configRow } = await (supabase as any)
    .from('app_config')
    .select('value')
    .eq('key', 'azure_sso')
    .maybeSingle();

  const config = configRow?.value as any;
  if (!config?.tenantId || !config?.clientId || !config?.clientSecret) {
    return NextResponse.redirect(`${loginUrl}?sso_error=azure_not_configured`);
  }

  // ── Step 3: Exchange authorization code for tokens ────────────────────────
  const tokenUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
  const tokenBody = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: savedState.redirectUri,
    code_verifier: savedState.codeVerifier,
    scope: 'openid profile email offline_access User.Read',
  });

  const tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenBody.toString(),
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok || !tokenData.access_token || !tokenData.id_token) {
    console.error('[azure/callback] Token exchange failed:', tokenData);
    const msg = tokenData.error_description || tokenData.error || 'token_exchange_failed';
    return NextResponse.redirect(`${loginUrl}?sso_error=${encodeURIComponent(msg)}`);
  }

  const graphToken = tokenData.access_token;
  const graphHeaders = { Authorization: `Bearer ${graphToken}` };

  // ── Step 4: Decode id_token for identity ──────────────────────────────────
  let azureEmail: string;
  let azureName: string;
  let azureOid: string;
  let azureGivenName: string;
  let azureFamilyName: string;

  try {
    const payload = decodeJwtPayload(tokenData.id_token);
    azureEmail = (payload.preferred_username || payload.email || payload.upn || '').toLowerCase();
    azureName = payload.name || '';
    azureOid = payload.oid || '';
    azureGivenName = payload.given_name || azureName.split(' ')[0] || '';
    azureFamilyName = payload.family_name || azureName.split(' ').slice(1).join(' ') || '';
  } catch (e) {
    console.error('[azure/callback] Failed to decode id_token:', e);
    return NextResponse.redirect(`${loginUrl}?sso_error=invalid_id_token`);
  }

  if (!azureEmail) {
    return NextResponse.redirect(`${loginUrl}?sso_error=no_email_in_token`);
  }

  // ── Step 5: Org hierarchy — fetch manager from Graph ─────────────────────
  let managerEmail: string | null = null;
  if (config.syncHierarchy !== false) {
    try {
      const mgrRes = await fetch('https://graph.microsoft.com/v1.0/me/manager?$select=mail,userPrincipalName', {
        headers: graphHeaders,
      });
      if (mgrRes.ok) {
        const mgr = await mgrRes.json();
        managerEmail = (mgr.mail || mgr.userPrincipalName || '').toLowerCase() || null;
      }
      // 404 = user has no manager — not an error
    } catch {
      /* non-fatal */
    }
  }

  // ── Step 6: Role mapping — fetch group membership from Graph ──────────────
  let mappedRole: 'employee' | 'manager' | 'admin' | null = null;
  if (config.syncRoles !== false && Array.isArray(config.roleMapping) && config.roleMapping.length > 0) {
    try {
      const grpRes = await fetch(
        'https://graph.microsoft.com/v1.0/me/memberOf?$select=displayName&$top=100',
        { headers: graphHeaders }
      );
      if (grpRes.ok) {
        const grpData = await grpRes.json();
        const userGroups: string[] = (grpData.value || []).map((g: any) => g.displayName as string);

        for (const mapping of config.roleMapping) {
          if (userGroups.includes(mapping.azureGroup)) {
            mappedRole = mapping.appRole as 'employee' | 'manager' | 'admin';
            break;
          }
        }
      }
    } catch {
      /* non-fatal — user still logs in with default role */
    }
  }

  // ── Step 7: Find or provision Supabase auth user ──────────────────────────
  const adminClient = createAdminClient();

  // Search existing auth users by email (paginate up to 1000 users)
  let authUserId: string | null = null;
  let isNewUser = false;

  const { data: usersPage } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existingUser = usersPage?.users?.find(u => u.email?.toLowerCase() === azureEmail);

  if (existingUser) {
    authUserId = existingUser.id;
  } else {
    // Provision: create confirmed user (they authenticated with Microsoft)
    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email: azureEmail,
      email_confirm: true,
      user_metadata: {
        full_name: azureName,
        first_name: azureGivenName,
        last_name: azureFamilyName,
        azure_oid: azureOid,
        provider: 'azure_ad',
      },
    });

    if (createErr || !newUser.user) {
      console.error('[azure/callback] User provisioning failed:', createErr);
      return NextResponse.redirect(`${loginUrl}?sso_error=provisioning_failed`);
    }

    authUserId = newUser.user.id;
    isNewUser = true;
  }

  // ── Step 8: Sync profile (name, manager_id, role) ────────────────────────
  const profilePatch: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (azureGivenName) profilePatch.first_name = azureGivenName;
  if (azureFamilyName) profilePatch.last_name = azureFamilyName;
  if (azureName) profilePatch.full_name = azureName;

  // Role: use mapped role from Azure groups, or preserve existing for known users
  if (mappedRole) {
    profilePatch.role = mappedRole;
  } else if (isNewUser) {
    profilePatch.role = 'employee'; // default for new provisioned users
  }

  // Manager hierarchy
  if (managerEmail) {
    const { data: mgrProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', managerEmail)
      .maybeSingle();

    if (mgrProfile) {
      profilePatch.manager_id = mgrProfile.id;
    }
  }

  // Upsert profile (handles both new users and existing users)
  await adminClient.from('profiles').upsert(
    {
      id: authUserId,
      email: azureEmail,
      first_name: azureGivenName || 'User',
      last_name: azureFamilyName || '',
      full_name: azureName || azureEmail,
      role: mappedRole || 'employee',
      ...profilePatch,
    },
    { onConflict: 'id' }
  );

  // Determine dashboard redirect from final profile
  const { data: finalProfile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', authUserId)
    .single();

  const dashboardRole = finalProfile?.role || 'employee';

  // ── Step 9: Create real Supabase session ──────────────────────────────────
  // generateLink returns a one-time magic link token we can exchange for a session
  const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
    type: 'magiclink',
    email: azureEmail,
    options: { redirectTo: `${origin}/${dashboardRole}` },
  });

  if (linkErr || !linkData?.properties?.hashed_token) {
    console.error('[azure/callback] generateLink failed:', linkErr);
    return NextResponse.redirect(`${loginUrl}?sso_error=session_link_failed`);
  }

  // Exchange the hashed_token for a real session (verifyOtp sets auth cookies)
  const { error: otpErr } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'magiclink',
  });

  if (otpErr) {
    console.error('[azure/callback] verifyOtp failed:', otpErr);
    return NextResponse.redirect(`${loginUrl}?sso_error=session_verify_failed`);
  }

  // Clear state cookie and redirect to dashboard
  const response = NextResponse.redirect(`${origin}/${dashboardRole}`);
  response.cookies.delete('azure_oauth_state');
  return response;
}
