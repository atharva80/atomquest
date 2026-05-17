import { redirect } from 'next/navigation';
import { getActiveCycle } from '@/queries/cycles';
import { getGoalById, getMyGoals } from '@/queries/goals';
import { createClient } from '@/lib/supabase/server';
import { GoalForm } from '@/components/goals/goal-form';

export const metadata = { title: 'Edit Goal — Orbit' };

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
    <div className="max-w-5xl mx-auto p-6">
      <GoalForm 
        thrustAreas={thrustAreas || []} 
        remainingWeightage={remainingWeightage} 
        cycleId={cycle.id}
        existingGoal={goal as any}
        mode="edit" 
        existingGoals={otherGoals}
      />
    </div>
  );
}
