'use client';

import { GoalWithCheckins } from '@/types';
import { calculateProgressScore } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/constants';
import { DataTable } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

interface GoalTableProps {
  goals: GoalWithCheckins[];
  showEmployee?: boolean;
  editable?: boolean;
  onEdit?: (goalId: string, field: string, value: any) => void;
}

export function GoalTable({ goals, showEmployee = false, editable = false, onEdit }: GoalTableProps) {
  
  const columns: ColumnDef<GoalWithCheckins>[] = [
    ...(showEmployee ? [{
      accessorKey: 'employee_name',
      header: 'Employee',
      cell: ({ row }: any) => {
        // Fallback for nested profile
        const profile = (row.original as any).profiles;
        return <span className="font-medium">{profile?.full_name || 'Unknown'}</span>;
      }
    }] : []),
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="max-w-[200px] truncate font-medium cursor-help">
                {row.original.title}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs whitespace-normal">
              <p>{row.original.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
    {
      accessorKey: 'thrust_area',
      header: 'Thrust Area',
      cell: ({ row }) => {
        const area = (row.original as any).thrust_areas;
        return <Badge variant="outline">{area?.name || 'N/A'}</Badge>;
      }
    },
    {
      accessorKey: 'uom_type',
      header: 'UoM Type',
      cell: ({ row }) => <span className="capitalize">{row.original.uom_type.replace('_', ' ')}</span>
    },
    {
      accessorKey: 'target',
      header: 'Target',
    },
    {
      accessorKey: 'weightage',
      header: 'Weightage',
      cell: ({ row }) => {
        if (editable && onEdit) {
          return (
            <div className="flex items-center gap-1">
              <Input 
                type="number" 
                className="w-16 h-8 text-center" 
                defaultValue={row.original.weightage}
                onBlur={(e) => onEdit(row.original.id, 'weightage', Number(e.target.value))}
              />
              <span className="text-muted-foreground text-sm">%</span>
            </div>
          );
        }
        return <span>{row.original.weightage}%</span>;
      }
    },
    {
      id: 'score',
      header: 'Score',
      cell: ({ row }) => {
        const goal = row.original;
        const hasCheckins = goal.quarterly_checkins && goal.quarterly_checkins.length > 0;
        if (!hasCheckins) return <span className="text-muted-foreground text-xs italic">N/A</span>;
        
        const latestCheckin = goal.quarterly_checkins[goal.quarterly_checkins.length - 1];
        const score = calculateProgressScore(goal.uom_type, goal.target || 0, latestCheckin.actual_achievement);
        const percentage = Math.round(score * 100);
        
        let color = "text-red-600";
        if (score >= 0.8) color = "text-green-600";
        else if (score >= 0.5) color = "text-yellow-600";
        
        return <span className={`font-semibold ${color}`}>{percentage}%</span>;
      }
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={STATUS_COLORS[row.original.status] || 'bg-slate-100'}>
          {row.original.status}
        </Badge>
      )
    }
  ];

  // Calculate total weightage for footer
  const totalWeightage = goals.reduce((sum, goal) => sum + goal.weightage, 0);
  const isTotalValid = totalWeightage === 100;

  return (
    <div className="space-y-2">
      <DataTable 
        columns={columns} 
        data={goals} 
        searchKey="title"
      />
      <div className="flex justify-end pr-4">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-900 rounded-md border">
          <span className="text-sm font-medium text-slate-600">Total Weightage:</span>
          <span className={`font-bold ${isTotalValid ? 'text-green-600' : 'text-red-600'}`}>
            {totalWeightage}%
          </span>
          {!isTotalValid && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-red-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total weightage must be exactly 100% to submit goals.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
}
