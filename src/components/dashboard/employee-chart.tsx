'use client';

import { Card, Title, Text, BarChart } from '@tremor/react';

export function EmployeeProgressChart({ chartData }: { chartData: any[] }) {
  return (
    <Card className="ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm">
      <Title>Goal Progress Overview</Title>
      <Text>Current achievement score per goal</Text>
      <BarChart
        className="mt-6 h-72"
        data={chartData}
        index="name"
        categories={["Score (%)"]}
        colors={["indigo"]}
        valueFormatter={(number: number) => `${number}%`}
        yAxisWidth={48}
      />
    </Card>
  );
}
