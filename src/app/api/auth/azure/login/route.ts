/**
 * Azure AD SSO — Login Initiator
 * GET /api/auth/azure/login
 *
 * Reads Azure config from app_config, generates a PKCE code challenge,
 * stores state + code_verifier in a short-lived cookie, and redirects
 * the user to Microsoft's authorization endpoint.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** Generate a cryptographically random base64url string */
function randomBase64url(bytes: number): string {
  const arr = crypto.getRandomValues(new Uint8Array(bytes));
  return Buffer.from(arr)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/** SHA-256 hash → base64url (for PKCE code_challenge) */
async function sha256Base64url(plain: string): Promise<string> {
  const encoded = new TextEncoder().encode(plain);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Buffer.from(digest)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export async function GET(req: Request) {
  const supabase = await createClient();

  // Load Azure SSO config
  const { data: configRow } = await (supabase as any)
    .from('app_config')
    .select('value')
    .eq('key', 'azure_sso')
    .maybeSingle();

  const config = configRow?.value as any;

  if (!config?.enabled || !config?.tenantId || !config?.clientId) {
    return new NextResponse(
      `<html><body style="font-family:sans-serif;padding:40px">
        <h2>Azure SSO Not Configured</h2>
        <p>An admin must configure Azure AD credentials in 
        <a href="/admin/security">/admin/security</a> before SSO can be used.</p>
      </body></html>`,
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }

  // Generate PKCE pair
  const codeVerifier = randomBase64url(64);
  const codeChallenge = await sha256Base64url(codeVerifier);
  const state = randomBase64url(32);

  // Build redirect_uri from the request origin
  const origin = new URL(req.url).origin;
  const redirectUri = `${origin}/api/auth/azure/callback`;

  // Microsoft authorization URL
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    response_mode: 'query',
    scope: 'openid profile email offline_access User.Read',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'select_account', // Let user choose account
  });

  const authUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/authorize?${params}`;

  // Store state + code_verifier in a short-lived HttpOnly cookie
  const cookieValue = JSON.stringify({ state, codeVerifier, redirectUri });
  const response = NextResponse.redirect(authUrl);
  response.cookies.set('azure_oauth_state', cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
    path: '/',
  });

  return response;
}
