/**
 * Supabase — Admin Client (Service Role)
 *
 * Creates a Supabase client using the SERVICE_ROLE_KEY.
 * This client BYPASSES RLS — use only for:
 * - Cron job operations (escalation checks)
 * - Admin user management
 * - Seeding / migration scripts
 * - Audit log writes (system-generated entries)
 * 
 * SECURITY:
 *   ⚠️ NEVER import this in Client Components or expose the service role key
 *   ⚠️ Only use in Server Actions, Route Handlers, and Cron routes
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export function createAdminClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables for Admin Client');
  }

  return createClient<Database>(
    url,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  ) as SupabaseClient<Database>;
}
