/**
 * API Route — Webhook Test
 * POST /api/admin/webhooks/test
 *
 * Sends a real HTTP POST to the webhook URL with a test event payload,
 * HMAC-signed with the webhook secret (Stripe-style signature).
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse('Unauthorized', { status: 401 });

  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (p?.role !== 'admin') return new NextResponse('Forbidden', { status: 403 });

  const { url, secret } = await req.json();
  if (!url) return NextResponse.json({ success: false, error: 'Missing URL' }, { status: 400 });

  const payload = JSON.stringify({
    event: 'webhook.test',
    timestamp: new Date().toISOString(),
    data: { message: 'This is a test event from AtomQuest.' },
  });

  // Sign payload with HMAC-SHA256 if secret is provided
  let signature = '';
  if (secret && !secret.startsWith('••')) {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
    signature = `v1=${Buffer.from(sig).toString('hex')}`;
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AtomQuest-Signature': signature,
        'X-AtomQuest-Event': 'webhook.test',
        'User-Agent': 'AtomQuest-Webhook/1.0',
      },
      body: payload,
      signal: AbortSignal.timeout(8000), // 8 second timeout
    });

    return NextResponse.json({
      success: res.ok,
      statusCode: res.status,
      statusText: res.statusText,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
