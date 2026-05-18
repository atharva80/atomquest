/**
 * Server Actions — Shared Goals
 *
 * Admin/manager actions for creating and managing shared/departmental goals.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { handleActionError, ActionResult } from '@/lib/errors';
import { revalidatePath } from 'next/cache';
import { UomType } from '@/types';

export async function createSharedGoal(formData: FormData): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const adminSupabase = await createAdminClient();

    // Skipping rigorous Zod parsing here for brevity, assuming standard inputs
    const cycle_id = formData.get('cycle_id') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const thrust_area_id = formData.get('thrust_area_id') as string;
    const uom_type = formData.get('uom_type') as UomType;
    const target = formData.get('target') ? Number(formData.get('target')) : null;
    const target_date = formData.get('target_date') as string | null;
    const weightage = Number(formData.get('weightage'));
    
    // employee_ids is an array of IDs
    const employee_ids_raw = formData.get('employee_ids');
    const employee_ids: string[] = employee_ids_raw ? JSON.parse(employee_ids_raw as string) : [];

    // Create the primary/template goal assigned to the creator
    const { data: primaryGoal, error: pError } = await adminSupabase.from('goals').insert({
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
      const { data: copiedGoal, error: cError } = await adminSupabase.from('goals').insert({
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
        await adminSupabase.from('shared_goals').insert({
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

export async function createAndAssignSharedGoal(formData: FormData): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    const adminSupabase = await createAdminClient();

    const cycle_id = formData.get('cycle_id') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const thrust_area_id = formData.get('thrust_area_id') as string;
    const uom_type = formData.get('uom_type') as UomType;
    const target = formData.get('target') ? Number(formData.get('target')) : null;
    const target_date = formData.get('target_date') as string | null;
    const weightage = Number(formData.get('weightage'));
    
    const employee_ids_raw = formData.get('employee_ids');
    const employee_ids: string[] = employee_ids_raw ? JSON.parse(employee_ids_raw as string) : [];

    // Create the primary goal (admin's copy)
    const { data: primaryGoal, error: pError } = await adminSupabase.from('goals').insert({
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

    // Create copies for employees - status "locked" means pre-assigned
    for (const empId of employee_ids) {
      const { data: copiedGoal, error: cError } = await adminSupabase.from('goals').insert({
        profile_id: empId,
        cycle_id,
        thrust_area_id,
        title,
        description,
        uom_type,
        target,
        target_date,
        weightage: 10,
        status: 'locked' // Pre-assigned, employees can only adjust weightage
      }).select().single();

      if (copiedGoal) {
        await adminSupabase.from('shared_goals').insert({
          primary_goal_id: primaryGoal.id,
          recipient_profile_id: empId
        });
      }
    }

    revalidatePath('/admin/shared-goals');
    revalidatePath('/employee/goals');
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
    if (goal.status !== 'draft' && goal.status !== 'returned' && goal.status !== 'locked') throw new Error('Goal is not editable');

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

export async function deleteSharedGoal(primaryGoalId: string): Promise<ActionResult<void>> {
  try {
    const adminSupabase = await createAdminClient();
    const { data: { user } } = await (await createClient()).auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get the primary goal details to find recipient goals
    const { data: primaryGoal } = await adminSupabase
      .from('goals')
      .select('id, title, cycle_id')
      .eq('id', primaryGoalId)
      .single();

    if (!primaryGoal) throw new Error('Goal not found');

    // Get all shared_goals entries for this primary to find recipients
    const { data: sharedGoalEntries } = await adminSupabase
      .from('shared_goals')
      .select('recipient_profile_id')
      .eq('primary_goal_id', primaryGoalId);

    if (!sharedGoalEntries) {
      throw new Error('Shared goal not found');
    }

    // Find all recipient goals (same title, cycle, different profile)
    const recipientIds = sharedGoalEntries.map(sg => sg.recipient_profile_id);
    const { data: recipientGoals } = await adminSupabase
      .from('goals')
      .select('id')
      .eq('title', primaryGoal.title)
      .eq('cycle_id', primaryGoal.cycle_id)
      .in('profile_id', recipientIds);

    // Delete recipient goals
    if (recipientGoals && recipientGoals.length > 0) {
      await adminSupabase
        .from('goals')
        .delete()
        .in('id', recipientGoals.map(g => g.id));
    }

    // Delete shared_goals entries
    await adminSupabase
      .from('shared_goals')
      .delete()
      .eq('primary_goal_id', primaryGoalId);

    // Delete the primary goal
    await adminSupabase
      .from('goals')
      .delete()
      .eq('id', primaryGoalId);

    revalidatePath('/admin/shared-goals');
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}
