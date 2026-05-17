import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { getMyGoals } from '@/queries/goals';
import { getActiveCycle } from '@/queries/cycles';
import { calculateProgressScore } from '@/lib/utils';

export const metadata = { title: 'Performance Audit — AtomQuest' };

export default async function AuditPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Not logged in</div>;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, department:department_id(name)')
    .eq('id', user.id)
    .single();

  const cycle = await getActiveCycle();
  const goals = cycle ? await getMyGoals(cycle.id) : [];

  let overallScore = 0;
  const chartData = goals.map(g => {
    let score = 0;
    if (g.quarterly_checkins && g.quarterly_checkins.length > 0) {
      const latest = g.quarterly_checkins[g.quarterly_checkins.length - 1];
      score = calculateProgressScore(g.uom_type, g.target || 0, latest.achievement);
    }
    overallScore += score * (g.weightage / 100);
    return {
      name: g.title.substring(0, 20) + '...',
      "Score (%)": Math.round(score * 100)
    };
  });

  const performanceHistory = [
    { quarter: "Q1 '23", score: 85 },
    { quarter: "Q2 '23", score: 92 },
    { quarter: "Q3 '23 (Current)", score: 97.6 },
  ];

  return (
    <main className="flex-1 p-page-margin max-w-5xl w-full mx-auto">
      <Link className="inline-flex items-center gap-1 text-zinc-500 hover:text-zinc-900 transition-colors font-body-sm text-body-sm mb-6" href="#">
        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>arrow_back</span>
        Back to My Team Directory
      </Link>
      <div className="flex items-end justify-between mb-8 pb-6 border-b border-zinc-200">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-zinc-100 rounded-full border border-zinc-200 flex items-center justify-center">
            <span className="text-xl font-medium text-zinc-700 tracking-tight">
              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
            </span>
          </div>
          <div>
            <h2 className="font-page-title text-page-title font-semibold text-zinc-900 mb-1">
              {profile?.first_name} {profile?.last_name}
            </h2>
            <div className="flex items-center gap-2">
              <span className="font-body-sm text-body-sm text-zinc-500">{profile?.department?.name}</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-section-label text-section-label text-zinc-500 uppercase tracking-widest mb-1">
            Q1 Aggregate Score
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="w-2 h-2 rounded-full bg-status-on-track"></span>
            <span className="font-data-value-lg text-data-value-lg tabular-nums text-zinc-900">
              {Math.round(overallScore * 100)}%
            </span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-lg p-card-padding">
          <h3 className="font-section-label text-section-label tracking-widest uppercase text-zinc-500 mb-6">
            CUMULATIVE PERFORMANCE HISTORY
          </h3>
          <div className="h-64 flex items-end gap-8 pb-8 pt-4 px-4 border-b border-zinc-200 relative">
            {performanceHistory.map((item, i) => (
              <div key={item.quarter} className="flex-1 flex flex-col justify-end items-center h-full group relative">
                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-zinc-900 text-white font-caption text-caption px-2 py-1 rounded transition-opacity">
                  {item.score}%
                </div>
                {/* Bar */}
                <div 
                  className="w-16 bg-zinc-800 rounded-t-sm transition-all duration-500 group-hover:bg-zinc-900" 
                  style={{ height: `${item.score}%` }}
                ></div>
                {/* Label */}
                <div className="absolute -bottom-7 font-caption text-caption text-zinc-500">
                  {item.quarter}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white border border-zinc-200 rounded-lg p-card-padding">
            <h3 className="font-section-label text-section-label tracking-widest uppercase text-zinc-500 mb-4">
              Current Status
            </h3>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-zinc-100 border border-zinc-200">
              <span className="w-1.5 h-1.5 rounded-full bg-status-on-track"></span>
              <span className="font-badge-label text-badge-label text-zinc-700">Exceeding Expectations</span>
            </div>
            <p className="mt-4 font-body-sm text-body-sm text-zinc-600">
              Consistently delivering above target metrics across primary OKRs for the past 3 quarters.
            </p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-lg p-card-padding">
            <h3 className="font-section-label text-section-label tracking-widest uppercase text-zinc-500 mb-4">
              Key Strengths
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-zinc-400" style={{ fontSize: '16px', marginTop: '2px' }}>check</span>
                <span className="font-body-sm text-body-sm text-zinc-700">Cross-functional collaboration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-zinc-400" style={{ fontSize: '16px', marginTop: '2px' }}>check</span>
                <span className="font-body-sm text-body-sm text-zinc-700">System design documentation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="material-symbols-outlined text-zinc-400" style={{ fontSize: '16px', marginTop: '2px' }}>check</span>
                <span className="font-body-sm text-body-sm text-zinc-700">Mentoring junior staff</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="mt-6 bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <div className="px-card-padding py-4 border-b border-zinc-200 bg-zinc-50/50 flex justify-between items-center">
          <h3 className="font-section-heading text-section-heading font-medium text-zinc-900">Q3 Active Goals</h3>
          <button className="text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors">View All</button>
        </div>
        <div className="divide-y divide-zinc-200">
          {goals.map(goal => {
            const score = (goal.quarterly_checkins && goal.quarterly_checkins.length > 0)
              ? calculateProgressScore(goal.uom_type, goal.target || 0, goal.quarterly_checkins[goal.quarterly_checkins.length - 1].achievement)
              : 0;
            return (
              <div key={goal.id} className="p-card-padding hover:bg-zinc-50/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-table-cell-primary text-table-cell-primary text-zinc-900">{goal.title}</h4>
                    <p className="font-caption text-caption text-zinc-500 mt-1">{goal.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-table-cell-primary text-table-cell-primary tabular-nums text-zinc-900">
                      {Math.round(score * 100)}%
                    </div>
                  </div>
                </div>
                <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-status-on-track h-full rounded-full" style={{ width: `${score * 100}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
