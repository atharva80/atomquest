'use client';

import { Card, Title, Text } from '@tremor/react';
import { CompletionHeatmapCell, QuarterType } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CompletionHeatmapProps {
  data: CompletionHeatmapCell[];
  departments: string[];
  quarters: QuarterType[];
}

export function CompletionHeatmap({ data, departments, quarters }: CompletionHeatmapProps) {
  
  // Helper to get color based on percentage (0-100)
  const getColorClass = (percent: number) => {
    if (percent >= 90) return 'bg-emerald-500 text-white';
    if (percent >= 70) return 'bg-emerald-400 text-emerald-950';
    if (percent >= 50) return 'bg-amber-400 text-amber-950';
    if (percent >= 30) return 'bg-orange-400 text-orange-950';
    if (percent > 0) return 'bg-rose-400 text-white';
    return 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500';
  };

  return (
    <Card className="ring-1 ring-slate-200 dark:ring-slate-800 rounded-xl shadow-sm overflow-hidden">
      <div className="mb-6">
        <Title className="text-slate-800 dark:text-slate-200">Check-in Completion Heatmap</Title>
        <Text className="text-slate-500">Percentage of goals with completed quarterly check-ins by department</Text>
      </div>
      
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[600px]">
          {/* Header row */}
          <div className="flex mb-2">
            <div className="w-48 flex-shrink-0"></div>
            {quarters.map(q => (
              <div key={q} className="flex-1 text-center font-medium text-slate-500 text-sm">
                {q}
              </div>
            ))}
          </div>
          
          {/* Grid rows */}
          <div className="space-y-2">
            {departments.map(dept => (
              <div key={dept} className="flex items-center">
                <div className="w-48 flex-shrink-0 text-sm font-medium text-slate-700 dark:text-slate-300 truncate pr-4">
                  {dept}
                </div>
                {quarters.map(q => {
                  const cellData = data.find(d => d.department === dept && d.quarter === q);
                  const percent = cellData ? Math.round(cellData.completion_rate * 100) : 0;
                  const colorClass = getColorClass(percent);
                  
                  return (
                    <TooltipProvider key={`${dept}-${q}`}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex-1 px-1">
                            <div className={cn(
                              "h-10 rounded-md flex items-center justify-center text-xs font-medium cursor-help transition-all hover:ring-2 hover:ring-indigo-400 hover:ring-offset-1 dark:hover:ring-offset-slate-950",
                              colorClass
                            )}>
                              {cellData ? `${percent}%` : '-'}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {cellData 
                            ? `${dept} ${q}: ${percent}% check-in completion` 
                            : `No data for ${dept} in ${q}`}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs text-slate-500">
        <span className="font-medium">Legend:</span>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-800"></div> 0%</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-rose-400"></div> &lt;30%</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-orange-400"></div> 30-50%</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-400"></div> 50-70%</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-400"></div> 70-90%</div>
        <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500"></div> 90%+</div>
      </div>
    </Card>
  );
}
