/**
 * Queries — Analytics (RPC / Postgres Functions)
 *
 * Analytics data fetching using Supabase RPC calls to
 * Postgres functions.
 */

import { createClient } from '@/lib/supabase/server';
import { AchievementTrend, CompletionHeatmapCell, GoalDistribution, ManagerEffectiveness, UserRole } from '@/types';

export async function getAchievementTrend(params: { managerId?: string, cycleId: string }): Promise<AchievementTrend[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_team_achievement_trend', {
    p_manager_id: params.managerId,
    p_cycle_id: params.cycleId
  });

  if (error) {
    console.error('Error fetching achievement trend:', error);
    return [];
  }
  return data as unknown as AchievementTrend[];
}

export async function getCompletionHeatmap(cycleId: string): Promise<CompletionHeatmapCell[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_completion_heatmap', {
    p_cycle_id: cycleId
  });

  if (error) {
    console.error('Error fetching completion heatmap:', error);
    return [];
  }
  return data as unknown as CompletionHeatmapCell[];
}

export async function getGoalDistribution(params: { departmentId?: string, cycleId: string }): Promise<GoalDistribution[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_goal_distribution', {
    p_department_id: params.departmentId,
    p_cycle_id: params.cycleId
  });

  if (error) {
    console.error('Error fetching goal distribution:', error);
    return [];
  }
  return data as unknown as GoalDistribution[];
}

export async function getManagerEffectiveness(cycleId: string): Promise<ManagerEffectiveness[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_manager_effectiveness', {
    p_cycle_id: cycleId
  });

  if (error) {
    console.error('Error fetching manager effectiveness:', error);
    return [];
  }
  return data as unknown as ManagerEffectiveness[];
}

export async function getDashboardStats(cycleId: string, userId: string, role: UserRole) {
  const supabase = await createClient();

  if (role === 'employee') {
    const { count: totalGoals } = await supabase.from('goals').select('*', { count: 'exact', head: true }).eq('profile_id', userId).eq('cycle_id', cycleId);
    return {
      totalGoals: totalGoals || 0,
      completedCheckins: 0, // Simplified
      overallScore: 0, // Simplified
      pendingActions: 0 // Simplified
    };
  }
  
  if (role === 'manager') {
    const { count: teamSize } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('manager_id', userId);
    return {
      teamSize: teamSize || 0,
      pendingApprovals: 0,
      avgTeamScore: 0,
      overdueCheckins: 0
    };
  }

  // Admin
  const { count: totalEmployees } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'admin');
  return {
    totalEmployees: totalEmployees || 0,
    goalCompletionRate: 0,
    activeEscalations: 0,
    cycleProgress: 0
  };
}
