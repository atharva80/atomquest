'use client';

import { GoalWithCheckins } from '@/types';
import { calculateProgressScore } from '@/lib/utils';
import { STATUS_COLORS } from '@/lib/constants';
import { ProgressBadge } from './progress-badge';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Edit2, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

interface GoalCardProps {
  goal: GoalWithCheckins;
  showActions?: boolean;
  showScore?: boolean;
  compact?: boolean;
}

export function GoalCard({ goal, showActions = false, showScore = true, compact = false }: GoalCardProps) {
  const isDraft = goal.status === 'draft';
  const hasCheckins = goal.quarterly_checkins && goal.quarterly_checkins.length > 0;
  
  // Calculate score if there are checkins
  let score = 0;
  if (hasCheckins) {
    const latestCheckin = goal.quarterly_checkins[goal.quarterly_checkins.length - 1];
    score = calculateProgressScore(goal.uom_type, goal.target || 0, latestCheckin.actual_achievement);
  }

  const handleDelete = async () => {
    // We'd call server action here in actual implementation
  };

  return (
    <Card className="hover:border-indigo-500/50 hover:shadow-md transition-all group overflow-hidden">
      <CardHeader className={compact ? "p-4 pb-2" : "p-6 pb-4"}>
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1.5 flex-1">
            <CardTitle className="text-lg leading-tight line-clamp-2 group-hover:text-indigo-600 transition-colors">
              <Link href={`/employee/goals/${goal.id}`}>
                {goal.title}
              </Link>
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {/* Fallback string since relation might not be loaded */}
                {(goal as any).thrust_areas?.name || 'Thrust Area'}
              </span>
              
              {/* If this is a shared goal, indicate it */}
              {(goal as any).shared_goals && (goal as any).shared_goals.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30">
                  <Users className="h-3 w-3" /> Shared
                </Badge>
              )}
            </div>
          </div>
          <Badge className={STATUS_COLORS[goal.status] || 'bg-slate-100 text-slate-800'}>
            {goal.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className={compact ? "p-4 pt-0 pb-2" : "p-6 pt-0 pb-4"}>
        <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Target</p>
            <p className="font-semibold">{goal.target !== null ? goal.target : 'N/A'}</p>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">
              {goal.uom_type.replace('_', ' ')}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Weightage</p>
            <div className="flex items-center gap-2">
              <p className="font-semibold">{goal.weightage}%</p>
              <Progress value={goal.weightage} className="h-2 flex-1" />
            </div>
          </div>
        </div>
      </CardContent>

      {(showScore || (isDraft && showActions)) && (
        <CardFooter className={compact ? "p-4 pt-2 border-t" : "p-4 border-t bg-slate-50/50 dark:bg-slate-900/20"}>
          <div className="flex justify-between items-center w-full">
            {showScore ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Score</span>
                {hasCheckins ? (
                  <ProgressBadge score={score} size="sm" />
                ) : (
                  <span className="text-xs text-slate-400 italic">No check-ins</span>
                )}
              </div>
            ) : <div />}
            
            {isDraft && showActions && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild className="h-8 px-2">
                  <Link href={`/employee/goals/${goal.id}/edit`}>
                    <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                  </Link>
                </Button>
                {/* Note: ConfirmDialog requires onConfirm Promise in our generic implementation */}
                <ConfirmDialog 
                  title="Delete Goal" 
                  description={`Are you sure you want to delete "${goal.title}"?`}
                  onConfirm={handleDelete}
                  trigger={
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
              </div>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
