/**
 * Queries — Cycles
 *
 * Read-only data fetching for performance cycles.
 */

import { createClient } from '@/lib/supabase/server';
import { Cycle, QuarterType } from '@/types';

export async function getActiveCycle(): Promise<Cycle | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cycles')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching active cycle:', error);
    }
    return null;
  }

  return data as Cycle;
}

export async function getAllCycles(): Promise<Cycle[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cycles')
    .select('*')
    .order('start_date', { ascending: false });

  if (error) {
    console.error('Error fetching all cycles:', error);
    return [];
  }

  return data as Cycle[];
}

export async function getCycleById(cycleId: string): Promise<Cycle | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('cycles')
    .select('*')
    .eq('id', cycleId)
    .single();

  if (error) {
    console.error(`Error fetching cycle ${cycleId}:`, error);
    return null;
  }

  return data as Cycle;
}

export function getCurrentQuarter(cycle: Cycle): QuarterType | null {
  const now = new Date();

  if (now >= new Date(cycle.q1_start) && now <= new Date(cycle.q1_end)) return 'Q1';
  if (now >= new Date(cycle.q2_start) && now <= new Date(cycle.q2_end)) return 'Q2';
  if (now >= new Date(cycle.q3_start) && now <= new Date(cycle.q3_end)) return 'Q3';
  if (now >= new Date(cycle.q4_start) && now <= new Date(cycle.q4_end)) return 'Q4';

  return null; // Not currently in a specific quarter window
}
