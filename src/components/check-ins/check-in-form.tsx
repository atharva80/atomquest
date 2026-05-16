'use client';

import { useState } from 'react';
import { GoalWithCheckins, QuarterType, QuarterlyCheckin } from '@/types';
import { calculateProgressScore } from '@/lib/utils';
import { submitCheckins } from '@/actions/check-ins';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ProgressBadge } from '@/components/goals/progress-badge';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface CheckinFormProps {
  goals: GoalWithCheckins[];
  quarter: QuarterType;
  cycleId: string;
  existingCheckins?: QuarterlyCheckin[];
  readOnly?: boolean;
}

export function CheckinForm({ goals, quarter, cycleId, existingCheckins = [], readOnly = false }: CheckinFormProps) {
  const [loading, setLoading] = useState(false);
  
  // Initialize state with existing data or empty
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
    
    // Validate all goals have achievement
    const missing = goals.filter(g => checkins[g.id].achievement === '');
    if (missing.length > 0) {
      toast.error('Please enter an achievement value for all goals');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        cycle_id: cycleId,
        quarter: quarter,
        checkins: goals.map(g => ({
          goal_id: g.id,
          quarter: quarter,
          achievement: Number(checkins[g.id].achievement),
          status: checkins[g.id].status as any,
          comment: checkins[g.id].comment || undefined
        }))
      };

      const result = await submitCheckins(payload);
      
      if (!result.success) {
        toast.error(result.error || 'Failed to submit check-in');
        return;
      }
      
      toast.success('Quarterly check-in submitted successfully');
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Calculate overall progress based on inputs
  const overallScore = goals.reduce((sum, goal) => {
    const val = Number(checkins[goal.id]?.achievement) || 0;
    const score = calculateProgressScore(goal.uom_type, goal.target || 0, val);
    return sum + (score * (goal.weightage / 100));
  }, 0);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Summary Header */}
      <Card className="bg-indigo-50 border-indigo-100 dark:bg-indigo-950/30 dark:border-indigo-900">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-indigo-900 dark:text-indigo-300">
              {quarter} Check-in Update
            </h2>
            <p className="text-indigo-700/80 dark:text-indigo-400/80 text-sm mt-1">
              {readOnly ? 'View your submitted progress' : 'Update your progress against planned targets'}
            </p>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <p className="text-sm font-medium text-indigo-800 dark:text-indigo-400 uppercase tracking-wider mb-1">Overall Q-Score</p>
              <p className="text-xs text-indigo-600/70 dark:text-indigo-500/70">Weighted Average</p>
            </div>
            <ProgressBadge score={overallScore} size="lg" />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {goals.map(goal => {
          const state = checkins[goal.id];
          const val = Number(state.achievement) || 0;
          const score = calculateProgressScore(goal.uom_type, goal.target || 0, val);
          const isTimeline = goal.uom_type === 'timeline';

          return (
            <Card key={goal.id} className="overflow-hidden">
              <div className="p-5 grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left: Goal Info */}
                <div className="md:col-span-5 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {goal.weightage}% WT
                    </span>
                  </div>
                  <h3 className="font-semibold text-base leading-snug">{goal.title}</h3>
                  <div className="text-sm text-slate-500 flex gap-4 pt-1">
                    <span>Target: <strong className="text-slate-700 dark:text-slate-300">{goal.target}</strong></span>
                    <span className="capitalize border-l pl-4 border-slate-200 dark:border-slate-800">
                      {goal.uom_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Right: Inputs */}
                <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Actual Achievement</label>
                    <div className="flex items-center gap-3">
                      {isTimeline ? (
                        <Input 
                          type="date"
                          value={state.achievement}
                          onChange={e => handleUpdate(goal.id, 'achievement', e.target.value)}
                          disabled={readOnly}
                          required
                        />
                      ) : (
                        <Input 
                          type="number"
                          step="any"
                          value={state.achievement}
                          onChange={e => handleUpdate(goal.id, 'achievement', e.target.value)}
                          disabled={readOnly}
                          required
                          placeholder="0"
                          className="w-32"
                        />
                      )}
                      <ProgressBadge score={score} size="sm" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select 
                      value={state.status} 
                      onValueChange={v => handleUpdate(goal.id, 'status', v)}
                      disabled={readOnly}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="on_track">On Track</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-2 space-y-2 pt-2 border-t dark:border-slate-800 mt-2">
                    <label className="text-sm font-medium">Employee Comment (Optional)</label>
                    <Textarea 
                      placeholder="Share context on achievements or blockers..."
                      value={state.comment}
                      onChange={e => handleUpdate(goal.id, 'comment', e.target.value)}
                      disabled={readOnly}
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {!readOnly && (
        <div className="flex justify-end pt-4 sticky bottom-6 z-10">
          <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto shadow-lg shadow-indigo-200 dark:shadow-none">
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
            Submit {quarter} Check-in
          </Button>
        </div>
      )}
    </form>
  );
}
