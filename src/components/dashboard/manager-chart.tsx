'use client';

import { Card, Title, Text, DonutChart } from '@tremor/react';

export function ManagerStatusChart({ data }: { data: any[] }) {
  return (
    <Card className="ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm">
      <Title>Team Goal Status Distribution</Title>
      <Text>Overview of where your team stands in the goal setting process</Text>
      <div className="h-72 mt-4 flex items-center justify-center">
        <DonutChart
          data={data}
          category="value"
          index="name"
          colors={["slate", "amber", "emerald", "indigo"]}
          className="h-64"
          valueFormatter={(number: number) => `${number} employees`}
        />
      </div>
    </Card>
  );
}
