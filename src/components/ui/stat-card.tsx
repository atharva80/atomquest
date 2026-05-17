import React from 'react';
import { cn } from '@/lib/utils';

export type TrendStatus = 'good' | 'bad' | 'neutral';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  trendText?: string;
  trendStatus?: TrendStatus;
  delayMs?: number;
  className?: string;
  children?: React.ReactNode;
}

export function StatCard({ 
  label, 
  value, 
  icon, 
  trendText, 
  trendStatus = 'neutral',
  delayMs = 0,
  className,
  children
}: StatCardProps) {
  let iconColor = 'text-zinc-400';
  let dotColor = 'bg-zinc-400';
  let borderLeft = '';

  if (trendStatus === 'good') {
    dotColor = 'bg-green-600';
  } else if (trendStatus === 'bad') {
    iconColor = 'text-red-600';
    dotColor = 'bg-red-600';
    borderLeft = 'border-l-2 border-l-red-600';
  }

  return (
    <div 
      className={cn(
        "bg-white border border-zinc-200 rounded-xl p-5 flex flex-col gap-2 animate-fade-in-up-stagger", 
        borderLeft,
        className
      )}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-zinc-500 uppercase tracking-widest leading-[16px]">{label}</span>
        <span className={cn("material-symbols-outlined text-[18px]", iconColor)}>{icon}</span>
      </div>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-[24px] font-semibold tabular-nums text-zinc-950 leading-[32px]">{value}</span>
        {children}
      </div>
      {trendText && (
        <div className="flex items-center gap-1.5 mt-1">
          <span className={cn("w-1.5 h-1.5 rounded-full", dotColor, trendStatus === 'good' && "animate-pulse-subtle")}></span>
          <span className="text-[12px] text-zinc-500 leading-[16px]">{trendText}</span>
        </div>
      )}
    </div>
  );
}
