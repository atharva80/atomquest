/**
 * Server Actions — Check-ins
 *
 * Quarterly check-in actions for employees and managers.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { batchCheckinSchema, managerCommentSchema } from '@/schemas/check-in';
import { handleActionError, ActionResult } from '@/lib/errors';
import { revalidatePath } from 'next/cache';

export async function submitCheckins(formData: FormData): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const rawData = {
      cycle_id: formData.get('cycle_id'),
      quarter: formData.get('quarter'),
      checkins: formData.get('checkins') ? JSON.parse(formData.get('checkins') as string) : []
    };

    const parsedData = batchCheckinSchema.parse(rawData);

    // Prepare upsert payload
    const upserts = parsedData.checkins.map(c => {
      const isString = typeof c.actual_achievement === 'string';
      return {
        goal_id: c.goal_id,
        quarter: parsedData.quarter,
        achievement: isString ? null : c.actual_achievement,
        achievement_date: isString ? new Date(c.actual_achievement as string).toISOString() : null,
        status: c.progress_status,
        comment: c.employee_comment
      };
    });

    // Supabase upsert requires specifying the conflict columns
    const { error } = await supabase.from('quarterly_checkins').upsert(upserts, { onConflict: 'goal_id,quarter' });
    
    if (error) throw error;

    // TODO: Sync to shared goals
    // We would fetch shared_goals where primary_goal_id is IN our checkins, then map the achievements.

    revalidatePath('/employee/check-ins');
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function submitManagerComment(formData: FormData): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const rawData = {
      employee_id: formData.get('employee_id'),
      cycle_id: formData.get('cycle_id'),
      quarter: formData.get('quarter'),
      comment: formData.get('comment'),
      rating: formData.get('rating') ? Number(formData.get('rating')) : null,
    };

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
