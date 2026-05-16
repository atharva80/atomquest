import { createClient } from '@/lib/supabase/server';
import { getActiveCycle } from '@/queries/cycles';
import { getTeamMembers } from '@/queries/users';
import { ApprovalCard } from '@/components/approvals/approval-card';
import { redirect } from 'next/navigation';
import { EmptyState } from '@/components/shared/empty-state';
import { FileCheck } from 'lucide-react';

export const metadata = { title: 'Pending Approvals — AtomQuest' };

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cycle = await getActiveCycle();
  if (!cycle) {
    return <div>No active cycle.</div>;
  }

  // Find team members who have submitted their goals
  const team = await getTeamMembers(user.id);
  const teamIds = team.map(t => t.id);

  if (teamIds.length === 0) {
    return <div>You don't have any team members assigned.</div>;
  }

  // Fetch submitted goals for the team
  const { data: submittedGoals, error } = await supabase
    .from('goals')
    .select('*, profiles:profile_id(id, first_name, last_name, email, department_id)')
    .eq('cycle_id', cycle.id)
    .eq('status', 'submitted')
    .in('profile_id', teamIds);

  if (!submittedGoals || submittedGoals.length === 0) {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Goal Approvals</h1>
          <p className="text-slate-500">Review and approve goal sheets submitted by your team</p>
        </div>
        
        <div className="flex flex-col items-center justify-center p-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
          <FileCheck className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">All caught up!</h3>
          <p className="text-slate-500 mt-1 text-center max-w-sm">
            There are no pending goal sheets requiring your approval at the moment.
          </p>
        </div>
      </div>
    );
  }

  // Group goals by employee
  const employeeMap = new Map();
  submittedGoals.forEach((goal: any) => {
    if (!employeeMap.has(goal.profile_id)) {
      employeeMap.set(goal.profile_id, {
        profile: goal.profiles,
        goals: [],
        submittedAt: goal.updated_at
      });
    }
    employeeMap.get(goal.profile_id).goals.push(goal);
  });

  const approvalRequests = Array.from(employeeMap.values());

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Goal Approvals</h1>
        <p className="text-slate-500">Review and approve goal sheets submitted by your team</p>
      </div>

      <div className="space-y-4">
        {approvalRequests.map((req: any) => (
          <ApprovalCard 
            key={req.profile.id}
            employee={req.profile}
            goals={req.goals}
            submittedAt={req.submittedAt}
            cycleId={cycle.id}
          />
        ))}
      </div>
    </div>
  );
}
