'use client';

import { GoalWithCheckins } from '@/types';
import { calculateProgressScore } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/constants';
import Link from 'next/link';

interface NewGoalCardProps {
  goal: GoalWithCheckins;
}

export function NewGoalCard({ goal }: NewGoalCardProps) {
  const hasCheckins = goal.quarterly_checkins && goal.quarterly_checkins.length > 0;
  
  let score = 0;
  if (hasCheckins) {
    const latestCheckin = goal.quarterly_checkins[goal.quarterly_checkins.length - 1];
    score = calculateProgressScore(goal.uom_type, goal.target || 0, latestCheckin.achievement);
  }

  const getStatusBadge = () => {
    let statusText = 'Not Started';
    let bgColor = 'bg-zinc-400';

    if (goal.status === 'approved' || goal.status === 'locked') {
      if (score > 0.8) {
        statusText = 'On Track';
        bgColor = 'bg-green-600';
      } else if (score > 0.5) {
        statusText = 'At Risk';
        bgColor = 'bg-amber-500';
      } else if (score > 0) {
        statusText = 'Behind';
        bgColor = 'bg-red-600';
      }
    }
    
    return (
      <div className="flex items-center gap-1.5 bg-zinc-100 px-2 py-1 rounded-full w-fit">
        <div className={`w-1.5 h-1.5 rounded-full ${bgColor}`}></div>
        <span className="font-badge-label text-badge-label text-zinc-700">{statusText}</span>
      </div>
    );
  };

  return (
    <div className="bg-white border border-zinc-200 rounded p-card-padding flex flex-col gap-5 hover:border-zinc-300 transition-colors relative group animate-slide-up">
      <div className="flex justify-between items-start">
        <span className="font-section-label text-section-label text-zinc-500 tracking-widest uppercase">
          {(goal as any).thrust_areas?.name || 'Thrust Area'}
        </span>
        <button className="text-zinc-400 hover:text-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="material-symbols-outlined text-[20px]">more_vert</span>
        </button>
      </div>
      <div className="flex flex-col gap-3 flex-1">
        <h4 className="font-section-heading text-section-heading text-zinc-900 leading-snug">
          <Link href={`/employee/goals/${goal.id}`}>
            {goal.title}
          </Link>
        </h4>
        {getStatusBadge()}
      </div>
      <hr className="border-zinc-100"/>
      <div className="flex justify-between items-end pt-1">
        <div className="flex flex-col gap-1">
          <span className="font-caption text-caption text-zinc-500">Target Value</span>
          <span className="font-data-value-lg text-data-value-lg text-zinc-900 tabular-nums">
            {goal.target}{goal.uom_type.includes('percentage') ? '%' : ''}
          </span>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <span className="font-caption text-caption text-zinc-500">Weightage</span>
          <span className="font-table-cell-primary text-table-cell-primary text-zinc-900 tabular-nums">
            {goal.weightage}%
          </span>
        </div>
      </div>
    </div>
  );
}
