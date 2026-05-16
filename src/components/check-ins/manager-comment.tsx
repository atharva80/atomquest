'use client';

import { useState } from 'react';
import { QuarterType } from '@/types';
import { submitManagerComment } from '@/actions/check-ins';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MessageSquare, Star, Loader2, Send } from 'lucide-react';

interface ManagerCommentProps {
  existingComment?: { id?: string; comment: string; rating?: number };
  employeeId: string;
  cycleId: string;
  quarter: QuarterType;
  readOnly?: boolean;
}

export function ManagerComment({ existingComment, employeeId, cycleId, quarter, readOnly = false }: ManagerCommentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState(existingComment?.comment || '');
  const [rating, setRating] = useState<number>(existingComment?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async () => {
    if (!comment.trim() || comment.length < 10) {
      toast.error('Comment must be at least 10 characters');
      return;
    }

    setLoading(true);
    try {
      const result = await submitManagerComment({
        employee_id: employeeId,
        cycle_id: cycleId,
        quarter,
        comment,
        rating: rating > 0 ? rating : undefined
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to submit comment');
        return;
      }

      toast.success('Feedback submitted successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (existingComment && !isEditing) {
    return (
      <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-indigo-500" />
            <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">Manager Feedback</h4>
            {existingComment.rating && (
              <div className="flex items-center ml-2 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3 w-3 ${i < existingComment.rating! ? 'fill-current' : 'text-slate-300 dark:text-slate-700'}`} />
                ))}
              </div>
            )}
          </div>
          {!readOnly && (
            <Button variant="ghost" size="sm" className="h-6 text-xs text-indigo-600 hover:text-indigo-800" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </div>
        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
          {existingComment.comment}
        </p>
      </div>
    );
  }

  if (readOnly && !existingComment) {
    return (
      <div className="flex items-center justify-center p-4 border border-dashed rounded-lg text-slate-500 text-sm italic">
        Awaiting manager feedback...
      </div>
    );
  }

  if (!isEditing && !existingComment && !readOnly) {
    return (
      <Button variant="outline" className="w-full border-dashed text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={() => setIsEditing(true)}>
        <MessageSquare className="mr-2 h-4 w-4" /> Add Check-in Feedback
      </Button>
    );
  }

  return (
    <div className="border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 bg-white dark:bg-slate-900 shadow-sm">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium">Feedback Comment <span className="text-red-500">*</span></label>
          <div className="flex items-center gap-1 cursor-pointer" onMouseLeave={() => setHoverRating(0)}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star 
                key={i} 
                className={`h-5 w-5 transition-colors ${i < (hoverRating || rating) ? 'fill-amber-500 text-amber-500' : 'text-slate-300 dark:text-slate-700'}`}
                onMouseEnter={() => setHoverRating(i + 1)}
                onClick={() => setRating(i + 1)}
              />
            ))}
          </div>
        </div>
        <Textarea 
          placeholder="Provide constructive feedback on this quarter's achievement..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="resize-none focus-visible:ring-indigo-500"
        />
        <p className="text-xs text-slate-500 mt-1 flex justify-between">
          <span>Minimum 10 characters</span>
          <span>{comment.length} chars</span>
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={() => {
          setIsEditing(false);
          setComment(existingComment?.comment || '');
          setRating(existingComment?.rating || 0);
        }} disabled={loading}>
          Cancel
        </Button>
        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSubmit} disabled={loading || comment.length < 10}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Submit Feedback
        </Button>
      </div>
    </div>
  );
}
