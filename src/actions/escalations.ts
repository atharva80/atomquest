/**
 * Server Actions — Escalations
 *
 * Admin actions for managing escalation rules and resolving escalations.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { handleActionError, ActionResult } from '@/lib/errors';
import { revalidatePath } from 'next/cache';

export async function updateEscalationRule(ruleId: string, formData: FormData): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const days_threshold = Number(formData.get('threshold_days'));
    const is_active = formData.get('is_active') === 'true';

    const { error } = await supabase
      .from('escalation_rules')
      .update({ days_threshold, is_active })
      .eq('id', ruleId);

    if (error) throw error;

    revalidatePath('/admin/escalations');
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function resolveEscalation(escalationId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('escalations')
      .update({ resolved_at: new Date().toISOString() })
      .eq('id', escalationId);

    if (error) throw error;

    revalidatePath('/admin/escalations');
    revalidatePath('/manager');
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function triggerEscalationCheck(): Promise<ActionResult<{ created: number }>> {
  try {
    // Requires Admin client (bypasses RLS) because this will be run by a cron job or admin
    const supabaseAdmin = createAdminClient();
    
    // In a real system, we would:
    // 1. Fetch active cycles and rules
    // 2. Run complex Postgres queries to find violations
    // 3. Insert escalations
    // 4. Send emails via Resend
    
    // For this demo mock-up, we return 0.
    
    return { success: true, data: { created: 0 } };
  } catch (error) {
    return handleActionError(error);
  }
}
