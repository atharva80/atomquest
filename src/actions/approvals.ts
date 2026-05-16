/**
 * Server Actions — Approvals
 *
 * Manager approval workflow actions for goal sheets.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { approveGoalSheetSchema, unlockGoalSheetSchema } from '@/schemas/approval';
import { handleActionError, ActionResult } from '@/lib/errors';
import { revalidatePath } from 'next/cache';
import { VALIDATION } from '@/lib/constants';

export async function approveOrReturnGoalSheet(formData: FormData): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const rawData = {
      employee_id: formData.get('employee_id'),
      cycle_id: formData.get('cycle_id'),
      action: formData.get('action'),
      comment: formData.get('comment'),
      // Assuming goal_edits is passed as a JSON string from the client form if there are inline edits
      goal_edits: formData.get('goal_edits') ? JSON.parse(formData.get('goal_edits') as string) : undefined
    };

    const parsedData = approveGoalSheetSchema.parse(rawData);

    // Verify manager relationship (RLS usually handles this, but good to be safe)
    const { data: employee } = await supabase.from('profiles').select('manager_id').eq('id', parsedData.employee_id).single();
    if (employee?.manager_id !== user.id) {
      throw new Error('You are not authorized to approve goals for this employee');
    }

    if (parsedData.action === 'approved') {
      // 1. Apply edits if any
      if (parsedData.goal_edits && parsedData.goal_edits.length > 0) {
        // Must validate that the new total weightage still equals 100
        const { data: currentGoals } = await supabase.from('goals').select('id, weightage').eq('profile_id', parsedData.employee_id).eq('cycle_id', parsedData.cycle_id);
        if (currentGoals) {
          let newTotal = 0;
          for (const cg of currentGoals) {
            const edit = parsedData.goal_edits.find(e => e.goal_id === cg.id);
            newTotal += edit?.weightage !== undefined ? edit.weightage : Number(cg.weightage);
          }
          if (newTotal !== VALIDATION.TOTAL_WEIGHTAGE) {
            throw new Error(`Total weightage after edits must equal ${VALIDATION.TOTAL_WEIGHTAGE}%. Current sum is ${newTotal}%`);
          }

          // Apply edits
          for (const edit of parsedData.goal_edits) {
            const updates: any = {};
            if (edit.weightage !== undefined) updates.weightage = edit.weightage;
            if (edit.target !== undefined) {
              // Note: need to handle uom_type here ideally, but keeping it simple for the action demo
              updates.target = edit.target;
            }
            if (Object.keys(updates).length > 0) {
              await supabase.from('goals').update(updates).eq('id', edit.goal_id);
            }
          }
        }
      }

      // 2. Update status to approved
      await supabase.from('goals').update({ status: 'approved' })
        .eq('profile_id', parsedData.employee_id)
        .eq('cycle_id', parsedData.cycle_id);

    } else if (parsedData.action === 'returned') {
      // Update status to returned
      await supabase.from('goals').update({ status: 'returned' })
        .eq('profile_id', parsedData.employee_id)
        .eq('cycle_id', parsedData.cycle_id);
    }

    // Insert approval record
    await supabase.from('approvals').insert({
      profile_id: parsedData.employee_id,
      manager_id: user.id,
      cycle_id: parsedData.cycle_id,
      action: parsedData.action,
      comment: parsedData.comment
    });

    revalidatePath('/manager/approvals');
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function lockGoalSheet(employeeId: string, cycleId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: goals, error } = await supabase.from('goals').select('status').eq('profile_id', employeeId).eq('cycle_id', cycleId);
    if (error || !goals) throw new Error('Failed to fetch goals');

    if (goals.some(g => g.status !== 'approved')) {
      throw new Error('All goals must be approved before locking');
    }

    await supabase.from('goals').update({ status: 'locked' }).eq('profile_id', employeeId).eq('cycle_id', cycleId);

    await supabase.from('approvals').insert({
      profile_id: employeeId,
      manager_id: user.id,
      cycle_id: cycleId,
      action: 'locked'
    });

    revalidatePath('/manager/approvals');
    revalidatePath('/admin/cycles');
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function unlockGoalSheet(formData: FormData): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const rawData = {
      employee_id: formData.get('employee_id'),
      cycle_id: formData.get('cycle_id'),
      reason: formData.get('reason'),
    };

    const parsedData = unlockGoalSheetSchema.parse(rawData);

    // Update goals status
    await supabase.from('goals').update({ status: 'approved' })
      .eq('profile_id', parsedData.employee_id)
      .eq('cycle_id', parsedData.cycle_id);

    // Insert approval log
    await supabase.from('approvals').insert({
      profile_id: parsedData.employee_id,
      manager_id: user.id,
      cycle_id: parsedData.cycle_id,
      action: 'unlocked',
      comment: parsedData.reason
    });

    // We can't insert into audit_log from the client using the standard client due to RLS,
    // so we either use a Postgres trigger (which we don't have for general unlocks, only goal changes)
    // or we'd use the admin client here. For simplicity, skipping explicit audit insert 
    // unless admin client is strictly required.

    revalidatePath('/admin/users');
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}
