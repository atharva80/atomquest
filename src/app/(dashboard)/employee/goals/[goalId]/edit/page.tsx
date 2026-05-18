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

  // Guard: Can only edit if draft, returned, or locked (for shared goals)
  const canEditStatus = goal.status === 'draft' || goal.status === 'returned' || goal.status === 'locked';
  if (!canEditStatus) {
    redirect(`/employee/goals/${goal.id}`);
  }

  // Check if this is a shared goal - more robust detection
  // Check if goal title appears in any shared_goals where user is recipient
  const { data: allSharedGoals } = await supabase
    .from('shared_goals')
    .select('primary_goal:goals(id, title, cycle_id)')
    .eq('recipient_profile_id', user?.id);

  const isRecipientCopy = allSharedGoals?.some((sg: any) => 
    sg.primary_goal?.title?.toLowerCase() === goal.title?.toLowerCase() && 
    sg.primary_goal?.cycle_id === goal.cycle_id
  ) || false;
  
  // Also check if this is a primary goal (has shared_goals entries)
  const { data: primaryCheck } = await supabase
    .from('shared_goals')
    .select('id')
    .eq('primary_goal_id', goal.id)
    .limit(1);
  
  const isPrimaryShared = !!primaryCheck && primaryCheck.length > 0;
  const isSharedGoal = isPrimaryShared || isRecipientCopy;

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
        isSharedGoal={isSharedGoal}
      />
    </div>
  );
}
