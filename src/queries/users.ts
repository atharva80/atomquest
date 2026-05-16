/**
 * Queries — Users / Profiles
 *
 * Read-only data fetching for user profiles and team structures.
 */

import { createClient } from '@/lib/supabase/server';
import { Profile, TeamMember, Department, ThrustArea } from '@/types';
import { getOverallScore } from '@/lib/utils';
import { GoalWithCheckins } from '@/types';

export async function getCurrentUser(): Promise<Profile | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching current user profile:', error);
    return null;
  }

  return data as Profile;
}

export async function getTeamMembers(managerId: string, cycleId?: string): Promise<TeamMember[]> {
  const supabase = await createClient();

  // Fetch the profiles that report to this manager
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('manager_id', managerId);

  if (profileError || !profiles) {
    console.error('Error fetching team members:', profileError);
    return [];
  }

  const teamMembers: TeamMember[] = [];

  // For each team member, if a cycle is provided, fetch their goals to compute goal count and scores
  for (const profile of profiles) {
    let goalCount = 0;
    let overallScore = 0;
    let checkInStatus: any = 'not_started';

    if (cycleId) {
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select(`
          *,
          quarterly_checkins (*)
        `)
        .eq('profile_id', profile.id)
        .eq('cycle_id', cycleId);

      if (!goalsError && goals) {
        const typedGoals = goals as GoalWithCheckins[];
        goalCount = typedGoals.length;
        overallScore = getOverallScore(typedGoals);

        // Derive high level check-in status (simplified logic for demo)
        const hasCompletedCheckin = typedGoals.some(g => 
          g.quarterly_checkins && g.quarterly_checkins.some(qc => qc.status === 'completed')
        );
        const hasOnTrackCheckin = typedGoals.some(g => 
          g.quarterly_checkins && g.quarterly_checkins.some(qc => qc.status === 'on_track')
        );

        if (hasCompletedCheckin) checkInStatus = 'completed';
        else if (hasOnTrackCheckin) checkInStatus = 'on_track';
      }
    }

    teamMembers.push({
      ...profile,
      goalCount,
      overallScore,
      checkInStatus
    });
  }

  return teamMembers;
}

export async function getAllUsers(): Promise<Profile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('first_name', { ascending: true });

  if (error) {
    console.error('Error fetching all users:', error);
    return [];
  }

  return data as Profile[];
}

export async function getUsersByDepartment(departmentId: string): Promise<Profile[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('department_id', departmentId)
    .order('first_name', { ascending: true });

  if (error) {
    console.error('Error fetching users by department:', error);
    return [];
  }

  return data as Profile[];
}

export async function getDepartments(): Promise<Department[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching departments:', error);
    return [];
  }

  return data as Department[];
}

export async function getThrustAreas(): Promise<ThrustArea[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('thrust_areas')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching thrust areas:', error);
    return [];
  }

  return data as ThrustArea[];
}
