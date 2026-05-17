import { getMyGoals } from '@/queries/goals';
import { getActiveCycle } from '@/queries/cycles';
import { GoalCard } from '@/components/goals/goal-card';
import { WeightageBar } from '@/components/goals/weightage-bar';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Send, AlertTriangle, Target } from 'lucide-react';
import Link from 'next/link';
import { submitGoalSheet } from '@/actions/goals';
import { STATUS_COLORS } from '@/lib/constants';
import { ProgressSummary } from '@/components/ai/progress-summary';

export const metadata = { title: 'My Goals — AtomQuest' };

export default async function GoalsPage() {
  const cycle = await getActiveCycle();
  const goals = cycle ? await getMyGoals(cycle.id) : [];
  
  const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  const goalCount = goals.length;
  
  const sheetStatus = goals.length > 0 ? goals[0].status : 'draft';
  const isLocked = sheetStatus === 'locked' || sheetStatus === 'approved' || sheetStatus === 'submitted';
  
  const weightageBreakdown = goals.map(g => ({ title: g.title, weightage: g.weightage }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Goals</h1>
            {goals.length > 0 && (
              <Badge className={STATUS_COLORS[sheetStatus] || 'bg-slate-100'}>
                {sheetStatus.replace('_', ' ').toUpperCase()}
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500">{cycle?.name || 'No active cycle'}</p>
        </div>
        
        <div className="flex gap-2">
          {!isLocked && goalCount < 8 && (
            <Button asChild variant="outline">
              <Link href="/employee/goals/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Goal
              </Link>
            </Button>
          )}
          
          {!isLocked && (
            <form action={async () => { 'use server'; await submitGoalSheet(cycle?.id || ''); }}>
              <input type="hidden" name="cycle_id" value={cycle?.id} />
              <Button 
                type="submit" 
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={totalWeightage !== 100 || goalCount === 0}
              >
                <Send className="mr-2 h-4 w-4" /> Submit for Approval
              </Button>
            </form>
          )}
        </div>
      </div>

      {sheetStatus === 'returned' && (
        <Alert variant="destructive" className="bg-orange-50 text-orange-800 border-orange-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Goal Sheet Returned</AlertTitle>
          <AlertDescription>
            Your manager has returned your goals for rework. Please adjust your targets or weightages and resubmit.
          </AlertDescription>
        </Alert>
      )}

      {goals.length > 0 ? (
        <>
          <ProgressSummary />
          
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
            <WeightageBar current={totalWeightage} max={100} goals={weightageBreakdown} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {goals.map(goal => (
              <GoalCard key={goal.id} goal={goal} showActions={!isLocked} />
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed">
          <div className="bg-indigo-100 dark:bg-indigo-900/50 p-4 rounded-full mb-4 text-indigo-600 dark:text-indigo-400">
            <Target size={32} />
          </div>
          <h3 className="text-xl font-semibold mb-2">No goals created yet</h3>
          <p className="text-slate-500 max-w-md mb-6">
            Start defining your objectives for this cycle. You can add up to 8 goals, and their combined weightage must equal exactly 100%.
          </p>
          {cycle && (
            <Button asChild>
              <Link href="/employee/goals/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Goal
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
