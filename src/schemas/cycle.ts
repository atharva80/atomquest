/**
 * Zod Validation Schemas for Cycle Management
 *
 * Used by admins to create and update performance cycles.
 */

import { z } from 'zod';

export const createCycleSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(100, "Name is too long"),
  start_date: z.string().datetime({ message: "Invalid cycle start date" }),
  end_date: z.string().datetime({ message: "Invalid cycle end date" }),
  goal_setting_deadline: z.string().datetime({ message: "Invalid deadline date" }),
  q1_start: z.string().datetime(),
  q1_end: z.string().datetime(),
  q2_start: z.string().datetime(),
  q2_end: z.string().datetime(),
  q3_start: z.string().datetime(),
  q3_end: z.string().datetime(),
  q4_start: z.string().datetime(),
  q4_end: z.string().datetime(),
  is_active: z.boolean().default(false),
})
.refine(c => new Date(c.end_date) > new Date(c.start_date), { 
  message: 'Cycle end date must be after start date',
  path: ['end_date']
})
.refine(c => new Date(c.goal_setting_deadline) >= new Date(c.start_date) && new Date(c.goal_setting_deadline) <= new Date(c.end_date), {
  message: 'Goal setting deadline must be within the cycle dates',
  path: ['goal_setting_deadline']
})
.refine(c => new Date(c.q1_end) > new Date(c.q1_start), { message: 'Q1 end must be after Q1 start', path: ['q1_end'] })
.refine(c => new Date(c.q2_start) > new Date(c.q1_end), { message: 'Q2 must start after Q1 ends', path: ['q2_start'] })
.refine(c => new Date(c.q2_end) > new Date(c.q2_start), { message: 'Q2 end must be after Q2 start', path: ['q2_end'] })
.refine(c => new Date(c.q3_start) > new Date(c.q2_end), { message: 'Q3 must start after Q2 ends', path: ['q3_start'] })
.refine(c => new Date(c.q3_end) > new Date(c.q3_start), { message: 'Q3 end must be after Q3 start', path: ['q3_end'] })
.refine(c => new Date(c.q4_start) > new Date(c.q3_end), { message: 'Q4 must start after Q3 ends', path: ['q4_start'] })
.refine(c => new Date(c.q4_end) > new Date(c.q4_start), { message: 'Q4 end must be after Q4 start', path: ['q4_end'] })
.refine(c => new Date(c.q1_start) >= new Date(c.start_date), { message: 'Q1 cannot start before cycle start date', path: ['q1_start'] })
.refine(c => new Date(c.q4_end) <= new Date(c.end_date), { message: 'Q4 cannot end after cycle end date', path: ['q4_end'] });

export const updateCycleSchema = createCycleSchema.partial();
