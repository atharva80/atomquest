'use client';

import { useState } from 'react';
import { Goal } from '@/types';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Edit2 } from 'lucide-react';

interface InlineEditRowProps {
  goal: Goal;
  onEdit: (field: 'target' | 'weightage', value: number) => void;
  editedTarget?: number;
  editedWeightage?: number;
}

export function InlineEditRow({ goal, onEdit, editedTarget, editedWeightage }: InlineEditRowProps) {
  const currentTarget = editedTarget ?? goal.target;
  const currentWeightage = editedWeightage ?? goal.weightage;
  
  const isTargetEdited = editedTarget !== undefined && editedTarget !== goal.target;
  const isWeightageEdited = editedWeightage !== undefined && editedWeightage !== goal.weightage;
  const isTimeline = goal.uom_type === 'timeline';
  const isZeroBased = goal.uom_type === 'zero_based';

  return (
    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
      <td className="px-4 py-3">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="max-w-[250px] truncate font-medium">
                {goal.title}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">{goal.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </td>
      <td className="px-4 py-3 capitalize text-slate-500">
        {goal.uom_type.replace('_', ' ')}
      </td>
      <td className="px-4 py-3">
        {isTimeline || isZeroBased ? (
          <span className="text-slate-500">{currentTarget !== null ? currentTarget : 'N/A'}</span>
        ) : (
          <div className="relative group flex items-center">
            <Input 
              type="number" 
              className={`w-24 h-8 px-2 transition-all ${isTargetEdited ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
              value={currentTarget || ''}
              onChange={(e) => onEdit('target', Number(e.target.value))}
            />
            {isTargetEdited && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="ml-2">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">i</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Original: {goal.target}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="relative group flex items-center">
          <Input 
            type="number" 
            className={`w-20 h-8 px-2 transition-all ${isWeightageEdited ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
            value={currentWeightage || ''}
            onChange={(e) => onEdit('weightage', Number(e.target.value))}
          />
          <span className="ml-1 text-slate-500">%</span>
          
          {isWeightageEdited && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="ml-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">i</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Original: {goal.weightage}%</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </td>
    </tr>
  );
}
