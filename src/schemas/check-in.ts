/**
 * Zod Validation Schemas for Check-ins
 *
 * Used for employee quarterly check-ins and manager comments.
 */

import { z } from 'zod';
import { QuarterType, ProgressStatus } from '@/types';

const quarterEnum = z.enum([
  QuarterType.Q1,
  QuarterType.Q2,
  QuarterType.Q3,
  QuarterType.Q4,
]);

const progressStatusEnum = z.enum([
  ProgressStatus.NOT_STARTED,
  ProgressStatus.ON_TRACK,
  ProgressStatus.COMPLETED,
]);

export const submitCheckinSchema = z.object({
  goal_id: z.string().uuid("Invalid Goal ID"),
  quarter: quarterEnum,
  // We use union to allow string date submissions for Timeline goals
  actual_achievement: z.union([
    z.number().min(0, "Achievement cannot be negative"),
    z.string()
  ]).nullable(),
  progress_status: progressStatusEnum,
  employee_comment: z.string().max(500, "Comment cannot exceed 500 characters").optional().nullable(),
});

export const batchCheckinSchema = z.object({
  cycle_id: z.string().uuid("Invalid Cycle ID"),
  quarter: quarterEnum,
  checkins: z.array(submitCheckinSchema).min(1, "At least one check-in is required"),
});

export const managerCommentSchema = z.object({
  employee_id: z.string().uuid("Invalid Employee ID"),
  cycle_id: z.string().uuid("Invalid Cycle ID"),
  quarter: quarterEnum,
  comment: z.string().min(10, "Comment must be at least 10 characters").max(2000, "Comment is too long"),
  rating: z.number().min(1).max(5).optional().nullable(),
});
