import { createClient } from '@/lib/supabase/server';
import { getActiveCycle } from '@/queries/cycles';
import { getTeamMembers } from '@/queries/users';
import { redirect } from 'next/navigation';
import ApprovalsClientPage from './client-page';
import { Goal, Profile } from '@/types';

export const metadata = { title: 'Pending Approvals — AtomQuest' };

interface ApprovalRequest {
  profile: Profile;
  goals: Goal[];
  submittedAt: string;
}

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cycle = await getActiveCycle();
  if (!cycle) {
    return <div>No active cycle.</div>;
  }

  const team = await getTeamMembers(user.id);
  const teamIds = team.map(t => t.id);

  let approvalRequests: ApprovalRequest[] = [];

  if (teamIds.length > 0) {
    const { data: submittedGoals, error } = await supabase
      .from('goals')
      .select('*, profiles(id, first_name, last_name, email, department_id)')
      .eq('cycle_id', cycle.id)
      .eq('status', 'submitted')
      .in('profile_id', teamIds);



    if (submittedGoals) {
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
      approvalRequests = Array.from(employeeMap.values());
    }
  }

  return <ApprovalsClientPage approvalRequests={approvalRequests} />;
}
