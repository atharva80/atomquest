'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getActiveCycle } from '@/queries/cycles';
import { AchievementTrendChart } from '@/components/analytics/achievement-trend';
import { CompletionHeatmap } from '@/components/analytics/completion-heatmap';
import { GoalDistributionChart } from '@/components/analytics/goal-distribution';
import { ManagerEffectivenessTable } from '@/components/analytics/manager-effectiveness';
import { ExportButton } from '@/components/shared/export-button';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('Overview');

  // Mock data for analytics presentation layer
  const trendData = [
    { quarter: 'Q1' as const, avg_score: 0.62, count: 24 },
    { quarter: 'Q2' as const, avg_score: 0.74, count: 28 },
    { quarter: 'Q3' as const, avg_score: 0.88, count: 32 },
  ];

  const distributionData = [
    { thrust_area: 'Revenue Growth', count: 45, percentage: 28.5 },
    { thrust_area: 'Operational Excellence', count: 32, percentage: 20.3 },
    { thrust_area: 'Customer Success', count: 28, percentage: 17.7 },
    { thrust_area: 'Product Innovation', count: 18, percentage: 11.4 },
    { thrust_area: 'Team Development', count: 12, percentage: 7.6 },
  ];

  const heatmapData = [
    { department: 'Engineering', quarter: 'Q1' as const, completion_rate: 0.9 },
    { department: 'Engineering', quarter: 'Q1' as const, completion_rate: 0.95 },
    { department: 'Engineering', quarter: 'Q1' as const, completion_rate: 0.85 },
    { department: 'Sales', quarter: 'Q1' as const, completion_rate: 0.4 },
    { department: 'Sales', quarter: 'Q1' as const, completion_rate: 0.5 },
    { department: 'Sales', quarter: 'Q1' as const, completion_rate: 0.7 },
    { department: 'Product', quarter: 'Q1' as const, completion_rate: 0.7 },
    { department: 'Product', quarter: 'Q1' as const, completion_rate: 0.8 },
    { department: 'Product', quarter: 'Q1' as const, completion_rate: 0.9 },
    { department: 'HR', quarter: 'Q1' as const, completion_rate: 0.2 },
    { department: 'HR', quarter: 'Q1' as const, completion_rate: 0.3 },
    { department: 'HR', quarter: 'Q1' as const, completion_rate: 0.4 },
    { department: 'Finance', quarter: 'Q1' as const, completion_rate: 0.95 },
    { department: 'Finance', quarter: 'Q1' as const, completion_rate: 0.9 },
    { department: 'Finance', quarter: 'Q1' as const, completion_rate: 0.95 },
  ];

  const managerData: any[] = [
    { manager: { id: '1', first_name: 'Sarah', last_name: 'Connor', email: 'sarah@atomberg.com', role: 'manager', created_at: new Date().toISOString() }, check_in_completion_rate: 0.95, avg_team_score: 0.92 },
    { manager: { id: '2', first_name: 'John', last_name: 'Smith', email: 'john@atomberg.com', role: 'manager', created_at: new Date().toISOString() }, check_in_completion_rate: 0.75, avg_team_score: 0.78 },
    { manager: { id: '3', first_name: 'Alice', last_name: 'Johnson', email: 'alice@atomberg.com', role: 'manager', created_at: new Date().toISOString() }, check_in_completion_rate: 0.45, avg_team_score: 0.65 },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-zinc-200 rounded-lg p-5">
              <h3 className="font-section-label text-section-label tracking-widest text-zinc-500 uppercase mb-4">
                Quarterly Progress Trend
              </h3>
              <AchievementTrendChart data={trendData} />
            </div>
            <div className="bg-white border border-zinc-200 rounded-lg p-5">
              <h3 className="font-section-label text-section-label tracking-widest text-zinc-500 uppercase mb-4">
                Dept Completion Heatmap
              </h3>
              <CompletionHeatmap data={heatmapData} departments={['Engineering', 'Sales', 'Product', 'HR', 'Finance']} quarters={['Q1', 'Q2', 'Q3']} />
            </div>
          </div>
        );
      case 'Department Trends':
        return <GoalDistributionChart data={distributionData} groupBy="thrust_area" />;
      case 'Completion Heatmap':
        return <CompletionHeatmap data={heatmapData} departments={['Engineering', 'Sales', 'Product', 'HR', 'Finance']} quarters={['Q1', 'Q2', 'Q3']} />;
      case 'Manager Metrics':
        return <ManagerEffectivenessTable data={managerData} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-zinc-950 font-page-title">Corporate Performance Analytics</h2>
        <p className="text-sm text-zinc-500 font-body-relaxed mt-1">
          Assess org-wide completion rates, goal distribution, and manager effectiveness.
        </p>
      </div>
      {/* Segment Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-200">
        {['Overview', 'Department Trends', 'Completion Heatmap', 'Manager Metrics'].map((tab) => (
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
      {/* Charts Grid */}
      {renderContent()}
    </div>
  );
}
