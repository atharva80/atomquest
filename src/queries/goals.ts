/**
 * Queries — Goals
 *
 * Read-only data fetching functions for goals.
 * Called from Server Components to fetch data for pages.
 * All queries go through the RLS-respecting Supabase server client.
 */

import { createClient } from '@/lib/supabase/server';
import { GoalWithCheckins, EmployeeGoalSheet, GoalStatus } from '@/types';
import { getOverallScore } from '@/lib/utils';

export async function getMyGoals(cycleId: string): Promise<GoalWithCheckins[]> {
  const supabase = await createClient();

  // Get current user ID
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('goals')
    .select(`
      *,
      quarterly_checkins (*)
    `)
    .eq('profile_id', user.id)
    .eq('cycle_id', cycleId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching my goals:', error);
    return [];
  }

  return data as GoalWithCheckins[];
}

export async function getGoalById(goalId: string): Promise<GoalWithCheckins | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('goals')
    .select(`
      *,
      quarterly_checkins (*)
    `)
    .eq('id', goalId)
    .single();

  if (error) {
    console.error('Error fetching goal by id:', error);
    return null;
  }

  return data as GoalWithCheckins;
}

export async function getGoalSheet(employeeId: string, cycleId: string): Promise<EmployeeGoalSheet | null> {
  const supabase = await createClient();

  // 1. Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', employeeId)
    .single();

  if (profileError || !profile) {
    console.error('Error fetching profile for goal sheet:', profileError);
    return null;
  }

  // 2. Fetch goals with checkins
  const { data: goals, error: goalsError } = await supabase
    .from('goals')
    .select(`
      *,
      quarterly_checkins (*)
    `)
    .eq('profile_id', employeeId)
    .eq('cycle_id', cycleId)
    .order('created_at', { ascending: true });

  if (goalsError) {
    console.error('Error fetching goals for goal sheet:', goalsError);
    return null;
  }

  const typedGoals = (goals || []) as GoalWithCheckins[];
  const overallScore = getOverallScore(typedGoals);

  // Derive goal sheet status. If any goal is returned, sheet is returned.
  // If all are locked, locked. Else use first goal status or draft if empty.
  let status: GoalStatus = 'draft';
  if (typedGoals.length > 0) {
    if (typedGoals.some(g => g.status === 'returned')) {
      status = 'returned';
    } else if (typedGoals.every(g => g.status === 'locked')) {
      status = 'locked';
    } else if (typedGoals.every(g => g.status === 'approved')) {
      status = 'approved';
    } else if (typedGoals.every(g => g.status === 'submitted')) {
      status = 'submitted';
    }
  }

  return {
    profile,
    goals: typedGoals,
    overallScore,
    status
  };
}

export async function getGoalsByStatus(cycleId: string, status: GoalStatus) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('cycle_id', cycleId)
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching goals with status ${status}:`, error);
    return [];
  }

  return data;
}

export async function getSharedGoals(cycleId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('shared_goals')
    .select(`
      *,
      primary_goal:goals(*, profile:profiles(*)),
      recipient_profile:profiles(*)
    `);
    // Note: To strictly filter by cycleId, we'd ideally join properly or filter post-fetch if the Supabase RPC/Join limits us.
    // In a real scenario we might need to filter goals by cycle_id first. Let's do it post-fetch for safety with this schema.

  if (error) {
    console.error('Error fetching shared goals:', error);
    return [];
  }

  // Filter to ensure we only get goals matching the cycleId
  const cycleFilteredData = data.filter((sg: any) => sg.primary_goal?.cycle_id === cycleId);

  return cycleFilteredData;
}
