export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      approvals: {
        Row: {
          action: Database["public"]["Enums"]["approval_action"]
          comment: string | null
          created_at: string
          cycle_id: string
          id: string
          manager_id: string | null
          profile_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["approval_action"]
          comment?: string | null
          created_at?: string
          cycle_id: string
          id?: string
          manager_id?: string | null
          profile_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["approval_action"]
          comment?: string | null
          created_at?: string
          cycle_id?: string
          id?: string
          manager_id?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approvals_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approvals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          goal_id: string | null
          id: string
          new_state: Json | null
          previous_state: Json | null
          profile_id: string
          reason: string | null
        }
        Insert: {
          action: string
          created_at?: string
          goal_id?: string | null
          id?: string
          new_state?: Json | null
          previous_state?: Json | null
          profile_id: string
          reason?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          goal_id?: string | null
          id?: string
          new_state?: Json | null
          previous_state?: Json | null
          profile_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cycles: {
        Row: {
          created_at: string
          end_date: string
          goal_setting_deadline: string
          id: string
          is_active: boolean
          name: string
          q1_end: string
          q1_start: string
          q2_end: string
          q2_start: string
          q3_end: string
          q3_start: string
          q4_end: string
          q4_start: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          goal_setting_deadline: string
          id?: string
          is_active?: boolean
          name: string
          q1_end: string
          q1_start: string
          q2_end: string
          q2_start: string
          q3_end: string
          q3_start: string
          q4_end: string
          q4_start: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          goal_setting_deadline?: string
          id?: string
          is_active?: boolean
          name?: string
          q1_end?: string
          q1_start?: string
          q2_end?: string
          q2_start?: string
          q3_end?: string
          q3_start?: string
          q4_end?: string
          q4_start?: string
          start_date?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      escalation_rules: {
        Row: {
          created_at: string
          days_threshold: number
          id: string
          is_active: boolean
          type: Database["public"]["Enums"]["escalation_type"]
        }
        Insert: {
          created_at?: string
          days_threshold: number
          id?: string
          is_active?: boolean
          type: Database["public"]["Enums"]["escalation_type"]
        }
        Update: {
          created_at?: string
          days_threshold?: number
          id?: string
          is_active?: boolean
          type?: Database["public"]["Enums"]["escalation_type"]
        }
        Relationships: []
      }
      escalations: {
        Row: {
          created_at: string
          cycle_id: string
          escalated_to_id: string
          id: string
          resolved_at: string | null
          target_user_id: string
          type: Database["public"]["Enums"]["escalation_type"]
        }
        Insert: {
          created_at?: string
          cycle_id: string
          escalated_to_id: string
          id?: string
          resolved_at?: string | null
          target_user_id: string
          type: Database["public"]["Enums"]["escalation_type"]
        }
        Update: {
          created_at?: string
          cycle_id?: string
          escalated_to_id?: string
          id?: string
          resolved_at?: string | null
          target_user_id?: string
          type?: Database["public"]["Enums"]["escalation_type"]
        }
        Relationships: [
          {
            foreignKeyName: "escalations_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_escalated_to_id_fkey"
            columns: ["escalated_to_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalations_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          cycle_id: string
          description: string | null
          id: string
          profile_id: string
          status: Database["public"]["Enums"]["goal_status"]
          target: number | null
          target_date: string | null
          thrust_area_id: string
          title: string
          uom_type: Database["public"]["Enums"]["uom_type"]
          updated_at: string
          weightage: number
        }
        Insert: {
          created_at?: string
          cycle_id: string
          description?: string | null
          id?: string
          profile_id: string
          status?: Database["public"]["Enums"]["goal_status"]
          target?: number | null
          target_date?: string | null
          thrust_area_id: string
          title: string
          uom_type: Database["public"]["Enums"]["uom_type"]
          updated_at?: string
          weightage: number
        }
        Update: {
          created_at?: string
          cycle_id?: string
          description?: string | null
          id?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["goal_status"]
          target?: number | null
          target_date?: string | null
          thrust_area_id?: string
          title?: string
          uom_type?: Database["public"]["Enums"]["uom_type"]
          updated_at?: string
          weightage?: number
        }
        Relationships: [
          {
            foreignKeyName: "goals_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_thrust_area_id_fkey"
            columns: ["thrust_area_id"]
            isOneToOne: false
            referencedRelation: "thrust_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_comments: {
        Row: {
          comment: string
          created_at: string
          cycle_id: string
          id: string
          manager_id: string
          profile_id: string
          quarter: Database["public"]["Enums"]["quarter_type"]
          rating: number | null
          updated_at: string
        }
        Insert: {
          comment: string
          created_at?: string
          cycle_id: string
          id?: string
          manager_id: string
          profile_id: string
          quarter: Database["public"]["Enums"]["quarter_type"]
          rating?: number | null
          updated_at?: string
        }
        Update: {
          comment?: string
          created_at?: string
          cycle_id?: string
          id?: string
          manager_id?: string
          profile_id?: string
          quarter?: Database["public"]["Enums"]["quarter_type"]
          rating?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_comments_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_comments_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department_id: string | null
          email: string
          employee_code: string | null
          first_name: string
          full_name: string
          id: string
          last_name: string
          manager_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          email: string
          employee_code?: string | null
          first_name: string
          full_name?: string
          id: string
          last_name: string
          manager_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          email?: string
          employee_code?: string | null
          first_name?: string
          full_name?: string
          id?: string
          last_name?: string
          manager_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quarterly_checkins: {
        Row: {
          achievement: number | null
          achievement_date: string | null
          comment: string | null
          created_at: string
          goal_id: string
          id: string
          quarter: Database["public"]["Enums"]["quarter_type"]
          status: Database["public"]["Enums"]["progress_status"]
          updated_at: string
        }
        Insert: {
          achievement?: number | null
          achievement_date?: string | null
          comment?: string | null
          created_at?: string
          goal_id: string
          id?: string
          quarter: Database["public"]["Enums"]["quarter_type"]
          status?: Database["public"]["Enums"]["progress_status"]
          updated_at?: string
        }
        Update: {
          achievement?: number | null
          achievement_date?: string | null
          comment?: string | null
          created_at?: string
          goal_id?: string
          id?: string
          quarter?: Database["public"]["Enums"]["quarter_type"]
          status?: Database["public"]["Enums"]["progress_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quarterly_checkins_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_goals: {
        Row: {
          created_at: string
          id: string
          primary_goal_id: string
          recipient_profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          primary_goal_id: string
          recipient_profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          primary_goal_id?: string
          recipient_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_goals_primary_goal_id_fkey"
            columns: ["primary_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_goals_recipient_profile_id_fkey"
            columns: ["recipient_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      thrust_areas: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_progress_score: {
        Args: {
          p_achieve: number
          p_target: number
          p_uom: Database["public"]["Enums"]["uom_type"]
        }
        Returns: number
      }
      get_completion_heatmap: {
        Args: { p_cycle_id: string }
        Returns: {
          completion_rate: number
          department: string
          quarter: Database["public"]["Enums"]["quarter_type"]
        }[]
      }
      get_goal_distribution: {
        Args: { p_cycle_id: string; p_department_id: string | null }
        Returns: {
          count: number
          percentage: number
          thrust_area: string
        }[]
      }
      get_manager_effectiveness: {
        Args: { p_cycle_id: string }
        Returns: {
          avg_team_score: number
          check_in_completion_rate: number
          first_name: string
          last_name: string
          manager_id: string
        }[]
      }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_team_achievement_trend: {
        Args: { p_cycle_id: string; p_manager_id: string | null }
        Returns: {
          avg_score: number
          count: number
          quarter: Database["public"]["Enums"]["quarter_type"]
        }[]
      }
    }
    Enums: {
      approval_action:
        | "submitted"
        | "approved"
        | "returned"
        | "locked"
        | "unlocked"
      escalation_type:
        | "goal_not_submitted"
        | "goal_not_approved"
        | "checkin_not_completed"
      goal_status: "draft" | "submitted" | "approved" | "returned" | "locked"
      progress_status: "not_started" | "on_track" | "completed"
      quarter_type: "Q1" | "Q2" | "Q3" | "Q4"
      uom_type:
        | "numeric_min"
        | "numeric_max"
        | "percentage_min"
        | "percentage_max"
        | "timeline"
        | "zero_based"
      user_role: "employee" | "manager" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      approval_action: [
        "submitted",
        "approved",
        "returned",
        "locked",
        "unlocked",
      ],
      escalation_type: [
        "goal_not_submitted",
        "goal_not_approved",
        "checkin_not_completed",
      ],
      goal_status: ["draft", "submitted", "approved", "returned", "locked"],
      progress_status: ["not_started", "on_track", "completed"],
      quarter_type: ["Q1", "Q2", "Q3", "Q4"],
      uom_type: [
        "numeric_min",
        "numeric_max",
        "percentage_min",
        "percentage_max",
        "timeline",
        "zero_based",
      ],
      user_role: ["employee", "manager", "admin"],
    },
  },
} as const
