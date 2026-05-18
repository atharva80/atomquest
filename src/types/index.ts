/**
 * Application Types & Enums
 *
 * Extended application types that build on top of the auto-generated
 * Supabase types. Provides convenient aliases and composite types
 * used across components, actions, and queries.
 */

import type { Database as SupabaseDatabase, Json } from './supabase';

export const UserRole = {
  EMPLOYEE: 'employee',
  MANAGER: 'manager',
  ADMIN: 'admin',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const GoalStatus = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  RETURNED: 'returned',
  LOCKED: 'locked',
} as const;
export type GoalStatus = typeof GoalStatus[keyof typeof GoalStatus];

export const UomType = {
  NUMERIC_MIN: 'numeric_min',
  NUMERIC_MAX: 'numeric_max',
  PERCENTAGE_MIN: 'percentage_min',
  PERCENTAGE_MAX: 'percentage_max',
  TIMELINE: 'timeline',
  ZERO_BASED: 'zero_based',
} as const;
export type UomType = typeof UomType[keyof typeof UomType];

export const ProgressStatus = {
  NOT_STARTED: 'not_started',
  ON_TRACK: 'on_track',
  COMPLETED: 'completed',
} as const;
export type ProgressStatus = typeof ProgressStatus[keyof typeof ProgressStatus];

export const QuarterType = {
  Q1: 'Q1',
  Q2: 'Q2',
  Q3: 'Q3',
  Q4: 'Q4',
} as const;
export type QuarterType = typeof QuarterType[keyof typeof QuarterType];

export const EscalationType = {
  GOAL_NOT_SUBMITTED: 'goal_not_submitted',
  GOAL_NOT_APPROVED: 'goal_not_approved',
  CHECKIN_NOT_COMPLETED: 'checkin_not_completed',
} as const;
export type EscalationType = typeof EscalationType[keyof typeof EscalationType];

export const ApprovalAction = {
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  RETURNED: 'returned',
  LOCKED: 'locked',
  UNLOCKED: 'unlocked',
} as const;
export type ApprovalAction = typeof ApprovalAction[keyof typeof ApprovalAction];

export type Database = SupabaseDatabase;

// --- Table Row Aliases ---
export type Profile = Database['public']['Tables']['profiles']['Row'] & {
  full_name: string;
};
export type Goal = Database['public']['Tables']['goals']['Row'];
export type Cycle = Database['public']['Tables']['cycles']['Row'];
export type QuarterlyCheckin = Database['public']['Tables']['quarterly_checkins']['Row'];
export type ManagerComment = Database['public']['Tables']['manager_comments']['Row'];
export type Approval = Database['public']['Tables']['approvals']['Row'];
export type Escalation = Database['public']['Tables']['escalations']['Row'];
export type AuditLog = Database['public']['Tables']['audit_logs']['Row'];
export type Department = Database['public']['Tables']['departments']['Row'];
export type ThrustArea = Database['public']['Tables']['thrust_areas']['Row'];
export type SharedGoal = Database['public']['Tables']['shared_goals']['Row'];
export type EscalationRule = Database['public']['Tables']['escalation_rules']['Row'];

// --- Composite / Joined Types ---

export type GoalWithCheckins = Goal & {
  quarterly_checkins: QuarterlyCheckin[];
};

export type EmployeeGoalSheet = {
  profile: Profile;
  goals: GoalWithCheckins[];
  overallScore: number;
  status: GoalStatus;
};

export type TeamMember = Profile & {
  goalCount: number;
  overallScore: number;
  checkInStatus: ProgressStatus;
};

export type ApprovalWithGoals = Approval & {
  profile: Profile;
  goals: Goal[];
};

export type AuditLogEntry = AuditLog & {
  profile: Profile;
};

export type EscalationWithUser = Escalation & {
  target_user: Profile;
  escalated_to: Profile;
};

// --- Analytics Types ---

export type AchievementTrend = {
  quarter: QuarterType;
  avg_score: number;
  count: number;
};

export type CompletionHeatmapCell = {
  department: string;
  quarter: QuarterType;
  completion_rate: number;
};

export type GoalDistribution = {
  thrust_area?: string;
  uom_type?: string;
  status?: GoalStatus;
  count: number;
  percentage: number;
};

export type ManagerEffectiveness = {
  manager?: Profile;
  first_name?: string;
  last_name?: string;
  manager_id?: string;
  check_in_completion_rate: number;
  avg_team_score?: number;
  teamSize?: number;
};
