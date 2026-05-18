import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { getActiveCycle, getCurrentQuarter } from '@/queries/cycles';
import { getTeamMembers } from '@/queries/users';
import { getManagerStats } from '@/queries/manager';
import { ManagerStatusChart } from '@/components/dashboard/manager-chart';
import { StatCard } from '@/components/ui/stat-card';

export const metadata = { title: 'Manager Dashboard — Orbit' };

export default async function ManagerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const cycle = await getActiveCycle();
  const team = await getTeamMembers(user.id);
  
  let pendingApprovalsCount = 0;
  let pendingReviewsCount = 0;
  let statusCounts = {
    draft: 0,
    submitted: 0,
    approved: 0,
    locked: 0
  };

  if (cycle) {
    const currentQuarter = getCurrentQuarter(cycle);
    const stats = await getManagerStats(user.id, cycle.id, currentQuarter);
    pendingApprovalsCount = stats.pendingApprovalsCount;
    pendingReviewsCount = stats.pendingReviewsCount;
    statusCounts = stats.statusCounts;
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 p-6">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in">
        <div className="flex flex-col gap-2">
          <h1 className="text-[24px] font-semibold text-zinc-900 tracking-tight leading-[32px]">
            Manager Overview
          </h1>
          <p className="text-[14px] text-zinc-500 leading-[20px]">
            {cycle ? `Active cycle: ${cycle.name}` : 'No active cycle found'}
          </p>
        </div>
      </section>

      {/* Metrics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Team Size"
          value={team.length.toString()}
          icon="group"
          delayMs={100}
        >
          <Link href="/manager/team" className="ml-auto mt-1 flex items-center text-[12px] text-zinc-500 hover:text-zinc-900 transition-colors">
            View Directory <span className="material-symbols-outlined text-[14px] ml-0.5">arrow_forward</span>
          </Link>
        </StatCard>

        <StatCard 
          label="Pending Approvals"
          value={pendingApprovalsCount.toString()}
          icon="fact_check"
          trendText={pendingApprovalsCount > 0 ? "Requires action" : "All caught up"}
          trendStatus={pendingApprovalsCount > 0 ? "bad" : "good"}
          delayMs={200}
        >
          <Link href="/manager/approvals" className="ml-auto mt-1 flex items-center text-[12px] text-zinc-500 hover:text-zinc-900 transition-colors">
            Review Goals <span className="material-symbols-outlined text-[14px] ml-0.5">arrow_forward</span>
          </Link>
        </StatCard>

        <StatCard 
          label="Pending Reviews"
          value={pendingReviewsCount.toString()}
          icon="reviews"
          trendText={pendingReviewsCount > 0 ? "Requires action" : "All caught up"}
          trendStatus={pendingReviewsCount > 0 ? "bad" : "good"}
          delayMs={300}
        >
          <Link href="/manager/check-ins" className="ml-auto mt-1 flex items-center text-[12px] text-zinc-500 hover:text-zinc-900 transition-colors">
            Provide Feedback <span className="material-symbols-outlined text-[14px] ml-0.5">arrow_forward</span>
          </Link>
        </StatCard>
      </section>

      {/* Team Status Chart */}
      <section className="animate-fade-in-up-stagger" style={{ animationDelay: '400ms' }}>
        <ManagerStatusChart 
          data={[
            { name: 'Draft', value: statusCounts.draft },
            { name: 'Submitted', value: statusCounts.submitted },
            { name: 'Approved', value: statusCounts.approved },
            { name: 'Locked', value: statusCounts.locked }
          ]}
        />
      </section>
    </div>
  );
}
