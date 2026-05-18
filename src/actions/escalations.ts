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
import { sendEscalationResolvedEmail } from '@/emails/send';

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

    // Get escalation details first
    const { data: escalation } = await supabase
      .from('escalations')
      .select('*, target_user:profiles!escalations_target_user_id_fkey(first_name, last_name), escalated_to:profiles!escalations_escalated_to_id_fkey(first_name, last_name, email)')
      .eq('id', escalationId)
      .single();

    const { error } = await supabase
      .from('escalations')
      .update({ resolved_at: new Date().toISOString() })
      .eq('id', escalationId);

    if (error) throw error;

    // Send resolution email to the escalated person
    if (escalation?.escalated_to?.email) {
      const adminProfile = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      await sendEscalationResolvedEmail({
        to: escalation.escalated_to.email,
        recipientName: `${escalation.escalated_to.first_name} ${escalation.escalated_to.last_name}`,
        escalationType: escalation.type,
        targetEmployee: escalation.target_user 
          ? `${escalation.target_user.first_name} ${escalation.target_user.last_name}`
          : 'Employee',
        resolvedBy: adminProfile?.data 
          ? `${adminProfile.data.first_name} ${adminProfile.data.last_name}` 
          : 'Admin',
      });
    }

    revalidatePath('/admin/escalations');
    revalidatePath('/manager');
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function triggerEscalationCheck(): Promise<ActionResult<{ created: number }>> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/cron/escalation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
      },
    });

    const result = await response.json();
    
    if (result.success) {
      return { success: true, data: { created: result.created || 0 } };
    } else {
      throw new Error(result.error || 'Cron failed');
    }
  } catch (error) {
    return handleActionError(error);
  }
}
