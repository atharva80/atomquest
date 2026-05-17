'use client';

import { GoalWithCheckins } from '@/types';
import { StatusBadge } from '@/components/ui/status-badge';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

interface GoalCardProps {
  goal: GoalWithCheckins;
  showActions?: boolean;
  showScore?: boolean;
  compact?: boolean;
  index?: number;
}

export function GoalCard({ goal, showActions = false, showScore = true, compact = false, index = 0 }: GoalCardProps) {
  const isDraft = goal.status === 'draft';
  const hasCheckins = goal.quarterly_checkins && goal.quarterly_checkins.length > 0;
  
  const handleDelete = async () => {
    // We'd call server action here in actual implementation
  };

  const thrustAreaName = (goal as any).thrust_areas?.name || 'Thrust Area';
  const isShared = (goal as any).shared_goals && (goal as any).shared_goals.length > 0;

  // Stagger animation based on index
  const staggerClass = `stagger-${(index % 3) + 1}`;

  return (
    <div className={`bg-white border border-zinc-200 rounded-xl p-5 flex flex-col gap-5 hover:border-zinc-300 transition-colors relative group animate-slide-up ${staggerClass}`}>
      {/* Top Row: Thrust Area & Menu */}
      <div className="flex justify-between items-start">
        <span className="text-[12px] font-medium text-zinc-500 tracking-widest uppercase leading-[16px]">
          {thrustAreaName} {isShared && " • SHARED"}
        </span>
        
        {isDraft && showActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-zinc-400 hover:text-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
                <span className="material-symbols-outlined text-[20px]">more_vert</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-white border border-zinc-200">
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href={`/employee/goals/${goal.id}/edit`} className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                  Edit
                </Link>
              </DropdownMenuItem>
              {/* Note: ConfirmDialog wrapped in DropdownMenuItem causes issues with Radix, using simple button for demo */}
              <DropdownMenuItem 
                className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
                onSelect={(e) => {
                  e.preventDefault();
                  if(confirm(`Are you sure you want to delete "${goal.title}"?`)) handleDelete();
                }}
              >
                <div className="flex items-center gap-2 w-full">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  Delete
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Title & Status */}
      <div className="flex flex-col gap-3 flex-1">
        <h4 className="text-[16px] font-medium text-zinc-900 leading-[24px] line-clamp-2">
          <Link href={`/employee/goals/${goal.id}`} className="hover:underline underline-offset-2 decoration-zinc-300">
            {goal.title}
          </Link>
        </h4>
        
        {/* We use the status-badge.tsx which styles it exactly like Stitch */}
        {hasCheckins ? (
          <StatusBadge status="on_track" /> // In a real app we'd calculate from progress
        ) : (
          <StatusBadge status={goal.status} />
        )}
      </div>

      <hr className="border-zinc-100" />

      {/* Metrics Footer */}
      <div className="flex justify-between items-end pt-1">
        <div className="flex flex-col gap-1">
          <span className="text-[12px] text-zinc-500 leading-[16px]">Target Value</span>
          <span className="text-[24px] font-semibold text-zinc-900 tabular-nums leading-[32px]">
            {goal.target !== null ? goal.target : 'N/A'}
            {goal.uom_type === 'percentage_min' || goal.uom_type === 'percentage_max' ? '%' : ''}
          </span>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <span className="text-[12px] text-zinc-500 leading-[16px]">Weightage</span>
          <span className="text-[14px] font-medium text-zinc-900 tabular-nums leading-[20px]">{goal.weightage}%</span>
        </div>
      </div>
    </div>
  );
}
