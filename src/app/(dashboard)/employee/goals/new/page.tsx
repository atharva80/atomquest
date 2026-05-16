import { redirect } from 'next/navigation';
import { getActiveCycle } from '@/queries/cycles';
import { getMyGoals } from '@/queries/goals';
import { createClient } from '@/lib/supabase/server';
import { GoalForm } from '@/components/goals/goal-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export const metadata = { title: 'Create Goal — AtomQuest' };

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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Goal</h1>
        <p className="text-slate-500">Define a new objective for {cycle.name}</p>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b dark:border-slate-800">
          <CardTitle>Goal Details</CardTitle>
          <CardDescription>Fill out the parameters for your goal.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <GoalForm 
            thrustAreas={thrustAreas || []} 
            remainingWeightage={remainingWeightage} 
            cycleId={cycle.id}
            mode="create" 
          />
        </CardContent>
      </Card>
    </div>
  );
}
