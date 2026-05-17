'use client';

import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface WeightageBarProps {
  current: number;
  max?: number;
  goals?: Array<{ title: string; weightage: number }>;
}

export function WeightageBar({ current, max = 100 }: WeightageBarProps) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
  
  let colorClass = "bg-green-600"; // Exactly 100 or on track
  let statusMessage = "Your goals account for 100% of your available quarter capacity. No further allocation required.";

  if (current < max) {
    colorClass = "bg-yellow-500";
    statusMessage = `You have ${max - current}% remaining capacity to allocate to goals.`;
  } else if (current > max) {
    colorClass = "bg-red-600";
    statusMessage = `Warning: Weightage exceeds 100%. Please adjust your goals.`;
  }

  return (
    <section className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col gap-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-zinc-400 text-[20px]">scale</span>
          <h3 className="text-[16px] font-medium text-zinc-900 leading-[24px]">Total Weightage Distribution</h3>
        </div>
        <span className={cn(
          "text-[14px] font-medium tabular-nums leading-[20px]",
          current > max ? "text-red-600" : "text-zinc-900"
        )}>
          {current} / {max}%
        </span>
      </div>
      
      <Progress 
        value={percentage} 
        indicatorClassName={colorClass} 
      />
      
      <p className="text-[12px] text-zinc-500 leading-[16px]">
        {statusMessage}
      </p>
    </section>
  );
}
