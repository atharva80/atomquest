import { createClient } from '@/lib/supabase/server';
import { getActiveCycle } from '@/queries/cycles';
import { getAchievementTrend, getCompletionHeatmap, getGoalDistribution, getManagerEffectiveness } from '@/queries/analytics';
import { AnalyticsClientPage } from './client-page';

export const metadata = { title: 'Analytics — AtomQuest' };

export default async function AnalyticsPage() {
  const cycle = await getActiveCycle();

  if (!cycle) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="font-page-title text-page-title text-zinc-900">Corporate Performance Analytics</h2>
        <p className="text-zinc-500 mt-4">No active performance cycle found. Please activate a cycle first.</p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <h2 className="font-page-title text-page-title text-zinc-900">Corporate Performance Analytics</h2>
        <p className="text-zinc-500 mt-4">Please log in to view analytics.</p>
      </div>
    );
  }

  const { data: profile } = await supabase.from('profiles').select('role, id').eq('id', user.id).single();

  const [trendData, heatmapData, distributionData, managerData] = await Promise.all([
    getAchievementTrend({ cycleId: cycle.id }),
    getCompletionHeatmap(cycle.id),
    getGoalDistribution({ cycleId: cycle.id }),
    getManagerEffectiveness(cycle.id),
  ]);

  const departments = Array.from(new Set(heatmapData.map((d: any) => d.department).filter(Boolean)));
  const quarters = Array.from(new Set(heatmapData.map((d: any) => d.quarter).filter(Boolean)));

  return (
    <AnalyticsClientPage
      trendData={trendData}
      heatmapData={heatmapData}
      distributionData={distributionData}
      managerData={managerData}
      departments={departments}
      quarters={quarters}
      cycleName={cycle.name}
    />
  );
}