import { createClient } from '@/lib/supabase/server';
import { getActiveCycle } from '@/queries/cycles';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AchievementTrendChart } from '@/components/analytics/achievement-trend';
import { CompletionHeatmap } from '@/components/analytics/completion-heatmap';
import { GoalDistributionChart } from '@/components/analytics/goal-distribution';
import { ManagerEffectivenessTable } from '@/components/analytics/manager-effectiveness';
import { ExportButton } from '@/components/shared/export-button';

export const metadata = { title: 'Enterprise Analytics — AtomQuest' };

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const cycle = await getActiveCycle();

  // Mock data for analytics presentation layer
  const trendData = [
    { quarter: 'Q1', avgScore: 0.85 },
    { quarter: 'Q2', avgScore: 0.88 },
    { quarter: 'Q3', avgScore: 0.92 },
    { quarter: 'Q4', avgScore: 0.95 },
  ];

  const distributionData = [
    { thrustArea: 'Revenue Growth', count: 45 },
    { thrustArea: 'Operational Excellence', count: 32 },
    { thrustArea: 'Customer Success', count: 28 },
    { thrustArea: 'Product Innovation', count: 18 },
    { thrustArea: 'Team Development', count: 12 },
  ];

  const heatmapData = [
    { department: 'Engineering', quarter: 'Q1', completionRate: 0.95 },
    { department: 'Engineering', quarter: 'Q2', completionRate: 0.88 },
    { department: 'Sales', quarter: 'Q1', completionRate: 0.72 },
    { department: 'Sales', quarter: 'Q2', completionRate: 0.45 },
    { department: 'Marketing', quarter: 'Q1', completionRate: 1.0 },
    { department: 'Marketing', quarter: 'Q2', completionRate: 0.92 },
    { department: 'HR', quarter: 'Q1', completionRate: 0.85 },
    { department: 'HR', quarter: 'Q2', completionRate: 0.85 },
  ];

  const managerData = [
    { manager: { id: '1', first_name: 'Sarah', last_name: 'Connor' } as any, checkInCompletionRate: 0.95, avgTeamScore: 0.92, teamSize: 8 },
    { manager: { id: '2', first_name: 'John', last_name: 'Smith' } as any, checkInCompletionRate: 0.75, avgTeamScore: 0.78, teamSize: 5 },
    { manager: { id: '3', first_name: 'Alice', last_name: 'Johnson' } as any, checkInCompletionRate: 0.45, avgTeamScore: 0.65, teamSize: 12 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Enterprise Analytics</h1>
          <p className="text-slate-500 mt-1">
            Data-driven insights for {cycle?.name || 'the current cycle'}
          </p>
        </div>
        <ExportButton 
          type="goals" 
          cycleId={cycle?.id || ''}
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 bg-white dark:bg-slate-900 border p-1 h-auto w-full sm:w-auto overflow-x-auto justify-start flex-nowrap shadow-sm">
          <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 px-6 py-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="distribution" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 px-6 py-2">
            Distribution
          </TabsTrigger>
          <TabsTrigger value="compliance" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 px-6 py-2">
            Compliance
          </TabsTrigger>
          <TabsTrigger value="managers" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 px-6 py-2">
            Managers
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-500">
          <AchievementTrendChart data={trendData as any} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GoalDistributionChart data={distributionData as any} groupBy="thrust_area" />
            <CompletionHeatmap data={heatmapData as any} departments={['Engineering', 'Sales', 'Marketing', 'HR']} quarters={['Q1', 'Q2']} />
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GoalDistributionChart data={distributionData as any} groupBy="thrust_area" />
            <GoalDistributionChart 
              data={[
                { status: 'locked', count: 120 },
                { status: 'approved', count: 15 },
                { status: 'submitted', count: 34 },
                { status: 'draft', count: 42 },
                { status: 'returned', count: 8 },
              ] as any} 
              groupBy="status" 
            />
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="animate-in fade-in duration-500">
          <CompletionHeatmap data={heatmapData as any} departments={['Engineering', 'Sales', 'Marketing', 'HR']} quarters={['Q1', 'Q2', 'Q3', 'Q4']} />
        </TabsContent>

        <TabsContent value="managers" className="animate-in fade-in duration-500">
          <ManagerEffectivenessTable data={managerData as any} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
