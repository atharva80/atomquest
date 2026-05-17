import { redirect } from 'next/navigation';
import { getActiveCycle } from '@/queries/cycles';
import { getGoalById, getMyGoals } from '@/queries/goals';
import { createClient } from '@/lib/supabase/server';
import { GoalForm } from '@/components/goals/goal-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const metadata = { title: 'Edit Goal — AtomQuest' };

export default async function EditGoalPage({ params }: { params: { goalId: string } }) {
  const supabase = await createClient();
  const goal = await getGoalById(params.goalId);
  const cycle = await getActiveCycle();
  
  if (!goal || !cycle) {
    redirect('/employee/goals');
  }

  // Security: Ensure the goal belongs to the user
  const { data: { user } } = await supabase.auth.getUser();
  if (goal.profile_id !== user?.id) {
    redirect('/employee/goals');
  }

  // Guard: Can only edit if draft or returned
  if (goal.status !== 'draft' && goal.status !== 'returned') {
    redirect(`/employee/goals/${goal.id}`);
  }

  const goals = await getMyGoals(cycle.id);
  const otherGoals = goals.filter(g => g.id !== goal.id);
  const currentWeightage = otherGoals.reduce((sum, g) => sum + g.weightage, 0);
  const remainingWeightage = 100 - currentWeightage;

  // Fetch thrust areas
  const { data: thrustAreas } = await supabase.from('thrust_areas').select('*').order('name');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Goal</h1>
        <p className="text-slate-500">Update parameters for your goal in {cycle.name}</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800">
          <CardTitle>Goal Details</CardTitle>
          <CardDescription>Update the parameters for this goal.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <GoalForm 
            thrustAreas={thrustAreas || []} 
            remainingWeightage={remainingWeightage} 
            cycleId={cycle.id}
            existingGoal={goal as any}
            mode="edit" 
          />
        </CardContent>
      </Card>
    </div>
  );
}
