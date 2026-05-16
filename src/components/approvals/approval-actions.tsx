'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { approveOrReturnGoalSheet } from '@/actions/approvals';
import { toast } from 'sonner';
import { Check, X, Loader2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

interface ApprovalActionsProps {
  employeeId: string;
  cycleId: string;
  goalEdits?: Array<{ goal_id: string; target?: number; weightage?: number }>;
  disabled?: boolean;
}

export function ApprovalActions({ employeeId, cycleId, goalEdits, disabled }: ApprovalActionsProps) {
  const [loading, setLoading] = useState<'approve' | 'return' | null>(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState('');

  const handleApprove = async () => {
    setLoading('approve');
    try {
      const result = await approveOrReturnGoalSheet({
        employee_id: employeeId,
        cycle_id: cycleId,
        action: 'approved',
        goal_edits: goalEdits
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to approve goals');
        return;
      }

      toast.success('Goals approved and locked successfully');
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(null);
    }
  };

  const handleReturn = async () => {
    if (!comment.trim()) {
      setCommentError('Comment is required when returning goals');
      return;
    }
    
    setLoading('return');
    try {
      const result = await approveOrReturnGoalSheet({
        employee_id: employeeId,
        cycle_id: cycleId,
        action: 'returned',
        comment: comment
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to return goals');
        return;
      }

      toast.success('Goals returned to employee for rework');
      setReturnModalOpen(false);
      setComment('');
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button 
        variant="outline" 
        className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-900/50 dark:hover:bg-orange-900/20"
        onClick={() => setReturnModalOpen(true)}
        disabled={loading !== null}
      >
        {loading === 'return' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
        Return for Rework
      </Button>

      <ConfirmDialog
        title="Approve Goals"
        description="Are you sure you want to approve and lock these goals? The employee will be notified."
        onConfirm={handleApprove}
        trigger={
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white"
            disabled={disabled || loading !== null}
          >
            {loading === 'approve' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Approve & Lock
          </Button>
        }
      />

      <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return for Rework</DialogTitle>
            <DialogDescription>
              Provide feedback to the employee on what needs to be changed before approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="e.g. Please increase the target for the Q3 sales goal..."
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setCommentError('');
              }}
              className={commentError ? 'border-red-500' : ''}
              rows={4}
            />
            {commentError && <p className="text-sm text-red-500">{commentError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReturnModalOpen(false)} disabled={loading === 'return'}>
              Cancel
            </Button>
            <Button onClick={handleReturn} disabled={loading === 'return'} className="bg-orange-600 hover:bg-orange-700">
              {loading === 'return' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send back to Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
