'use client';

import { useState } from 'react';
import { Card, Title, BarList, DonutChart, Text, Flex, Button } from '@tremor/react';
import { GoalDistribution } from '@/types';

interface GoalDistributionChartProps {
  data: GoalDistribution[];
  groupBy: 'thrust_area' | 'uom_type' | 'status';
}

export function GoalDistributionChart({ data, groupBy }: GoalDistributionChartProps) {
  const [view, setView] = useState<'bar' | 'donut'>('bar');

  const titleMap = {
    thrust_area: 'By Thrust Area',
    uom_type: 'By Unit of Measurement',
    status: 'By Status'
  };

  const chartData = data.map(d => ({
    // Use whatever grouping key is present in the data item
    name: (d as any).thrustArea || (d as any).uomType || d.status || d.thrustArea || 'Unknown',
    value: d.count
  })).sort((a, b) => b.value - a.value);

  const colors = ["indigo", "cyan", "fuchsia", "emerald", "amber", "rose"];

  return (
    <Card className="ring-1 ring-slate-200 dark:ring-slate-800 rounded-xl shadow-sm">
      <Flex className="mb-4" alignItems="center" justify="between">
        <div>
          <Title className="text-slate-800 dark:text-slate-200">Goal Distribution</Title>
          <Text className="text-slate-500">{titleMap[groupBy]}</Text>
        </div>
        <div className="flex gap-2">
          <Button 
            size="xs" 
            variant={view === 'bar' ? 'primary' : 'light'} 
            onClick={() => setView('bar')}
            className="text-xs"
          >
            Bar
          </Button>
          <Button 
            size="xs" 
            variant={view === 'donut' ? 'primary' : 'light'} 
            onClick={() => setView('donut')}
            className="text-xs"
          >
            Donut
          </Button>
        </div>
      </Flex>

      {view === 'bar' ? (
        <BarList 
          data={chartData} 
          className="mt-6 h-[250px] overflow-y-auto pr-2" 
          valueFormatter={(n) => `${n} goals`}
        />
      ) : (
        <div className="mt-6 flex justify-center">
          <DonutChart
            data={chartData}
            category="value"
            index="name"
            colors={colors}
            className="h-[250px]"
            valueFormatter={(n) => `${n} goals`}
            showAnimation={true}
          />
        </div>
      )}
    </Card>
  );
}
