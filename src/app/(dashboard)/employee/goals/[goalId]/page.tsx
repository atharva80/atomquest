import { getGoalById } from '@/queries/goals';
import { getActiveCycle, getCurrentQuarter } from '@/queries/cycles';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { calculateProgressScore } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/constants';
import { ProgressBadge } from '@/components/goals/progress-badge';
import { CheckinTimeline } from '@/components/check-ins/check-in-timeline';
import { Edit, ArrowLeft, Target, Activity, FileText } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: { goalId: string } }) {
  return { title: 'Goal Detail — AtomQuest' };
}

export default async function GoalDetailPage({ params }: { params: { goalId: string } }) {
  const goal = await getGoalById(params.goalId);
  
  if (!goal) {
    redirect('/employee/goals?error=Goal not found');
  }

  const isDraft = goal.status === 'draft' || goal.status === 'returned';
  const hasCheckins = goal.quarterly_checkins && goal.quarterly_checkins.length > 0;
  
  let score = 0;
  if (hasCheckins) {
    const latest = goal.quarterly_checkins[goal.quarterly_checkins.length - 1];
    score = calculateProgressScore(goal.uom_type, goal.target || 0, latest.achievement);
  }

  const cycle = await getActiveCycle();
  const currentQuarter = cycle ? getCurrentQuarter(cycle) : 'Q1';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/employee/goals"><ArrowLeft size={18} /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white line-clamp-1">{goal.title}</h1>
              <Badge className={STATUS_COLORS[goal.status] || 'bg-slate-100'}>
                {goal.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
              <Target size={14} /> {(goal as any).thrust_areas?.name || 'Thrust Area'}
            </p>
          </div>
        </div>
        
        {isDraft && (
          <Button asChild variant="outline">
            <Link href={`/employee/goals/${goal.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" /> Edit Goal
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText size={16} className="text-indigo-500" /> Goal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1 uppercase tracking-wider text-xs">Description</p>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{goal.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-slate-800">
                <div>
                  <p className="text-muted-foreground mb-1 uppercase tracking-wider text-xs">Target</p>
                  <p className="font-semibold text-base">{goal.target !== null ? goal.target : 'N/A'}</p>
                  <p className="text-xs text-muted-foreground capitalize">{goal.uom_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1 uppercase tracking-wider text-xs">Weightage</p>
                  <p className="font-semibold text-base">{goal.weightage}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity size={16} className="text-indigo-500" /> Current Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center justify-center min-h-[160px]">
              {hasCheckins ? (
                <>
                  <ProgressBadge score={score} size="lg" />
                  <p className="text-xs text-slate-500 mt-4 text-center">
                    Based on the latest check-in
                  </p>
                </>
              ) : (
                <div className="text-center text-slate-500">
                  <p className="italic">No progress logged yet.</p>
                  {goal.status === 'locked' && (
                    <p className="text-xs mt-2">Log your first check-in from the Check-ins tab.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline */}
        <div className="md:col-span-2">
          <Card className="h-full border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Check-in Timeline</CardTitle>
              <CardDescription>Quarterly achievement history</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-8">
              {goal.status === 'locked' || goal.status === 'approved' ? (
                <CheckinTimeline 
                  goal={goal} 
                  checkins={goal.quarterly_checkins || []} 
                  currentQuarter={currentQuarter || 'Q1'}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
                  <CalendarClock className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
                  <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300">Timeline Not Available</h3>
                  <p className="text-slate-500 max-w-sm mt-1">
                    The check-in timeline will appear once this goal sheet is approved and locked.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Temporary import for the placeholder icon above
import { CalendarClock } from 'lucide-react';
