import { getGoalById } from '@/queries/goals';
import { redirect } from 'next/navigation';
import { calculateProgressScore } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/constants';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export async function generateMetadata({ params }: { params: { goalId:string } }) {
  const goal = await getGoalById(params.goalId);
  return { title: `${goal?.title || 'Goal Detail'} — AtomQuest` };
}

export default async function GoalDetailPage({ params }: { params: { goalId: string } }) {
  const goal = await getGoalById(params.goalId);
  
  if (!goal) {
    redirect('/employee/goals?error=Goal not found');
  }

  const hasCheckins = goal.quarterly_checkins && goal.quarterly_checkins.length > 0;
  
  let score = 0;
  if (hasCheckins) {
    const latest = goal.quarterly_checkins[goal.quarterly_checkins.length - 1];
    score = calculateProgressScore(goal.uom_type, goal.target || 0, latest.achievement);
  }

  return (
    <main className="p-page-margin">
      <div className="mb-section-gap">
        <Link className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-900 font-body-sm text-body-sm mb-4 transition-colors" href="/employee/goals">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Goals
        </Link>
        <h1 className="font-page-title text-page-title text-zinc-950 mb-3">{goal.title}</h1>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-sm ${STATUS_COLORS[goal.status] || 'bg-zinc-100'}`}>
            <span className={`w-[6px] h-[6px] rounded-full ${goal.status === 'locked' ? 'bg-status-on-track' : 'bg-zinc-400'}`}></span>
            <span className="font-badge-label text-badge-label text-zinc-700">{goal.status.toUpperCase()}</span>
          </div>
          <div className="font-body-sm text-body-sm text-zinc-500 tabular-nums">{goal.weightage}% Weightage</div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-zinc-200 p-card-padding">
            <h2 className="font-section-label text-section-label tracking-widest text-zinc-500 uppercase mb-6">Quarterly Progress Histogram</h2>
            <div className="space-y-0">
              {goal.quarterly_checkins?.map(checkin => (
                <div key={checkin.id} className="flex items-start justify-between py-4 border-b border-zinc-100">
                  <div>
                    <div className="font-table-cell-primary text-table-cell-primary text-zinc-900 mb-1">
                      {checkin.quarter} Check-in 
                      <span className="text-zinc-500 font-normal ml-2">({new Date(checkin.created_at).toLocaleDateString()})</span>
                    </div>
                    <div className="font-body-relaxed text-body-relaxed text-zinc-600">
                      Achieved {checkin.achievement} vs planned target {goal.target}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-data-value-lg text-data-value-lg tabular-nums text-zinc-900">
                      {Math.round(calculateProgressScore(goal.uom_type, goal.target || 0, checkin.achievement) * 100)}%
                    </div>
                    <div className="font-caption text-caption text-status-on-track flex items-center justify-end gap-1 mt-1">
                      <span className="material-symbols-outlined text-[14px]">arrow_upward</span> Score
                    </div>
                  </div>
                </div>
              ))}
              {!hasCheckins && (
                <div className="text-center py-8 text-zinc-500">No check-ins logged yet.</div>
              )}
            </div>
          </div>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-zinc-200 p-card-padding">
            <h2 className="font-section-label text-section-label tracking-widest text-zinc-500 uppercase mb-4 flex items-center justify-between">
              Manager Alignment Comments
              <span className="material-symbols-outlined text-[16px] text-zinc-400">forum</span>
            </h2>
            <div className="text-center py-8 text-zinc-500">Manager comments will appear here when available.</div>
          </div>
        </div>
      </div>
    </main>
  );
}
