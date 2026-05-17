/**
 * Queries — Analytics (RPC / Postgres Functions)
 *
 * Analytics data fetching using Supabase RPC calls to
 * Postgres functions.
 */

import { createClient } from '@/lib/supabase/server';
import { AchievementTrend, CompletionHeatmapCell, GoalDistribution, ManagerEffectiveness, UserRole, GoalWithCheckins } from '@/types';
import { getOverallScore } from '@/lib/utils';
import { getCycleById, getCurrentQuarter } from '@/queries/cycles';
import { getManagerStats } from '@/queries/manager';

export async function getAchievementTrend(params: { managerId?: string, cycleId: string }): Promise<AchievementTrend[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_team_achievement_trend', {
    p_manager_id: params.managerId ?? null,
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
    p_department_id: params.departmentId ?? null,
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
    const { data: goals } = await supabase.from('goals').select('*, quarterly_checkins(*)').eq('profile_id', userId).eq('cycle_id', cycleId);
    const typedGoals = (goals || []) as GoalWithCheckins[];
    const overallScore = getOverallScore(typedGoals);
    
    // Count goals that need check-ins for the current quarter
    const cycle = await getCycleById(cycleId);
    const currentQuarter = cycle ? getCurrentQuarter(cycle) : 'Q1';
    const pendingActions = typedGoals.filter(g => 
      g.status === 'locked' && 
      (!g.quarterly_checkins || !g.quarterly_checkins.some(qc => qc.quarter === currentQuarter))
    ).length;

    return {
      totalGoals: typedGoals.length,
      completedCheckins: typedGoals.reduce((acc, g) => acc + (g.quarterly_checkins?.length || 0), 0),
      overallScore: Math.round(overallScore),
      pendingActions
    };
  }
  
  if (role === 'manager') {
    const { count: teamSize } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('manager_id', userId);
    
    // Use the new getManagerStats logic
    const cycle = await getCycleById(cycleId);
    const currentQuarter = cycle ? getCurrentQuarter(cycle) : 'Q1';
    const { pendingApprovalsCount, pendingReviewsCount } = await getManagerStats(userId, cycleId, currentQuarter);

    return {
      teamSize: teamSize || 0,
      pendingApprovals: pendingApprovalsCount,
      avgTeamScore: 0, // Would need aggregate query
      overdueCheckins: pendingReviewsCount
    };
  }

  // Admin
  const { count: totalEmployees } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('role', 'admin');
  const { count: activeEscalations } = await supabase.from('escalations').select('*', { count: 'exact', head: true }).is('resolved_at', null);
  
  return {
    totalEmployees: totalEmployees || 0,
    goalCompletionRate: 0, // Complex aggregate
    activeEscalations: activeEscalations || 0,
    cycleProgress: 0
  };
}
