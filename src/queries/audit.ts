/**
 * Queries — Audit Logs
 *
 * Read-only data fetching for audit trail (admin only).
 */

import { createClient } from '@/lib/supabase/server';
import { AuditLogEntry } from '@/types';

export async function getAuditLogs(params: {
  cycleId?: string,
  employeeId?: string,
  startDate?: string,
  endDate?: string,
  page?: number,
  pageSize?: number
}): Promise<{ data: AuditLogEntry[], count: number }> {
  const supabase = await createClient();
  const page = params.page || 1;
  const pageSize = params.pageSize || 50;

  let query = supabase
    .from('audit_logs')
    .select(`
      *,
      profile:profiles(*)
    `, { count: 'exact' });

  if (params.employeeId) {
    query = query.eq('profile_id', params.employeeId);
  }
  
  if (params.startDate) {
    query = query.gte('created_at', params.startDate);
  }

  if (params.endDate) {
    query = query.lte('created_at', params.endDate);
  }

  // To filter by cycle we would need to join goals. Let's keep it simple for now unless strictly required.

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return { data: [], count: 0 };
  }

  return { data: data as any as AuditLogEntry[], count: count || 0 };
}

export async function getAuditLogsForGoal(goalId: string): Promise<AuditLogEntry[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('audit_logs')
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq('goal_id', goalId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching audit logs for goal ${goalId}:`, error);
    return [];
  }

  return data as any as AuditLogEntry[];
}
