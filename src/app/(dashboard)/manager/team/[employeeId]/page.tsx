import { createClient } from '@/lib/supabase/server';
import { getActiveCycle } from '@/queries/cycles';
import { redirect } from 'next/navigation';
import { GoalTable } from '@/components/goals/goal-table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: { employeeId: string } }) {
  return { title: 'Employee Details — AtomQuest' };
}

export default async function EmployeeDetailPage({ params }: { params: { employeeId: string } }) {
  const supabase = await createClient();
  const cycle = await getActiveCycle();
  
  if (!cycle) return <div>No active cycle</div>;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', params.employeeId)
    .single();

  if (!profile) redirect('/manager/team');

  // Fetch employee goals
  const { data: goals } = await supabase
    .from('goals')
    .select('*, thrust_areas(*), quarterly_checkins(*)')
    .eq('profile_id', params.employeeId)
    .eq('cycle_id', cycle.id);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <Button variant="ghost" size="icon" asChild className="rounded-full">
          <Link href="/manager/team"><ArrowLeft size={18} /></Link>
        </Button>
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center dark:bg-indigo-900/50 dark:text-indigo-400">
            <User size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{(profile as any).first_name} {(profile as any).last_name}</h1>
            <p className="text-sm text-slate-500">{profile.email} • Employee</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-semibold">Goal Sheet: {cycle.name}</h2>
        </div>
        <div className="p-6">
          {goals && goals.length > 0 ? (
            <GoalTable goals={goals} showEmployee={false} editable={false} />
          ) : (
            <div className="text-center py-12 text-slate-500">
              No goals created by this employee yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
