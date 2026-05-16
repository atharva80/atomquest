/**
 * Zod Validation Schemas for Approvals
 *
 * Used for goal sheet approval workflows and admin unlocks.
 */

import { z } from 'zod';
import { ApprovalAction } from '@/types';
import { VALIDATION } from '@/lib/constants';

const actionEnum = z.enum([ApprovalAction.APPROVED, ApprovalAction.RETURNED]);

export const approveGoalSheetSchema = z.object({
  employee_id: z.string().uuid("Invalid Employee ID"),
  cycle_id: z.string().uuid("Invalid Cycle ID"),
  action: actionEnum,
  comment: z.string().max(1000, "Comment is too long").optional().nullable(),
  goal_edits: z.array(z.object({
    goal_id: z.string().uuid("Invalid Goal ID"),
    // Union to allow string date values for Timeline targets
    target: z.union([z.number(), z.string()]).optional().nullable(),
    weightage: z.number().min(VALIDATION.MIN_WEIGHTAGE_PER_GOAL).max(VALIDATION.TOTAL_WEIGHTAGE).optional(),
  })).optional(),
}).refine(data => {
  if (data.action === ApprovalAction.RETURNED && (!data.comment || data.comment.trim() === '')) {
    return false;
  }
  return true;
}, { 
  message: 'Comment is required when returning goals for rework',
  path: ['comment']
}).refine(data => {
  // If we have edits, we need to ensure the new sum of weightages (if weightages were changed)
  // still equals 100. However, this schema only sees the EDITS, not the full goal sheet.
  // The full validation (total === 100) must happen in the Server Action where we can fetch 
  // the unmodified goals and combine them with the edits.
  // We just do basic sanity checks here.
  return true;
});

export const unlockGoalSheetSchema = z.object({
  employee_id: z.string().uuid("Invalid Employee ID"),
  cycle_id: z.string().uuid("Invalid Cycle ID"),
  reason: z.string().min(10, "A detailed reason (min 10 chars) is required for unlocking").max(500, "Reason is too long"),
});
