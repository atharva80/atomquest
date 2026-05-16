/**
 * Supabase — Browser Client
 *
 * Creates a Supabase client for use in Client Components (browser).
 * This client respects RLS policies based on the logged-in user's JWT.
 */

import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types'; // Temporarily using Database from index.ts until supabase.ts is generated

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
