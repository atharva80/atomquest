'use client';

import { QuarterlyCheckin, QuarterType, Goal } from '@/types';
import { calculateProgressScore } from '@/lib/utils';
import { ProgressBadge } from '@/components/goals/progress-badge';
import { cn } from '@/lib/utils';

// We import ManagerComment interface from types, assuming it's exported there
interface ManagerComment {
  id: string;
  comment: string;
  rating?: number;
  created_at: string;
}

interface CheckinTimelineProps {
  goal: Goal;
  checkins: QuarterlyCheckin[];
  managerComments?: Record<QuarterType, ManagerComment>;
  currentQuarter?: QuarterType;
}

export function CheckinTimeline({ goal, checkins, managerComments = {} as Record<QuarterType, ManagerComment>, currentQuarter }: CheckinTimelineProps) {
  const quarters: QuarterType[] = ['Q1', 'Q2', 'Q3', 'Q4'];

  return (
    <div className="relative pl-6 space-y-8 before:absolute before:inset-0 before:ml-8 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
      {quarters.map((q, index) => {
        const checkin = checkins.find(c => c.quarter === q);
        const comment = managerComments[q];
        const isCurrent = q === currentQuarter;
        const isFuture = !checkin && !isCurrent;
        
        let score = 0;
        if (checkin) {
          score = calculateProgressScore(goal.uom_type, goal.target || 0, checkin.achievement);
        }

        return (
          <div key={q} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Dot marker */}
            <div className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full border-4 border-white dark:border-slate-950 absolute left-8 md:left-1/2 -translate-y-4 sm:translate-y-0 transform -translate-x-1/2 flex-shrink-0 z-10 transition-colors duration-500",
              checkin ? "bg-green-500 shadow-[0_0_0_4px_rgba(34,197,94,0.2)]" : 
              isCurrent ? "bg-indigo-500 shadow-[0_0_0_4px_rgba(99,102,241,0.2)] animate-pulse" : 
              "bg-slate-300 dark:bg-slate-700"
            )}>
              <span className="text-[10px] font-bold text-white">{q}</span>
            </div>
            
            {/* Card Content */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] pl-4 md:pl-0 md:group-odd:pr-6 md:group-even:pl-6">
              <div className={cn(
                "p-4 rounded-xl border shadow-sm transition-all duration-300",
                checkin ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" :
                isCurrent ? "bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800" :
                "bg-slate-50 dark:bg-slate-900/30 border-transparent opacity-60 grayscale"
              )}>
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    {q} Update
                    {checkin && <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">{checkin.status.replace('_', ' ')}</span>}
                  </div>
                  {checkin && <ProgressBadge score={score} size="sm" />}
                </div>
                
                {checkin ? (
                  <div className="space-y-3">
                    <div className="text-sm flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-2 rounded">
                      <span className="text-slate-500">Actual:</span>
                      <span className="font-medium text-slate-900 dark:text-white">{checkin.achievement}</span>
                    </div>
                    {checkin.comment && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic border-l-2 border-indigo-200 pl-2 py-1">
                        &quot;{checkin.comment}&quot;
                      </p>
                    )}
                    
                    {/* Manager Comment Block */}
                    {comment && (
                      <div className="mt-3 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-[10px] font-bold text-indigo-600 uppercase">Manager Feedback</div>
                          {comment.rating && (
                            <div className="text-[10px] text-amber-500 flex">
                              {'★'.repeat(comment.rating)}{'☆'.repeat(5-comment.rating)}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          {comment.comment}
                        </p>
                      </div>
                    )}
                  </div>
                ) : isCurrent ? (
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">Check-in window open</p>
                ) : (
                  <p className="text-sm text-slate-500">Not yet due</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
