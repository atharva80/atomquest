import React from 'react';
import { cn } from '@/lib/utils';
import { GoalStatus, ProgressStatus } from '@/types';

type AnyStatus = GoalStatus | ProgressStatus | 'at_risk' | 'overdue';

interface StatusBadgeProps {
  status: AnyStatus;
  className?: string;
  animatePulse?: boolean;
}

export function StatusBadge({ status, className, animatePulse = false }: StatusBadgeProps) {
  let dotColor = 'bg-zinc-300';
  let label = status.replace('_', ' ').toUpperCase();
  let textColor = 'text-zinc-700';

  switch (status) {
    case 'draft':
      dotColor = 'bg-zinc-300';
      textColor = 'text-zinc-500';
      break;
    case 'submitted':
      dotColor = 'bg-zinc-400';
      break;
    case 'approved':
      dotColor = 'bg-green-600';
      break;
    case 'returned':
      dotColor = 'bg-yellow-600';
      break;
    case 'locked':
    case 'completed':
      dotColor = 'bg-zinc-900';
      break;
    case 'not_started':
      dotColor = 'bg-zinc-300';
      textColor = 'text-zinc-500';
      break;
    case 'on_track':
      dotColor = 'bg-green-600';
      break;
    case 'at_risk':
      dotColor = 'bg-yellow-600';
      break;
    case 'overdue':
      dotColor = 'bg-red-600';
      break;
    default:
      break;
  }

  return (
    <div className={cn("flex items-center gap-1.5 bg-zinc-100 px-2 py-0.5 rounded-md w-fit border border-zinc-200", className)}>
      <div className={cn("w-1.5 h-1.5 rounded-full", dotColor, animatePulse && "animate-pulse-subtle")} />
      <span className={cn("text-[12px] font-medium leading-[16px] tracking-wide uppercase", textColor)}>
        {label}
      </span>
    </div>
  );
}
