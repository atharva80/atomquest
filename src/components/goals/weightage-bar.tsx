'use client';

import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface WeightageBarProps {
  current: number;
  max?: number;
  goals?: Array<{ title: string; weightage: number }>;
}

export function WeightageBar({ current, max = 100, goals = [] }: WeightageBarProps) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  
  let colorClass = "bg-green-500"; // Exactly 100
  if (current < max) colorClass = "bg-yellow-500";
  if (current > max) colorClass = "bg-red-500";

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-sm font-medium">
        <span className="text-slate-600 dark:text-slate-400">Total Weightage</span>
        <span className={cn(
          "px-2 py-0.5 rounded-full",
          current === 100 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
          current > 100 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        )}>
          {current}% / {max}%
        </span>
      </div>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
              {goals.length > 0 ? (
                // Breakdown view
                goals.map((g, i) => {
                  const width = `${(g.weightage / max) * 100}%`;
                  // Cycle through some nice colors for the segments
                  const segmentColors = [
                    'bg-indigo-500', 'bg-blue-500', 'bg-cyan-500', 
                    'bg-teal-500', 'bg-emerald-500', 'bg-violet-500',
                    'bg-purple-500', 'bg-fuchsia-500'
                  ];
                  return (
                    <div 
                      key={i} 
                      style={{ width }} 
                      className={cn("h-full transition-all duration-500 border-r border-white/20 last:border-0", segmentColors[i % segmentColors.length])}
                    />
                  );
                })
              ) : (
                // Simple view
                <div 
                  className={cn("h-full transition-all duration-500", colorClass)} 
                  style={{ width: `${percentage}%` }} 
                />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent className="p-3 max-w-sm">
            <div className="space-y-2">
              <p className="font-semibold text-sm border-b pb-1">Weightage Breakdown</p>
              {goals.length > 0 ? (
                <ul className="space-y-1">
                  {goals.map((g, i) => (
                    <li key={i} className="flex justify-between text-xs gap-4">
                      <span className="truncate">{g.title}</span>
                      <span className="font-medium">{g.weightage}%</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No goals added yet.</p>
              )}
              <div className="flex justify-between text-xs font-bold pt-1 border-t mt-1">
                <span>Total</span>
                <span className={current > 100 ? "text-red-500" : ""}>{current}%</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
