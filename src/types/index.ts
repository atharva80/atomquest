/**
 * Application Types & Enums
 *
 * Extended application types that build on top of the auto-generated
 * Supabase types. Provides convenient aliases and composite types
 * used across components, actions, and queries.
 */

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

// --- Temporary Database Types (Replace when supabase types are generated) ---
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          role: UserRole;
          department_id: string | null;
          manager_id: string | null;
          employee_code: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      goals: {
        Row: {
          id: string;
          profile_id: string;
          cycle_id: string;
          thrust_area_id: string;
          title: string;
          description: string | null;
          uom_type: UomType;
          target: number | null;
          weightage: number;
          status: GoalStatus;
          created_at: string;
          updated_at: string;
        };
      };
      cycles: {
        Row: {
          id: string;
          name: string;
          start_date: string;
          end_date: string;
          is_active: boolean;
          created_at: string;
        };
      };
      quarterly_checkins: {
        Row: {
          id: string;
          goal_id: string;
          quarter: QuarterType;
          achievement: number | null;
          comment: string | null;
          status: ProgressStatus;
          created_at: string;
          updated_at: string;
        };
      };
      manager_comments: {
        Row: {
          id: string;
          profile_id: string;
          manager_id: string;
          cycle_id: string;
          quarter: QuarterType;
          comment: string;
          created_at: string;
          updated_at: string;
        };
      };
      approvals: {
        Row: {
          id: string;
          profile_id: string;
          manager_id: string | null;
          cycle_id: string;
          action: ApprovalAction;
          comment: string | null;
          created_at: string;
        };
      };
      escalations: {
        Row: {
          id: string;
          target_user_id: string;
          escalated_to_id: string;
          type: EscalationType;
          cycle_id: string;
          resolved_at: string | null;
          created_at: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          profile_id: string;
          goal_id: string | null;
          action: string;
          previous_state: any | null;
          new_state: any | null;
          reason: string | null;
          created_at: string;
        };
      };
      departments: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
      };
      thrust_areas: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
      };
      shared_goals: {
        Row: {
          id: string;
          primary_goal_id: string;
          recipient_profile_id: string;
          created_at: string;
        };
      };
      escalation_rules: {
        Row: {
          id: string;
          type: EscalationType;
          days_threshold: number;
          is_active: boolean;
          created_at: string;
        };
      };
    };
  };
}

// --- Table Row Aliases ---
export type Profile = Database['public']['Tables']['profiles']['Row'];
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
  avgScore: number;
  count: number;
};

export type CompletionHeatmapCell = {
  department: string;
  quarter: QuarterType;
  completionRate: number;
};

export type GoalDistribution = {
  thrustArea: string;
  count: number;
  percentage: number;
};

export type ManagerEffectiveness = {
  manager: Profile;
  checkInCompletionRate: number;
  avgTeamScore: number;
};
