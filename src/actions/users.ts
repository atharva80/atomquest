/**
 * Server Actions — User Management
 *
 * Admin-only user/profile management actions.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { updateProfileSchema, bulkAssignManagerSchema } from '@/schemas/user';
import { handleActionError, ActionResult } from '@/lib/errors';
import { revalidatePath } from 'next/cache';
import { Profile } from '@/types';

export async function updateProfile(userId: string, formData: FormData): Promise<ActionResult<Profile>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Assume RLS handles admin check
    const rawData = Object.fromEntries(formData.entries());
    const parsedData = updateProfileSchema.parse(rawData);

    const { data, error } = await supabase
      .from('profiles')
      .update(parsedData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/admin/users');
    return { success: true, data: data as Profile };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function bulkAssignManager(formData: FormData): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const rawData = {
      employee_ids: JSON.parse(formData.get('employee_ids') as string),
      manager_id: formData.get('manager_id')
    };
    
    const parsedData = bulkAssignManagerSchema.parse(rawData);

    const { error } = await supabase
      .from('profiles')
      .update({ manager_id: parsedData.manager_id })
      .in('id', parsedData.employee_ids);

    if (error) throw error;

    revalidatePath('/admin/users');
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}
