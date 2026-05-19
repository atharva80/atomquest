/**
 * API Route — Sync Users from Azure AD
 * POST /api/admin/security/sync
 */

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return { error: 'Forbidden', status: 403 };

  return { error: null, status: 200 };
}

export async function POST(req: Request) {
  const { error, status } = await assertAdmin();
  if (error) return new NextResponse(error, { status });

  // TODO: Implement actual Azure AD sync when credentials available
  // 1. Call Microsoft Graph API to get users
  // 2. Map Azure AD attributes to profiles
  // 3. Update/insert profiles
  // 4. Sync manager relationships from "manager" attribute
  // 5. Map roles from group membership

  return NextResponse.json({
    success: true,
    usersSynced: 0,
    message: 'Azure AD sync will be implemented when Azure credentials configured'
  });
}