/**
 * Server Actions — Cycles
 *
 * Admin-only cycle (performance period) management actions.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { createCycleSchema, updateCycleSchema } from '@/schemas/cycle';
import { handleActionError, ActionResult } from '@/lib/errors';
import { revalidatePath } from 'next/cache';
import { Cycle } from '@/types';

export async function createCycle(formData: FormData): Promise<ActionResult<Cycle>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const rawData = Object.fromEntries(formData.entries());
    const parsedData = createCycleSchema.parse({
      ...rawData,
      is_active: formData.get('is_active') === 'true' || formData.get('is_active') === 'on'
    });

    if (parsedData.is_active) {
      await supabase.from('cycles').update({ is_active: false }).neq('is_active', false); // crude way to deactivate all
    }

    const { data, error } = await supabase.from('cycles').insert(parsedData).select().single();
    if (error) throw error;

    revalidatePath('/admin/cycles');
    return { success: true, data: data as Cycle };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function updateCycle(cycleId: string, formData: FormData): Promise<ActionResult<Cycle>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const rawData = Object.fromEntries(formData.entries());
    // Only pass values that are present in the FormData to partial schema
    const dataToParse: any = {};
    for (const [k, v] of Object.entries(rawData)) {
      if (v !== '' && v !== null) {
        dataToParse[k] = v;
      }
    }
    
    // Explicitly handle boolean
    if (formData.has('is_active')) {
      dataToParse.is_active = formData.get('is_active') === 'true' || formData.get('is_active') === 'on';
    }

    const parsedData = updateCycleSchema.parse(dataToParse);

    if (parsedData.is_active) {
       await supabase.from('cycles').update({ is_active: false }).neq('id', cycleId);
    }

    const { data, error } = await supabase.from('cycles').update(parsedData).eq('id', cycleId).select().single();
    if (error) throw error;

    revalidatePath('/admin/cycles');
    return { success: true, data: data as Cycle };
  } catch (error) {
    return handleActionError(error);
  }
}

export async function deleteCycle(cycleId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Prevent deletion if goals exist
    const { count } = await supabase.from('goals').select('*', { count: 'exact', head: true }).eq('cycle_id', cycleId);
    if (count !== null && count > 0) {
      throw new Error('Cannot delete cycle because goals exist within it');
    }

    const { error } = await supabase.from('cycles').delete().eq('id', cycleId);
    if (error) throw error;

    revalidatePath('/admin/cycles');
    return { success: true, data: undefined };
  } catch (error) {
    return handleActionError(error);
  }
}
