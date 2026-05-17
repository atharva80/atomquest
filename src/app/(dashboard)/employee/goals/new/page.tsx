import { redirect } from 'next/navigation';
import { getActiveCycle } from '@/queries/cycles';
import { getMyGoals } from '@/queries/goals';
import { createClient } from '@/lib/supabase/server';
import { GoalForm } from '@/components/goals/goal-form';

export const metadata = { title: 'Create Goal — Orbit' };

export default async function NewGoalPage() {
  const supabase = await createClient();
  const cycle = await getActiveCycle();
  
  if (!cycle) {
    redirect('/employee/goals');
  }

  const goals = await getMyGoals(cycle.id);
  
  // Guard: Max 8 goals or sheet locked
  if (goals.length >= 8 || (goals.length > 0 && goals[0].status !== 'draft' && goals[0].status !== 'returned')) {
    redirect('/employee/goals?error=Cannot add more goals');
  }

  const currentWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
  const remainingWeightage = 100 - currentWeightage;

  // Fetch thrust areas
  const { data: thrustAreas } = await supabase.from('thrust_areas').select('*').order('name');

  return (
    <div className="max-w-5xl mx-auto p-6">
      <GoalForm 
        thrustAreas={thrustAreas || []} 
        remainingWeightage={remainingWeightage} 
        cycleId={cycle.id}
        mode="create" 
        existingGoals={goals}
      />
    </div>
  );
}
