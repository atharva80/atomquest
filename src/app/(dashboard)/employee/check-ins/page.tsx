import { getMyGoals } from '@/queries/goals';
import { getActiveCycle, getCurrentQuarter } from '@/queries/cycles';
import { getMyCheckins } from '@/queries/check-ins';
import { CheckinForm } from '@/components/check-ins/check-in-form';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CalendarClock, Info } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Link from 'next/link';

export const metadata = { title: 'Check-ins — AtomQuest' };

export default async function EmployeeCheckinsPage({ searchParams }: { searchParams: { quarter?: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cycle = await getActiveCycle();
  if (!cycle) {
    return (
      <Alert className="max-w-2xl mx-auto mt-8">
        <Info className="h-4 w-4" />
        <AlertTitle>No Active Cycle</AlertTitle>
        <AlertDescription>There is currently no active performance cycle.</AlertDescription>
      </Alert>
    );
  }

  const currentQ = await getCurrentQuarter(cycle);
  const activeTab = searchParams.quarter || currentQ || 'Q1';

  // Only goals that are locked
  const allGoals = await getMyGoals(cycle.id);
  const lockedGoals = allGoals.filter(g => g.status === 'locked');
  
  if (allGoals.length > 0 && allGoals[0].status !== 'locked') {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Alert className="bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-300">
          <CalendarClock className="h-4 w-4" />
          <AlertTitle>Goal Sheet Not Approved</AlertTitle>
          <AlertDescription>
            Your goals must be approved and locked by your manager before you can submit check-ins. 
            Current status: <strong>{allGoals[0].status.toUpperCase()}</strong>.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (lockedGoals.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-8">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>No Goals Found</AlertTitle>
          <AlertDescription>You do not have any locked goals for this cycle.</AlertDescription>
        </Alert>
      </div>
    );
  }

  const checkins = await getMyCheckins(cycle.id, activeTab as any);
  
  const isCurrentQuarter = activeTab === currentQ;
  const readOnly = !isCurrentQuarter; 

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quarterly Check-ins</h1>
        <p className="text-slate-500">Log your progress for {cycle.name}</p>
      </div>

      <Tabs defaultValue={activeTab} className="w-full">
        <TabsList className="mb-6 bg-white dark:bg-slate-900 border p-1 h-auto">
          {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
            <TabsTrigger 
              key={q} 
              value={q} 
              asChild
              className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm px-6 py-2"
            >
              <Link href={`?quarter=${q}`} className="flex items-center gap-2">
                {q} 
                {q === currentQ && <span className="text-[10px] uppercase font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-sm">Current</span>}
              </Link>
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value={activeTab}>
          {!isCurrentQuarter && (
            <Alert className="mb-6 border-slate-200 bg-white">
              <Info className="h-4 w-4 text-slate-500" />
              <AlertTitle>Window Closed</AlertTitle>
              <AlertDescription className="text-slate-500">
                The check-in window for {activeTab} is not currently open.
              </AlertDescription>
            </Alert>
          )}

          <CheckinForm 
            goals={lockedGoals}
            quarter={activeTab as any}
            cycleId={cycle.id}
            existingCheckins={checkins}
            readOnly={readOnly}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
