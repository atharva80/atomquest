'use client';

import { useState } from 'react';
import { Profile, Goal } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, User } from 'lucide-react';
import { ApprovalActions } from './approval-actions';
import { InlineEditRow } from './inline-edit-row';
import { ProgressSummary } from '@/components/ai/progress-summary';

interface ApprovalCardProps {
  employee: Profile;
  goals: Goal[];
  submittedAt: string;
  cycleId: string;
}

export function ApprovalCard({ employee, goals, submittedAt, cycleId }: ApprovalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [edits, setEdits] = useState<Record<string, { target?: number, weightage?: number }>>({});

  const handleEdit = (goalId: string, field: 'target' | 'weightage', value: number) => {
    setEdits(prev => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        [field]: value
      }
    }));
  };

  const totalWeightage = goals.reduce((sum, g) => sum + (edits[g.id]?.weightage ?? g.weightage), 0);
  const isValid = totalWeightage === 100;

  // Convert edits object to array format for action
  const goalEditsArray = Object.entries(edits).map(([id, changes]) => ({
    goal_id: id,
    ...changes
  }));

  return (
    <Card className="mb-4 overflow-hidden border-indigo-100 shadow-sm dark:border-indigo-900/50">
      <CardHeader 
        className="cursor-pointer bg-slate-50 dark:bg-slate-900/50 p-4 transition-colors hover:bg-slate-100 dark:hover:bg-slate-900"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400">
              <User size={20} />
            </div>
            <div>
              <CardTitle className="text-base">{employee.first_name} {employee.last_name}</CardTitle>
              <CardDescription>
                Submitted {new Date(submittedAt).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-slate-500">Goals</span>
              <span className="font-bold">{goals.length}</span>
            </div>
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium text-slate-500">Weightage</span>
              <div className="flex items-center gap-2">
                <span className={`font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {totalWeightage}%
                </span>
                {isValid && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Valid</Badge>}
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="p-0 border-t">
          <div className="p-4 border-b bg-slate-50/20 dark:bg-slate-900/10">
            <ProgressSummary employeeId={employee.id} />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">UoM</th>
                  <th className="px-4 py-3 font-medium">Target</th>
                  <th className="px-4 py-3 font-medium">Weightage</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {goals.map(goal => (
                  <InlineEditRow 
                    key={goal.id} 
                    goal={goal} 
                    onEdit={(field, value) => handleEdit(goal.id, field, value)}
                    editedTarget={edits[goal.id]?.target}
                    editedWeightage={edits[goal.id]?.weightage}
                  />
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right font-medium">Total Weightage:</td>
                  <td className={`px-4 py-3 font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {totalWeightage}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div className="p-4 bg-slate-50/50 dark:bg-slate-900/20 border-t flex justify-end">
            <ApprovalActions 
              employeeId={employee.id} 
              cycleId={cycleId} 
              goalEdits={goalEditsArray.length > 0 ? goalEditsArray : undefined}
              disabled={!isValid}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
