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
  
  // Direct query instead of RPC to handle null case properly
  let query = supabase
    .from('quarterly_checkins')
    .select(`
      quarter,
      achievement,
      goals!inner(cycle_id, profile_id)
    `)
    .eq('goals.cycle_id', params.cycleId)
    .eq('status', 'completed');

  if (params.managerId) {
    query = query.eq('goals.profile_id', params.managerId);
  }

  const { data: checkins, error } = await query;

  if (error) {
    console.error('Error fetching achievement trend:', error);
    return [];
  }

  // Aggregate by quarter
  const quarterMap = new Map<string, { total: number; count: number }>();
  (checkins || []).forEach((c: any) => {
    const q = c.quarter;
    const existing = quarterMap.get(q) || { total: 0, count: 0 };
    existing.total += Number(c.achievement) || 0;
    existing.count += 1;
    quarterMap.set(q, existing);
  });

  const result: AchievementTrend[] = [];
  quarterMap.forEach((value, quarter) => {
    result.push({
      quarter: quarter as any,
      avg_score: value.count > 0 ? value.total / value.count / 100 : 0,
      count: value.count
    });
  });

  return result.sort((a, b) => a.quarter.localeCompare(b.quarter));
}

export async function getCompletionHeatmap(cycleId: string): Promise<CompletionHeatmapCell[]> {
  const supabase = await createClient();
  
  // Direct query to get completion rate by department
  const { data: checkins, error } = await supabase
    .from('quarterly_checkins')
    .select(`
      quarter,
      achievement,
      goals!inner(id, cycle_id, profile_id, thrust_area_id)
    `)
    .eq('goals.cycle_id', cycleId)
    .eq('status', 'completed');

  if (error) {
    console.error('Error fetching completion heatmap:', error);
    return [];
  }

  // Get unique departments
  const { data: departments } = await supabase
    .from('departments')
    .select('id, name');

  const deptMap = new Map((departments || []).map(d => [d.id, d.name]));

  // Aggregate by quarter (heatmap style)
  const result: CompletionHeatmapCell[] = [];
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  
  // For now, group all as "Organization" since profiles may not have departments
  const orgData: Record<string, { total: number; count: number }> = {};
  quarters.forEach(q => orgData[q] = { total: 0, count: 0 });
  
  (checkins || []).forEach((c: any) => {
    const q = c.quarter;
    if (orgData[q]) {
      orgData[q].total += Number(c.achievement) || 0;
      orgData[q].count += 1;
    }
  });

  quarters.forEach(q => {
    if (orgData[q].count > 0) {
      result.push({
        department: 'Organization',
        quarter: q as any,
        completion_rate: orgData[q].total / orgData[q].count / 100
      });
    }
  });

  return result;
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
  
  // Get all managers with their team stats
  const { data: managers, error: mError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('role', 'manager');

  if (mError || !managers) {
    console.error('Error fetching managers:', mError);
    return [];
  }

  const result: ManagerEffectiveness[] = [];

  for (const manager of managers) {
    // Get team size
    const { count: teamSize } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('manager_id', manager.id);

    // Get check-in completion for this manager's team
    const { data: checkins } = await supabase
      .from('quarterly_checkins')
      .select(`
        achievement,
        goals!inner(cycle_id, profile_id, profiles!inner(manager_id))
      `)
      .eq('goals.cycle_id', cycleId)
      .eq('status', 'completed')
      .eq('goals.profiles.manager_id', manager.id);

    const completedCount = (checkins || []).length;
    const totalGoals = teamSize || 0;
    
    // Calculate avg team score
    const totalScore = (checkins || []).reduce((sum, c) => sum + (Number(c.achievement) || 0), 0);
    const avgScore = completedCount > 0 ? totalScore / completedCount / 100 : 0;

    result.push({
      first_name: manager.first_name,
      last_name: manager.last_name,
      manager_id: manager.id,
      check_in_completion_rate: totalGoals > 0 ? completedCount / totalGoals : 0,
      avg_team_score: avgScore,
      teamSize: teamSize || 0
    });
  }

  return result;
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
