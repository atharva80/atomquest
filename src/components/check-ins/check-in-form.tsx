'use client';

import { useState } from 'react';
import { GoalWithCheckins, QuarterType, QuarterlyCheckin } from '@/types';
import { calculateProgressScore } from '@/lib/utils';
import { submitCheckins } from '@/actions/check-ins';
import { ProgressBadge } from '@/components/goals/progress-badge';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CheckinFormProps {
  goals: GoalWithCheckins[];
  quarter: QuarterType;
  cycleId: string;
  existingCheckins?: QuarterlyCheckin[];
  readOnly?: boolean;
}

export function CheckinForm({ goals, quarter, cycleId, existingCheckins = [], readOnly = false }: CheckinFormProps) {
  const [loading, setLoading] = useState(false);

  const [checkins, setCheckins] = useState<Record<string, { achievement: string, status: string, comment: string }>>(
    goals.reduce((acc, goal) => {
      const existing = existingCheckins.find(c => c.goal_id === goal.id);
      acc[goal.id] = {
        achievement: existing?.achievement?.toString() || '',
        status: existing?.status || 'not_started',
        comment: existing?.comment || ''
      };
      return acc;
    }, {} as Record<string, any>)
  );

  const handleUpdate = (goalId: string, field: string, value: string) => {
    setCheckins(prev => ({
      ...prev,
      [goalId]: { ...prev[goalId], [field]: value }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const missing = goals.filter(g => checkins[g.id].achievement === '');
    if (missing.length > 0) {
      toast.error('Please enter an achievement value for all goals');
      return;
    }

    setLoading(true);
    try {
      const result = await submitCheckins({
        cycle_id: cycleId,
        quarter: quarter,
        checkins: goals.map(g => ({
          goal_id: g.id,
          quarter: quarter,
          achievement: Number(checkins[g.id].achievement),
          status: checkins[g.id].status as any,
          comment: checkins[g.id].comment || undefined
        }))
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to submit check-in');
        return;
      }

      toast.success('Quarterly check-in submitted!');
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Overall weighted score
  const overallScore = goals.reduce((sum, goal) => {
    const val = Number(checkins[goal.id]?.achievement) || 0;
    const target = goal.target ?? 0;
    const score = target > 0 ? calculateProgressScore(goal.uom_type, target, val) : 0;
    return sum + (score * (goal.weightage / 100));
  }, 0);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Overall score header */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-[18px] font-semibold text-indigo-900 leading-[24px]">
            {quarter} Check-in Update
          </h2>
          <p className="text-[13px] text-indigo-700/80 leading-[18px]">
            {readOnly ? 'View your submitted progress' : 'Update your progress against planned targets'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[11px] font-medium text-indigo-800 uppercase tracking-wider">Overall Q-Score</p>
            <p className="text-[11px] text-indigo-600/70">Weighted Average</p>
          </div>
          <ProgressBadge score={overallScore} size="lg" />
        </div>
      </div>

      {/* Goal rows */}
      <div className="flex flex-col gap-4">
        {goals.map(goal => {
          const state = checkins[goal.id];
          const val = Number(state.achievement) || 0;
          const target = goal.target ?? 0;
          const score = target > 0 ? calculateProgressScore(goal.uom_type, target, val) : 0;
          const isTimeline = goal.uom_type === 'timeline';

          return (
            <div key={goal.id} className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
              <div className="p-5 flex flex-col md:flex-row gap-6">
                {/* Left: Goal info */}
                <div className="md:w-1/3 flex flex-col gap-2">
                  <span className="inline-flex items-center self-start px-2 py-0.5 rounded text-[10px] font-bold text-zinc-600 bg-zinc-100 uppercase tracking-wider">
                    {goal.weightage}% WT
                  </span>
                  <h3 className="text-[15px] font-semibold text-zinc-900 leading-[22px]">{goal.title}</h3>
                  <div className="flex items-center gap-3 text-[13px] text-zinc-500">
                    <span>Target: <strong className="text-zinc-700">{goal.target}</strong></span>
                    <span className="border-l border-zinc-200 pl-3 capitalize">
                      {goal.uom_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Right: Inputs */}
                <div className="md:flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Achievement + live badge */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-zinc-700">Actual Achievement</label>
                    <div className="flex items-center gap-3">
                      {isTimeline ? (
                        <input
                          type="date"
                          value={state.achievement}
                          onChange={e => handleUpdate(goal.id, 'achievement', e.target.value)}
                          disabled={readOnly}
                          required
                          className="flex-1 px-3 py-2 border border-zinc-200 rounded-lg text-[14px] focus:outline-none focus:border-zinc-400 transition-colors disabled:bg-zinc-50 disabled:text-zinc-400"
                        />
                      ) : (
                        <input
                          type="number"
                          step="any"
                          value={state.achievement}
                          onChange={e => handleUpdate(goal.id, 'achievement', e.target.value)}
                          disabled={readOnly}
                          required
                          placeholder="0"
                          className="w-28 px-3 py-2 border border-zinc-200 rounded-lg text-[14px] tabular-nums focus:outline-none focus:border-zinc-400 transition-colors disabled:bg-zinc-50 disabled:text-zinc-400"
                        />
                      )}
                      <ProgressBadge score={score} size="sm" />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-zinc-700">Status</label>
                    <select
                      value={state.status}
                      onChange={e => handleUpdate(goal.id, 'status', e.target.value)}
                      disabled={readOnly}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[14px] focus:outline-none focus:border-zinc-400 transition-colors appearance-none disabled:bg-zinc-50 disabled:text-zinc-400"
                    >
                      <option value="not_started">Not Started</option>
                      <option value="on_track">On Track</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  {/* Comment */}
                  <div className="sm:col-span-2 flex flex-col gap-2">
                    <label className="text-[13px] font-medium text-zinc-700">Employee Comment (Optional)</label>
                    <textarea
                      placeholder="Share context on achievements or blockers..."
                      value={state.comment}
                      onChange={e => handleUpdate(goal.id, 'comment', e.target.value)}
                      disabled={readOnly}
                      rows={2}
                      className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-[14px] resize-none focus:outline-none focus:border-zinc-400 transition-colors disabled:bg-zinc-50 disabled:text-zinc-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!readOnly && (
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-zinc-900 text-white font-medium text-[14px] rounded-lg hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit {quarter} Check-in
          </button>
        </div>
      )}
    </form>
  );
}
