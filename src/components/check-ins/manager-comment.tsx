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
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-zinc-500">forum</span>
            <h4 className="font-table-cell-primary text-table-cell-primary text-zinc-900">Manager Feedback</h4>
            {existingComment.rating && (
              <div className="flex items-center ml-2 text-zinc-800">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`material-symbols-outlined text-[14px] ${i < existingComment.rating! ? 'data-[weight=fill]:true' : 'text-zinc-300'}`} data-weight={i < existingComment.rating! ? "fill" : ""}>star</span>
                ))}
              </div>
            )}
          </div>
          {!readOnly && (
            <button className="text-[12px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors" onClick={() => setIsEditing(true)}>
              Edit
            </button>
          )}
        </div>
        <p className="font-body-sm text-body-sm text-zinc-700 whitespace-pre-wrap">
          {existingComment.comment}
        </p>
      </div>
    );
  }

  if (readOnly && !existingComment) {
    return (
      <div className="flex items-center justify-center p-4 border border-dashed border-zinc-200 rounded-lg text-zinc-500 font-body-sm text-body-sm italic">
        Awaiting manager feedback...
      </div>
    );
  }

  if (!isEditing && !existingComment && !readOnly) {
    return (
      <button className="w-full py-2 border border-dashed border-zinc-300 rounded font-table-cell-primary text-table-cell-primary text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors flex items-center justify-center gap-2" onClick={() => setIsEditing(true)}>
        <span className="material-symbols-outlined text-[16px]">add_comment</span> Add Check-in Feedback
      </button>
    );
  }

  return (
    <div className="border border-zinc-200 rounded-lg p-4 bg-white shadow-sm">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="font-medium text-[14px] text-zinc-900">Feedback Comment <span className="text-red-500">*</span></label>
          <div className="flex items-center gap-1 cursor-pointer" onMouseLeave={() => setHoverRating(0)}>
            {Array.from({ length: 5 }).map((_, i) => (
              <span 
                key={i} 
                className={`material-symbols-outlined text-[18px] transition-colors ${i < (hoverRating || rating) ? 'text-zinc-900' : 'text-zinc-300'}`}
                data-weight={i < (hoverRating || rating) ? "fill" : ""}
                onMouseEnter={() => setHoverRating(i + 1)}
                onClick={() => setRating(i + 1)}
              >
                star
              </span>
            ))}
          </div>
        </div>
        <textarea 
          placeholder="Provide constructive feedback on this quarter's achievement..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-white border border-zinc-200 rounded text-[14px] font-body-sm focus:outline-none focus:border-zinc-400 focus:ring-0 transition-colors resize-none"
        />
        <p className="font-caption text-caption text-zinc-500 mt-1 flex justify-between">
          <span>Minimum 10 characters</span>
          <span>{comment.length} chars</span>
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <button 
          className="px-4 py-2 bg-white border border-zinc-200 text-zinc-900 font-medium text-[14px] rounded hover:bg-zinc-50 transition-colors leading-[20px]" 
          onClick={() => {
            setIsEditing(false);
            setComment(existingComment?.comment || '');
            setRating(existingComment?.rating || 0);
          }} 
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          className="px-4 py-2 bg-zinc-900 text-white font-medium text-[14px] rounded hover:bg-zinc-800 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 leading-[20px]" 
          onClick={handleSubmit} 
          disabled={loading || comment.length < 10}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Feedback
        </button>
      </div>
    </div>
  );
}
