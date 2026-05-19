/**
 * API Route — Webhooks CRUD
 * GET    /api/admin/webhooks  — List all webhooks
 * POST   /api/admin/webhooks  — Create a webhook
 * PATCH  /api/admin/webhooks  — Update a webhook
 * DELETE /api/admin/webhooks  — Delete a webhook
 *
 * Webhooks are stored in the app_config table as key='webhooks' value=[...].
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401, supabase: null };
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (p?.role !== 'admin') return { error: 'Forbidden', status: 403, supabase: null };
  return { error: null, status: 200, supabase };
}

async function loadWebhooks(supabase: any) {
  const { data } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'webhooks')
    .maybeSingle();
  return (data?.value as any[]) ?? [];
}

async function saveWebhooks(supabase: any, webhooks: any[]) {
  await supabase.from('app_config').upsert({ key: 'webhooks', value: webhooks }, { onConflict: 'key' });
}

export async function GET() {
  const { error, status, supabase } = await assertAdmin();
  if (error || !supabase) return new NextResponse(error, { status });

  const webhooks = await loadWebhooks(supabase);
  // Mask secrets before sending to client
  const masked = webhooks.map((w: any) => ({ ...w, secret: w.secret ? '••••••••' + w.secret.slice(-4) : '' }));
  return NextResponse.json(masked);
}

export async function POST(req: Request) {
  const { error, status, supabase } = await assertAdmin();
  if (error || !supabase) return new NextResponse(error, { status });

  const body = await req.json();
  const webhooks = await loadWebhooks(supabase);

  const newWebhook = {
    id: crypto.randomUUID(),
    name: body.name,
    url: body.url,
    events: body.events ?? [],
    enabled: false,
    secret: body.secret || `whsec_${crypto.randomUUID().replace(/-/g, '')}`,
    createdAt: new Date().toISOString(),
  };

  webhooks.push(newWebhook);
  await saveWebhooks(supabase, webhooks);

  return NextResponse.json({ ...newWebhook, secret: '••••' + newWebhook.secret.slice(-4) });
}

export async function PATCH(req: Request) {
  const { error, status, supabase } = await assertAdmin();
  if (error || !supabase) return new NextResponse(error, { status });

  const body = await req.json();
  const webhooks = await loadWebhooks(supabase);

  const idx = webhooks.findIndex((w: any) => w.id === body.id);
  if (idx === -1) return new NextResponse('Not found', { status: 404 });

  webhooks[idx] = { ...webhooks[idx], ...body };
  await saveWebhooks(supabase, webhooks);

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const { error, status, supabase } = await assertAdmin();
  if (error || !supabase) return new NextResponse(error, { status });

  const { id } = await req.json();
  const webhooks = await loadWebhooks(supabase);
  const filtered = webhooks.filter((w: any) => w.id !== id);
  await saveWebhooks(supabase, filtered);

  return NextResponse.json({ success: true });
}
