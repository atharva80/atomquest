/**
 * Zod Validation Schemas for Goals
 *
 * Used in both client-side React Hook Form validation and
 * server-side Next.js Server Actions.
 */

import { z } from 'zod';
import { UomType } from '@/types';
import { VALIDATION } from '@/lib/constants';

const uomTypeEnum = z.enum([
  UomType.NUMERIC_MIN,
  UomType.NUMERIC_MAX,
  UomType.PERCENTAGE_MIN,
  UomType.PERCENTAGE_MAX,
  UomType.TIMELINE,
  UomType.ZERO_BASED,
]);

const baseGoalSchema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title is too long"),
    description: z.string().min(0).max(1000, "Description is too long").optional().nullable(),
    thrust_area_id: z.string().uuid("Invalid Thrust Area"),
    uom_type: uomTypeEnum,
    // We accept union of number or string to accommodate dates for TIMELINE
    target: z.union([z.number(), z.string()]).nullable().optional(),
    weightage: z
      .number()
      .min(VALIDATION.MIN_WEIGHTAGE_PER_GOAL, `Minimum weightage is ${VALIDATION.MIN_WEIGHTAGE_PER_GOAL}%`)
      .max(VALIDATION.TOTAL_WEIGHTAGE, `Maximum weightage is ${VALIDATION.TOTAL_WEIGHTAGE}%`),
  });

export const createGoalSchema = baseGoalSchema
  .superRefine((data, ctx) => {
    // 1. Timeline validation
    if (data.uom_type === UomType.TIMELINE) {
      if (!data.target) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['target'],
          message: 'Target date is required for Timeline goals',
        });
      } else {
        const dateStr = String(data.target);
        if (isNaN(Date.parse(dateStr))) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['target'],
            message: 'Invalid date format',
          });
        }
      }
    } 
    // 2. Zero-Based validation
    else if (data.uom_type === UomType.ZERO_BASED) {
      if (data.target !== 0 && data.target !== '0' && data.target !== null && data.target !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['target'],
          message: 'Target must be 0 for Zero-Based goals (or left empty)',
        });
      }
    } 
    // 3. Numeric/Percentage validation
    else {
      if (data.target === null || data.target === undefined || data.target === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['target'],
          message: 'Numeric target is required',
        });
      } else {
        const num = Number(data.target);
        if (isNaN(num) || num <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['target'],
            message: 'Target must be a positive number',
          });
        }
      }
    }
  });

export const updateGoalSchema = baseGoalSchema.partial();

export const goalSheetSchema = z.object({
  goals: z.array(createGoalSchema)
    .min(1, "You must have at least one goal")
    .max(VALIDATION.MAX_GOALS_PER_EMPLOYEE, `You cannot exceed ${VALIDATION.MAX_GOALS_PER_EMPLOYEE} goals`),
}).refine(sheet => {
  const totalWeightage = sheet.goals.reduce((sum, g) => sum + (g.weightage || 0), 0);
  return totalWeightage === VALIDATION.TOTAL_WEIGHTAGE;
}, { 
  message: `Total weightage across all goals must equal exactly ${VALIDATION.TOTAL_WEIGHTAGE}%`,
  path: ['goals'] 
});

export const managerEditSchema = z.object({
  goalId: z.string().uuid(),
  target: z.union([z.number(), z.string()]).optional(),
  weightage: z.number().min(VALIDATION.MIN_WEIGHTAGE_PER_GOAL).max(VALIDATION.TOTAL_WEIGHTAGE).optional(),
});
