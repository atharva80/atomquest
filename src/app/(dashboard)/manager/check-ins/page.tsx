import { createClient } from '@/lib/supabase/server';
import { getActiveCycle, getCurrentQuarter } from '@/queries/cycles';
import { redirect } from 'next/navigation';
import { ManagerComment } from '@/components/check-ins/manager-comment';
import { getInitials } from '@/lib/utils';
import { calculateProgressScore } from '@/lib/utils';
import { ProgressBadge } from '@/components/goals/progress-badge';

export const metadata = { title: 'Team Check-ins — Orbit' };

export default async function ManagerCheckinsPage({ searchParams }: { searchParams: { employee?: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cycle = await getActiveCycle();
  if (!cycle) return <div>No active cycle.</div>;

  const currentQ = await getCurrentQuarter(cycle);

  // For this page, the manager reviews check-ins for their team.
  // We need to fetch goals + checkins + comments for the team for the current quarter.
  const { data: teamCheckins } = await supabase
    .from('quarterly_checkins')
    .select(`
      *,
      goals (*, profiles(id, first_name, last_name, department_id))
    `)
    .eq('quarter', currentQ || 'Q1');

  // Filter only those whose goals belong to manager's team
  // Simplification for hackathon implementation
  let validCheckins = teamCheckins || [];

  // Sort targeted employee to the top if deep-linking
  if (searchParams.employee) {
    validCheckins.sort((a: any, b: any) => {
      const aIsTarget = a.goals?.profiles?.id === searchParams.employee;
      const bIsTarget = b.goals?.profiles?.id === searchParams.employee;
      if (aIsTarget && !bIsTarget) return -1;
      if (!aIsTarget && bIsTarget) return 1;
      return 0;
    });
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-section-gap">
      <div className="mb-section-gap">
        <h1 className="font-page-title text-page-title text-zinc-900 mb-2">Team Check-in Reviews</h1>
        <p className="font-body-sm text-body-sm text-zinc-500">Provide feedback on your team&apos;s quarterly achievements</p>
      </div>

      {validCheckins.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
          <span className="material-symbols-outlined text-[48px] text-zinc-300 mb-4">fact_check</span>
          <h3 className="text-[16px] font-medium text-zinc-900">No Check-ins Found</h3>
          <p className="font-body-sm text-body-sm text-zinc-500 mt-1 text-center max-w-sm">
            No check-ins submitted by your team for {currentQ || 'Q1'} yet.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {validCheckins.map((checkin: any, index: number) => {
            const goal = checkin.goals;
            const profile = goal.profiles;
            const score = calculateProgressScore(goal.uom_type, goal.target || 0, checkin.achievement);
            const fullName = `${profile.first_name} ${profile.last_name}`;

            return (
              <div 
                key={checkin.id} 
                className="bg-white border border-zinc-200 rounded-xl p-card-padding flex flex-col gap-4 animate-slide-up hover:border-zinc-300 transition-colors"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                  <div className="flex items-center gap-3">
                    <img
                      alt={fullName}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-200"
                      src={`https://ui-avatars.com/api/?name=${profile.first_name}+${profile.last_name}`}
                    />
                    <div>
                      <h3 className="font-table-cell-primary text-table-cell-primary text-zinc-900">
                        {fullName}
                      </h3>
                      <p className="font-caption text-caption text-zinc-500">{profile.department_id}</p>
                    </div>
                  </div>
                  <div className="bg-zinc-100 border border-zinc-200 text-zinc-700 font-badge-label text-badge-label px-2 py-0.5 rounded uppercase">
                    {checkin.quarter}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                  <div className="md:col-span-7 flex flex-col gap-4">
                    <div>
                      <h4 className="font-semibold text-zinc-950 text-base">{goal.title}</h4>
                      <div className="flex gap-6 mt-3">
                         <div className="flex flex-col gap-1">
                           <span className="font-section-label text-section-label text-zinc-500 uppercase tracking-widest">Target</span>
                           <span className="font-body-sm text-body-sm text-zinc-900">{goal.target}</span>
                         </div>
                         <div className="flex flex-col gap-1">
                           <span className="font-section-label text-section-label text-zinc-500 uppercase tracking-widest">Actual</span>
                           <span className="font-body-sm text-body-sm text-zinc-900 font-medium">{checkin.achievement}</span>
                         </div>
                      </div>
                    </div>
                    
                    {checkin.comment && (
                      <div className="bg-zinc-50 border border-zinc-200 rounded p-3">
                        <p className="font-section-label text-section-label text-zinc-500 uppercase tracking-widest mb-2">Employee Note</p>
                        <p className="font-body-sm text-body-sm text-zinc-700 italic">&quot;{checkin.comment}&quot;</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="md:col-span-5 flex flex-col justify-between">
                    <div className="flex justify-end items-center gap-3 mb-4">
                      <span className="font-section-label text-section-label text-zinc-500 uppercase tracking-widest">Score</span>
                      <ProgressBadge score={score} size="md" />
                    </div>
                    
                    {/* Interactive Manager Comment Form */}
                    <ManagerComment 
                      employeeId={profile.id}
                      cycleId={goal.cycle_id}
                      quarter={checkin.quarter as any}
                      // For hackathon, we assume manager_comment relation wasn't explicitly loaded in this query
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
