/**
 * Queries — Check-ins
 *
 * Read-only data fetching for quarterly check-ins.
 */

import { createClient } from '@/lib/supabase/server';
import { QuarterlyCheckin, QuarterType, ManagerComment } from '@/types';

export async function getMyCheckins(cycleId: string, quarter: QuarterType): Promise<QuarterlyCheckin[]> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Join to goals to filter by cycleId and profileId, returning the checkin
  const { data, error } = await supabase
    .from('quarterly_checkins')
    .select(`
      *,
      goal:goals!inner(cycle_id, profile_id)
    `)
    .eq('quarter', quarter)
    .eq('goal.cycle_id', cycleId)
    .eq('goal.profile_id', user.id);

  if (error) {
    console.error('Error fetching my checkins:', error);
    return [];
  }

  // Remove the joined data from the return objects to match standard QuarterlyCheckin
  return data.map((d: any) => {
    const { goal, ...rest } = d;
    return rest as QuarterlyCheckin;
  });
}

export async function getTeamCheckins(managerId: string, cycleId: string, quarter: QuarterType) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('quarterly_checkins')
    .select(`
      *,
      goal:goals!inner(
        *,
        profile:profiles!inner(
          manager_id
        )
      )
    `)
    .eq('quarter', quarter)
    .eq('goal.cycle_id', cycleId)
    .eq('goal.profile.manager_id', managerId);

  if (error) {
    console.error('Error fetching team checkins:', error);
    return [];
  }

  return data;
}

export async function getManagerComments(employeeId: string, cycleId: string): Promise<ManagerComment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('manager_comments')
    .select('*')
    .eq('profile_id', employeeId)
    .eq('cycle_id', cycleId)
    .order('quarter', { ascending: true });

  if (error) {
    console.error('Error fetching manager comments:', error);
    return [];
  }

  return data as ManagerComment[];
}

export async function getCheckinCompletionStatus(cycleId: string, quarter: QuarterType) {
  const supabase = await createClient();

  // Basic check to see who has submitted at least one checkin
  // In a real app we'd do a more complex query to see if ALL goals have checkins
  const { data: profiles, error: pError } = await supabase.from('profiles').select('id, first_name, last_name, role').neq('role', 'admin');
  
  if (pError) return [];

  const { data: checkins, error: cError } = await supabase
    .from('quarterly_checkins')
    .select('goal_id, goals!inner(profile_id)')
    .eq('quarter', quarter)
    .eq('goals.cycle_id', cycleId);

  if (cError) return [];

  const completedProfiles = new Set(checkins.map((c: any) => c.goals.profile_id));

  return profiles.map(p => ({
    employeeId: p.id,
    name: `${p.first_name} ${p.last_name}`,
    completed: completedProfiles.has(p.id)
  }));
}
