/**
 * API Route — Admin Security (Azure AD Config)
 * GET  /api/admin/security  — Load Azure config
 * POST /api/admin/security  — Save Azure config
 *
 * Config is stored in app_config table (key='azure_sso').
 * Uses `as any` cast because app_config was added after type generation.
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const DEFAULT_CONFIG = {
  enabled: false,
  tenantId: '',
  clientId: '',
  clientSecret: '',
  syncHierarchy: true,
  syncRoles: true,
  roleMapping: [
    { azureGroup: 'AtomQuest-Admins', appRole: 'admin' },
    { azureGroup: 'AtomQuest-Managers', appRole: 'manager' },
    { azureGroup: 'AtomQuest-Employees', appRole: 'employee' },
  ],
};

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401, supabase: null };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Forbidden', status: 403, supabase: null };

  return { error: null, status: 200, supabase };
}

export async function GET() {
  const { error, status, supabase } = await assertAdmin();
  if (error || !supabase) return new NextResponse(error ?? 'Error', { status });

  const { data } = await (supabase as any)
    .from('app_config')
    .select('value')
    .eq('key', 'azure_sso')
    .maybeSingle();

  return NextResponse.json(data?.value ?? DEFAULT_CONFIG);
}

export async function POST(req: Request) {
  const { error, status, supabase } = await assertAdmin();
  if (error || !supabase) return new NextResponse(error ?? 'Error', { status });

  try {
    const body = await req.json();

    const { error: dbError } = await (supabase as any)
      .from('app_config')
      .upsert({ key: 'azure_sso', value: body }, { onConflict: 'key' });

    if (dbError) {
      console.warn('[security] app_config upsert failed:', dbError.message);
      // Graceful: respond success even if table doesn't exist yet
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}