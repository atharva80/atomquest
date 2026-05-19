/**
 * Server Actions — Check-ins
 *
 * Quarterly check-in actions for employees and managers.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { batchCheckinSchema, managerCommentSchema } from '@/schemas/check-in';
import { handleActionError, ActionResult } from '@/lib/errors';
import { revalidatePath } from 'next/cache';
import { getActiveCycle, getCurrentQuarter } from '@/queries/cycles';

type CheckinActionInput = FormData | {
  cycle_id: string;
  quarter: string;
  checkins: Array<{
    goal_id: string;
    achievement: number | string | null;
    status: string;
    comment?: string | null;
  }>;
};

type ManagerCommentActionInput = FormData | {
  employee_id: string;
  cycle_id: string;
  quarter: string;
  comment: string;
  rating?: number;
};

function checkinInputToRaw(input: CheckinActionInput) {
  if (input instanceof FormData) {
    return {
      cycle_id: input.get('cycle_id'),
      quarter: input.get('quarter'),
      checkins: input.get('checkins') ? JSON.parse(input.get('checkins') as string) : [],
    };
  }

  return input;
}

function managerCommentInputToRaw(input: ManagerCommentActionInput) {
  if (input instanceof FormData) {
    return {
      employee_id: input.get('employee_id'),
      cycle_id: input.get('cycle_id'),
      quarter: input.get('quarter'),
      comment: input.get('comment'),
      rating: input.get('rating') ? Number(input.get('rating')) : null,
    };
  }

  return input;
}

export async function submitCheckins(formData: CheckinActionInput): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const rawData = checkinInputToRaw(formData);
    const parsedData = batchCheckinSchema.parse(rawData);

    // Enforce check-in window: must be the currently open quarter
    const cycle = await getActiveCycle();
    if (!cycle) throw new Error('No active cycle found');
    const currentQ = getCurrentQuarter(cycle);
    if (!currentQ) {
      throw new Error('No check-in window is currently open. Windows open in July (Q1), October (Q2), January (Q3), and March/April (Q4).');
    }
    if (parsedData.quarter !== currentQ) {
      throw new Error(`You can only submit check-ins for the currently open quarter (${currentQ}).`);
    }

    // Prepare upsert payload
    const upserts = parsedData.checkins.map(c => {
      const isString = typeof c.achievement === 'string';
      return {
        goal_id: c.goal_id,
        quarter: parsedData.quarter,
        achievement: isString || c.achievement === null ? null : Number(c.achievement),
        achievement_date: isString ? new Date(c.achievement as string).toISOString() : null,
        status: c.status,
        comment: c.comment
      };
    });

    // Supabase upsert requires specifying the conflict columns
    const { error } = await supabase.from('quarterly_checkins').upsert(upserts, { onConflict: 'goal_id,quarter' });
    
    if (error) throw error;

    // Audit log - check-in submitted
    const adminClient = await createAdminClient();
    await adminClient.from('audit_logs').insert({
      profile_id: user.id,
      goal_id: null,
      action: 'quarterly_checkin_submitted',
      reason: `Check-in submitted for ${parsedData.quarter} of cycle ${parsedData.cycle_id}`
    });

    // TODO: Sync to shared goals
    // We would fetch shared_goals where primary_goal_id is IN our checkins, then map the achievements.

    revalidatePath('/employee/check-ins');
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function submitManagerComment(formData: ManagerCommentActionInput): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const rawData = managerCommentInputToRaw(formData);

    const parsedData = managerCommentSchema.parse(rawData);

    const { error } = await supabase.from('manager_comments').upsert({
      profile_id: parsedData.employee_id,
      manager_id: user.id,
      cycle_id: parsedData.cycle_id,
      quarter: parsedData.quarter,
      comment: parsedData.comment,
      rating: parsedData.rating
    }, { onConflict: 'profile_id,cycle_id,quarter' });

    if (error) throw error;

    revalidatePath('/manager/check-ins');
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}
