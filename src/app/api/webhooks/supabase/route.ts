// ============================================
// API Route — Webhooks: Supabase
// ============================================
// FILE: src/app/api/webhooks/supabase/route.ts
//
// PURPOSE:
//   Handles Supabase Database Webhooks for real-time event processing.
//   Optional — use if you want to trigger side effects on DB changes
//   without relying on Supabase Edge Functions.
//
// IMPLEMENTATION:
//   1. Route Handler (POST)
//   2. Verify webhook signature (Supabase webhook secret)
//   3. Parse payload: { type, table, record, old_record }
//   4. Handle events:
//      - goals.UPDATE (status changed to 'submitted') → send email to manager
//      - goals.UPDATE (status changed to 'approved') → send email to employee
//      - quarterly_checkins.INSERT → check if shared goal, sync if needed
//   5. Return 200 OK
//
// NOTE:
//   This is OPTIONAL. The same logic is already in Server Actions.
//   Use this only if you need DB-triggered side effects that
//   aren't initiated by your app (e.g., direct DB edits).
//
// EXPORTS:
//   - POST(request: NextRequest): NextResponse
//
// DEPENDS ON:
//   - @/lib/supabase/admin
//   - @/emails/send
// ============================================
