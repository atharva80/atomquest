import { getMyGoals } from '@/queries/goals';
import { getActiveCycle } from '@/queries/cycles';
import { GoalCard } from '@/components/goals/goal-card';
import { WeightageBar } from '@/components/goals/weightage-bar';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';
import { submitGoalSheet } from '@/actions/goals';
import { ProgressSummary } from '@/components/ai/progress-summary';

export const metadata = { title: 'My Goals — Orbit' };

export default async function GoalsPage() {
  const cycle = await getActiveCycle();
  const goals = cycle ? await getMyGoals(cycle.id) : [];
  
  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  const goalCount = goals.length;
  
  // Determine sheet status from non-shared goals (shared goals have 'locked' status but shouldn't lock the sheet)
  const nonSharedGoals = goals.filter(g => g.status !== 'locked');
  const sheetStatus = nonSharedGoals.length > 0 ? nonSharedGoals[0].status : (goals.length > 0 ? 'draft' : 'draft');
  const isLocked = sheetStatus === 'approved' || sheetStatus === 'submitted';
  
  const weightageBreakdown = goals.map(g => ({ title: g.title, weightage: g.weightage }));

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 p-6">
      {/* Page Header & Actions */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <h2 className="text-[24px] font-semibold text-zinc-900 tracking-tight leading-[32px]">My Goals</h2>
            {goals.length > 0 && (
              <StatusBadge status={sheetStatus} />
            )}
          </div>
          <p className="text-[14px] text-zinc-500 leading-[20px]">
            {cycle?.name || 'No active cycle'} — Define and track your operational targets.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {!isLocked && (
            <form action={async () => { 'use server'; await submitGoalSheet(cycle?.id || ''); }}>
              <input type="hidden" name="cycle_id" value={cycle?.id} />
              <button 
                type="submit" 
                className="px-4 py-2 bg-white border border-zinc-200 text-zinc-900 font-medium text-[14px] leading-[20px] rounded hover:bg-zinc-50 transition-colors flex items-center gap-2 disabled:text-zinc-400 disabled:cursor-not-allowed"
                disabled={totalWeightage !== 100 || goalCount === 0}
              >
                Submit for Approval
              </button>
            </form>
          )}

          {!isLocked && goalCount < 8 && (
            <Link 
              href="/employee/goals/new"
              className="px-4 py-2 bg-zinc-900 text-white font-medium text-[14px] leading-[20px] rounded hover:bg-zinc-800 transition-colors flex items-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Goal
            </Link>
          )}
        </div>
      </section>

      {sheetStatus === 'returned' && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3">
          <span className="material-symbols-outlined text-red-600">error</span>
          <div>
            <h4 className="text-[14px] font-medium leading-[20px]">Goal Sheet Returned</h4>
            <p className="text-[14px] mt-1 leading-[20px]">Your manager has returned your goals for rework. Please adjust your targets or weightages and resubmit.</p>
          </div>
        </div>
      )}

      {goals.length > 0 ? (
        <>
          <ProgressSummary />
          
          {/* Weightage Progress Panel */}
          <WeightageBar current={totalWeightage} max={100} goals={weightageBreakdown} />

          {/* Goals Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {goals.map((goal, i) => (
              <GoalCard key={goal.id} goal={goal} showActions={!isLocked} index={i} />
            ))}
          </section>
        </>
      ) : (
        <EmptyState 
          icon="target" 
          title="No goals created yet"
          description="Start defining your objectives for this cycle. You can add up to 8 goals, and their combined weightage must equal exactly 100%."
          action={
            cycle ? (
              <Link 
                href="/employee/goals/new"
                className="mt-2 px-4 py-2 bg-zinc-900 text-white font-medium text-[14px] leading-[20px] rounded hover:bg-zinc-800 transition-colors flex items-center gap-2 shadow-sm inline-flex"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Create Your First Goal
              </Link>
            ) : null
          }
        />
      )}
    </div>
  );
}
