import { createClient } from '@/lib/supabase/server';
import { Card, Metric, Text, Title, BarChart } from '@tremor/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Target, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { getMyGoals } from '@/queries/goals';
import { getActiveCycle } from '@/queries/cycles';
import { calculateProgressScore } from '@/lib/utils';
import { ProgressBadge } from '@/components/goals/progress-badge';
import { EmployeeProgressChart } from '@/components/dashboard/employee-chart';

export const metadata = { title: 'Dashboard — AtomQuest' };

export default async function EmployeeDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single();

  const cycle = await getActiveCycle();
  const goals = cycle ? await getMyGoals(cycle.id) : [];
  
  // Quick stats calculations
  const totalGoals = goals.length;
  const draftGoals = goals.filter(g => g.status === 'draft' || g.status === 'returned').length;
  const isLocked = goals.length > 0 && goals[0].status === 'locked';
  
  let overallScore = 0;
  let checkinsCount = 0;
  
  const chartData = goals.map(g => {
    let score = 0;
    if (g.quarterly_checkins && g.quarterly_checkins.length > 0) {
      const latest = g.quarterly_checkins[g.quarterly_checkins.length - 1];
      score = calculateProgressScore(g.uom_type, g.target || 0, latest.achievement);
      checkinsCount++;
    }
    overallScore += score * (g.weightage / 100);
    
    return {
      name: g.title.substring(0, 15) + '...',
      "Score (%)": Math.round(score * 100)
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome back, {profile?.first_name || 'Employee'}
          </h1>
          <p className="text-slate-500 mt-1">
            {cycle ? `Current cycle: ${cycle.name}` : 'No active cycle found'}
          </p>
        </div>
        
        <div className="flex gap-3">
          {totalGoals === 0 ? (
            <Button asChild>
              <Link href="/employee/goals/new">
                <Target className="mr-2 h-4 w-4" /> Create Goals
              </Link>
            </Button>
          ) : (
            <>
              {isLocked && (
                <Button asChild variant="default" className="bg-indigo-600 hover:bg-indigo-700">
                  <Link href="/employee/check-ins">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Submit Check-in
                  </Link>
                </Button>
              )}
              <Button asChild variant="outline">
                <Link href="/employee/goals">
                  <Calendar className="mr-2 h-4 w-4" /> View Goal Sheet
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm">
          <Text>Total Goals</Text>
          <Metric>{totalGoals}</Metric>
        </Card>
        
        <Card className="ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <Text>Overall Score</Text>
            <Metric>{Math.round(overallScore * 100)}%</Metric>
          </div>
          <ProgressBadge score={overallScore} size="sm" showPercentage={false} />
        </Card>

        <Card className="ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm">
          <Text>Check-ins Logged</Text>
          <Metric>{checkinsCount}</Metric>
        </Card>

        <Card className="ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm">
          <Text>Pending Actions</Text>
          <div className="flex items-center gap-2">
            <Metric className={draftGoals > 0 ? "text-orange-600" : ""}>{draftGoals}</Metric>
            {draftGoals > 0 && <AlertCircle className="h-5 w-5 text-orange-600" />}
          </div>
        </Card>
      </div>

      {/* Chart */}
      {totalGoals > 0 && (
        <EmployeeProgressChart chartData={chartData} />
      )}
    </div>
  );
}
