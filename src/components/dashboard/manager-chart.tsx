'use client';

import { DonutChart } from '@tremor/react';

export function ManagerStatusChart({ data }: { data: any[] }) {
  // Check if all values are zero
  const isEmpty = data.every(item => item.value === 0);

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col gap-4 hover:border-zinc-300 transition-colors">
      <div className="flex flex-col gap-1">
        <h3 className="text-[16px] font-medium text-zinc-900 leading-[24px]">Team Goal Status Distribution</h3>
        <p className="text-[12px] text-zinc-500 leading-[16px]">Overview of where your team stands in the goal setting process</p>
      </div>
      
      <div className="h-72 mt-2 flex items-center justify-center">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center text-zinc-400 gap-2">
            <span className="material-symbols-outlined text-[32px]">pie_chart</span>
            <span className="text-[14px]">No team data available</span>
          </div>
        ) : (
          <DonutChart
            data={data}
            category="value"
            index="name"
            colors={["slate", "amber", "emerald", "indigo"]}
            className="h-64"
            valueFormatter={(number: number) => `${number} employees`}
            showAnimation={true}
          />
        )}
      </div>
    </div>
  );
}
