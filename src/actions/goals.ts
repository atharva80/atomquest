/**
 * Server Actions — Goals
 *
 * All goal-related mutations (create, update, delete, submit).
 * These are Next.js Server Actions called directly from Client Components.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { createGoalSchema, updateGoalSchema, goalSheetSchema } from '@/schemas/goal';
import { handleActionError, ActionResult } from '@/lib/errors';
import { revalidatePath } from 'next/cache';
import { Goal, GoalStatus } from '@/types';
import { VALIDATION } from '@/lib/constants';
// import { sendGoalSubmittedEmail } from '@/emails/send'; // Stubbed for now

export async function createGoal(formData: FormData): Promise<ActionResult<Goal>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('Not authenticated');

    // Basic role check (ideally check profile)
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'employee') throw new Error('Only employees can create goals');

    const rawData = {
      title: formData.get('title'),
      description: formData.get('description'),
      thrust_area_id: formData.get('thrust_area_id'),
      uom_type: formData.get('uom_type'),
      target: formData.get('target') ? formData.get('target') : null,
      weightage: Number(formData.get('weightage')),
    };

    // Needs active cycle ideally, assuming cycle_id is passed or fetched. 
    // We'll require cycle_id in formData for completeness
    const cycle_id = formData.get('cycle_id') as string;
    if (!cycle_id) throw new Error('Active cycle ID is required');

    const parsedData = createGoalSchema.parse(rawData);

    // Check goal count limit
    const { count } = await supabase
      .from('goals')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .eq('cycle_id', cycle_id);

    if (count !== null && count >= VALIDATION.MAX_GOALS_PER_EMPLOYEE) {
      throw new Error(`You cannot have more than ${VALIDATION.MAX_GOALS_PER_EMPLOYEE} goals.`);
    }

    const goalToInsert: any = {
      profile_id: user.id,
      cycle_id,
      thrust_area_id: parsedData.thrust_area_id,
      title: parsedData.title,
      description: parsedData.description,
      uom_type: parsedData.uom_type,
      weightage: parsedData.weightage,
      status: 'draft',
    };

    if (parsedData.uom_type === 'timeline') {
      goalToInsert.target_date = new Date(parsedData.target as string).toISOString();
    } else {
      goalToInsert.target = parsedData.target === '' || parsedData.target === null ? null : Number(parsedData.target);
    }

    const { data: newGoal, error } = await supabase
      .from('goals')
      .insert(goalToInsert)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/employee/goals');
    return { success: true, data: newGoal as Goal };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateGoal(goalId: string, formData: FormData): Promise<ActionResult<Goal>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existingGoal, error: fetchError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .single();

    if (fetchError || !existingGoal) throw new Error('Goal not found');
    
    // We assume RLS handles the permission check (owner or manager)
    if (existingGoal.status !== 'draft' && existingGoal.status !== 'returned') {
      throw new Error('Can only update goals in draft or returned status');
    }

    const rawData = {
      title: formData.get('title'),
      description: formData.get('description'),
      thrust_area_id: formData.get('thrust_area_id'),
      uom_type: formData.get('uom_type'),
      target: formData.get('target'),
      weightage: Number(formData.get('weightage')),
    };

    const parsedData = updateGoalSchema.parse(rawData);

    const updates: any = {};
    if (parsedData.title !== undefined) updates.title = parsedData.title;
    if (parsedData.description !== undefined) updates.description = parsedData.description;
    if (parsedData.thrust_area_id !== undefined) updates.thrust_area_id = parsedData.thrust_area_id;
    if (parsedData.uom_type !== undefined) updates.uom_type = parsedData.uom_type;
    if (parsedData.weightage !== undefined) updates.weightage = parsedData.weightage;
    
    if (parsedData.uom_type === 'timeline') {
      updates.target_date = new Date(parsedData.target as string).toISOString();
      updates.target = null;
    } else if (parsedData.target !== undefined) {
      updates.target = parsedData.target === '' || parsedData.target === null ? null : Number(parsedData.target);
      updates.target_date = null;
    }

    const { data: updatedGoal, error: updateError } = await supabase
      .from('goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single();

    if (updateError) throw updateError;

    revalidatePath('/employee/goals');
    return { success: true, data: updatedGoal as Goal };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteGoal(goalId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    
    // Check status
    const { data: goal } = await supabase.from('goals').select('status').eq('id', goalId).single();
    if (!goal) throw new Error('Goal not found');
    if (goal.status !== 'draft') throw new Error('Only draft goals can be deleted');

    const { error } = await supabase.from('goals').delete().eq('id', goalId);
    if (error) throw error;

    revalidatePath('/employee/goals');
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function submitGoalSheet(cycleId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: goals, error: fetchError } = await supabase
      .from('goals')
      .select('*')
      .eq('profile_id', user.id)
      .eq('cycle_id', cycleId);

    if (fetchError || !goals) throw new Error('Failed to fetch goals');

    // Format goals for zod validation (dates to strings, targets to strings if date)
    const formattedGoals = goals.map(g => ({
      ...g,
      target: g.uom_type === 'timeline' ? g.target_date : g.target
    }));

    // Validate overall sheet (count and 100% weightage)
    goalSheetSchema.parse({ goals: formattedGoals });

    // Update statuses
    const { error: updateError } = await supabase
      .from('goals')
      .update({ status: 'submitted' })
      .eq('profile_id', user.id)
      .eq('cycle_id', cycleId);

    if (updateError) throw updateError;

    // Fetch user manager
    const { data: profile } = await supabase.from('profiles').select('manager_id').eq('id', user.id).single();

    // Insert approval record
    await supabase.from('approvals').insert({
      profile_id: user.id,
      manager_id: profile?.manager_id || null,
      cycle_id,
      action: 'submitted'
    });

    // TODO: Send email
    // await sendGoalSubmittedEmail(user.id, profile?.manager_id);

    revalidatePath('/employee/goals');
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function resubmitGoalSheet(cycleId: string): Promise<ActionResult<void>> {
  // Logic is functionally identical, just verifying they were 'returned' 
  // For simplicity, submitGoalSheet covers it as long as the status updates correctly.
  return submitGoalSheet(cycleId);
}
