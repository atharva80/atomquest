'use client';

import { Card, Title, AreaChart, Text } from '@tremor/react';
import { AchievementTrend } from '@/types';

interface AchievementTrendChartProps {
  data: AchievementTrend[];
  title?: string;
}

export function AchievementTrendChart({ data, title = "Achievement Trend (QoQ)" }: AchievementTrendChartProps) {
  // Format data for Tremor
  const chartData = data.map(d => ({
    Quarter: d.quarter,
    "Average Score (%)": Math.round(d.avgScore * 100)
  }));

  return (
    <Card className="ring-1 ring-slate-200 dark:ring-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="mb-4">
        <Title className="text-slate-800 dark:text-slate-200">{title}</Title>
        <Text className="text-slate-500">Average team achievement score across quarters</Text>
      </div>
      <AreaChart
        className="h-72 mt-4"
        data={chartData}
        index="Quarter"
        categories={["Average Score (%)"]}
        colors={["indigo"]}
        valueFormatter={(number: number) => `${number}%`}
        yAxisWidth={40}
        showAnimation={true}
        curveType="monotone"
      />
    </Card>
  );
}
