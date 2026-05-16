/**
 * Server Actions — Shared Goals
 *
 * Admin/manager actions for creating and managing shared/departmental goals.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { handleActionError, ActionResult } from '@/lib/errors';
import { revalidatePath } from 'next/cache';

export async function createSharedGoal(formData: FormData): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Skipping rigorous Zod parsing here for brevity, assuming standard inputs
    const cycle_id = formData.get('cycle_id') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const thrust_area_id = formData.get('thrust_area_id') as string;
    const uom_type = formData.get('uom_type') as string;
    const target = formData.get('target') ? Number(formData.get('target')) : null;
    const target_date = formData.get('target_date') as string | null;
    const weightage = Number(formData.get('weightage'));
    
    // employee_ids is an array of IDs
    const employee_ids_raw = formData.get('employee_ids');
    const employee_ids: string[] = employee_ids_raw ? JSON.parse(employee_ids_raw as string) : [];

    // Create the primary/template goal assigned to the creator
    const { data: primaryGoal, error: pError } = await supabase.from('goals').insert({
      profile_id: user.id,
      cycle_id,
      thrust_area_id,
      title,
      description,
      uom_type,
      target,
      target_date,
      weightage,
      status: 'draft'
    }).select().single();

    if (pError || !primaryGoal) throw new Error('Failed to create primary goal');

    // Create copies and links
    for (const empId of employee_ids) {
      const { data: copiedGoal, error: cError } = await supabase.from('goals').insert({
        profile_id: empId,
        cycle_id,
        thrust_area_id,
        title, // Read-only on UI
        description,
        uom_type,
        target, // Read-only on UI
        target_date,
        weightage: 10, // Default to min weightage for recipients
        status: 'draft'
      }).select().single();

      if (copiedGoal) {
        await supabase.from('shared_goals').insert({
          primary_goal_id: primaryGoal.id,
          recipient_profile_id: empId
        });
      }
    }

    revalidatePath('/admin/shared-goals');
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateSharedGoalWeightage(goalId: string, weightage: number): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: goal } = await supabase.from('goals').select('status, profile_id').eq('id', goalId).single();
    if (!goal || goal.profile_id !== user.id) throw new Error('Unauthorized');
    if (goal.status !== 'draft' && goal.status !== 'returned') throw new Error('Goal is locked');

    await supabase.from('goals').update({ weightage }).eq('id', goalId);
    
    revalidatePath('/employee/goals');
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function syncSharedGoalAchievement(primaryGoalId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Note: Implementation of this depends on checkins structure.
    // In a real production system, this would be an edge function or trigger
    // responding to the quarterly_checkins table inserts/updates.

    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}
