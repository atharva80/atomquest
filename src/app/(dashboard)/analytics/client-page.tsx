'use client';

import { useState } from 'react';
import { AchievementTrendChart } from '@/components/analytics/achievement-trend';
import { CompletionHeatmap } from '@/components/analytics/completion-heatmap';
import { GoalDistributionChart } from '@/components/analytics/goal-distribution';
import { ManagerEffectivenessTable } from '@/components/analytics/manager-effectiveness';

interface Props {
  trendData: any[];
  heatmapData: any[];
  distributionData: any[];
  managerData: any[];
  departments: string[];
  quarters: string[];
  cycleName: string;
}

const TABS = ['Overview', 'Department Trends', 'Completion Heatmap', 'Manager Metrics'];

export function AnalyticsClientPage({ 
  trendData, 
  heatmapData, 
  distributionData, 
  managerData, 
  departments, 
  quarters, 
  cycleName 
}: Props) {
  const [activeTab, setActiveTab] = useState('Overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-zinc-200 rounded-xl p-5">
              <h3 className="font-section-label text-section-label tracking-widest text-zinc-500 uppercase mb-4">
                Quarterly Progress Trend
              </h3>
              <AchievementTrendChart data={trendData} />
            </div>
            <div className="bg-white border border-zinc-200 rounded-xl p-5">
              <h3 className="font-section-label text-section-label tracking-widest text-zinc-500 uppercase mb-4">
                Dept Completion Heatmap
              </h3>
              <CompletionHeatmap data={heatmapData} departments={departments} quarters={quarters as any} />
            </div>
          </div>
        );
      case 'Department Trends':
        return <GoalDistributionChart data={distributionData} groupBy="thrust_area" />;
      case 'Completion Heatmap':
        return <CompletionHeatmap data={heatmapData} departments={departments} quarters={quarters as any} />;
      case 'Manager Metrics':
        return <ManagerEffectivenessTable data={managerData} />;
      default:
        return null;
    }
  };

  const hasData = trendData.length > 0 || heatmapData.length > 0 || distributionData.length > 0 || managerData.length > 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-zinc-950 font-page-title">Corporate Performance Analytics</h2>
        <p className="text-sm text-zinc-500 font-body-relaxed mt-1">
          Cycle: {cycleName}
        </p>
      </div>
      <div className="flex items-center gap-1 border-b border-zinc-200">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors font-body-sm ${
              activeTab === tab
                ? 'text-zinc-950 border-b-2 border-zinc-900'
                : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      {!hasData && (
        <div className="text-center py-12 text-zinc-400 bg-white border border-zinc-200 rounded-xl">
          <span className="material-symbols-outlined text-[32px] mb-4">analytics</span>
          <p className="font-body-sm">No check-in data yet for this cycle. Analytics will populate as employees complete their quarterly check-ins.</p>
        </div>
      )}
      {hasData && renderContent()}
    </div>
  );
}