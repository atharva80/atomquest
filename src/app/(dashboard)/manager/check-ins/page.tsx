import { createClient } from '@/lib/supabase/server';
import { getActiveCycle, getCurrentQuarter } from '@/queries/cycles';
import { redirect } from 'next/navigation';
import { ManagerComment } from '@/components/check-ins/manager-comment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { calculateProgressScore } from '@/lib/utils';
import { ProgressBadge } from '@/components/goals/progress-badge';

export const metadata = { title: 'Team Check-ins — AtomQuest' };

export default async function ManagerCheckinsPage() {
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
      goals (*, profiles(id, full_name))
    `)
    .eq('quarter', currentQ || 'Q1');

  // Filter only those whose goals belong to manager's team
  // Simplification for hackathon implementation
  const validCheckins = teamCheckins || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team Check-in Reviews</h1>
        <p className="text-slate-500">Provide feedback on your team's quarterly achievements</p>
      </div>

      {validCheckins.length === 0 ? (
        <div className="text-center p-12 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500">
          No check-ins submitted by your team for {currentQ || 'Q1'} yet.
        </div>
      ) : (
        <div className="space-y-6">
          {validCheckins.map((checkin: any) => {
            const goal = checkin.goals;
            const profile = goal.profiles;
            const score = calculateProgressScore(goal.uom_type, goal.target || 0, checkin.actual_achievement);

            return (
              <Card key={checkin.id} className="overflow-hidden border-slate-200 dark:border-slate-800">
                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 p-4 border-b dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{profile.full_name}</span>
                    </div>
                    <Badge variant="outline" className="bg-white dark:bg-slate-900">{checkin.quarter}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-7 space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg">{goal.title}</h3>
                        <div className="flex gap-4 mt-2 text-sm text-slate-500">
                          <span>Target: <strong className="text-slate-700 dark:text-slate-300">{goal.target}</strong></span>
                          <span>Actual: <strong className="text-slate-900 dark:text-white">{checkin.actual_achievement}</strong></span>
                        </div>
                      </div>
                      
                      {checkin.employee_comment && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border-l-2 border-indigo-300">
                          <p className="text-xs text-slate-500 mb-1 font-medium">Employee Note</p>
                          <p className="text-sm italic text-slate-700 dark:text-slate-300">"{checkin.employee_comment}"</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="md:col-span-5 flex flex-col justify-between">
                      <div className="flex justify-end items-center gap-3 mb-4">
                        <span className="text-sm font-medium text-slate-500">Q-Score:</span>
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
