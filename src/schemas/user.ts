/**
 * Zod Validation Schemas for User Management
 *
 * Used by admins to manage profiles, roles, and reporting lines.
 */

import { z } from 'zod';
import { UserRole } from '@/types';

const roleEnum = z.enum([
  UserRole.EMPLOYEE,
  UserRole.MANAGER,
  UserRole.ADMIN,
]);

export const updateProfileSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters").max(50, "First name is too long"),
  last_name: z.string().min(2, "Last name must be at least 2 characters").max(50, "Last name is too long"),
  role: roleEnum,
  department_id: z.string().uuid("Invalid Department ID").nullable().optional(),
  // manager_id is nullable (e.g. for top-level admins or CEOs)
  manager_id: z.string().uuid("Invalid Manager ID").nullable().optional(),
  employee_code: z.string().max(20, "Employee code is too long").optional().nullable(),
});

export const bulkAssignManagerSchema = z.object({
  employee_ids: z.array(z.string().uuid("Invalid Employee ID")).min(1, "Select at least one employee"),
  manager_id: z.string().uuid("Invalid Manager ID"),
});
