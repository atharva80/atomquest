/**
 * API Route — Test Azure AD Connection
 * POST /api/admin/security/test
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

  try {
    const { tenantId, clientId, clientSecret } = await req.json();

    if (!tenantId || !clientId || !clientSecret) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 });
    }

    // TODO: Actually test with Microsoft Graph API when Azure credentials available
    return NextResponse.json({ 
      success: true, 
      message: 'Azure AD connection configured (live test pending)' 
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Connection failed' }, { status: 500 });
  }
}