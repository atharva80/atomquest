import { createClient } from '@/lib/supabase/server';
import { Card, Metric, Text, Title, DonutChart } from '@tremor/react';
import Link from 'next/link';
import { Users, FileCheck, MessageSquare, ArrowRight } from 'lucide-react';
import { getActiveCycle } from '@/queries/cycles';
import { getTeamMembers } from '@/queries/users';
import { ManagerStatusChart } from '@/components/dashboard/manager-chart';

export const metadata = { title: 'Manager Dashboard — AtomQuest' };

export default async function ManagerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const cycle = await getActiveCycle();
  const team = await getTeamMembers(user.id);
  
  // For demo: Mock counts. In real implementation, these would come from specific queries like getPendingApprovalsCount()
  const pendingApprovalsCount = 2;
  const pendingReviewsCount = 3;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Manager Overview
          </h1>
          <p className="text-slate-500 mt-1">
            {cycle ? `Active cycle: ${cycle.name}` : 'No active cycle found'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-indigo-500" />
            <Text>Team Size</Text>
          </div>
          <Metric>{team.length}</Metric>
          <div className="mt-4">
            <Link href="/manager/team" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
              View Directory <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
        </Card>
        
        <Card className="ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="h-5 w-5 text-orange-500" />
            <Text>Pending Goal Approvals</Text>
          </div>
          <Metric>{pendingApprovalsCount}</Metric>
          <div className="mt-4">
            <Link href="/manager/approvals" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
              Review Goals <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
        </Card>

        <Card className="ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-5 w-5 text-emerald-500" />
            <Text>Check-ins to Review</Text>
          </div>
          <Metric>{pendingReviewsCount}</Metric>
          <div className="mt-4">
            <Link href="/manager/check-ins" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
              Provide Feedback <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Simplified Team Status Chart */}
      <ManagerStatusChart 
        data={[
          { name: 'Draft', value: 2 },
          { name: 'Submitted', value: pendingApprovalsCount },
          { name: 'Approved', value: 1 },
          { name: 'Locked', value: Math.max(1, team.length - 3 - pendingApprovalsCount) }
        ]}
      />
    </div>
  );
}
