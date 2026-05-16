-- ============================================
-- AtomQuest — Initial Database Schema
-- ============================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Custom Enums
CREATE TYPE user_role AS ENUM ('employee', 'manager', 'admin');
CREATE TYPE goal_status AS ENUM ('draft', 'submitted', 'approved', 'returned', 'locked');
CREATE TYPE uom_type AS ENUM ('numeric_min', 'numeric_max', 'percentage_min', 'percentage_max', 'timeline', 'zero_based');
CREATE TYPE progress_status AS ENUM ('not_started', 'on_track', 'completed');
CREATE TYPE quarter_type AS ENUM ('Q1', 'Q2', 'Q3', 'Q4');
CREATE TYPE escalation_type AS ENUM ('goal_not_submitted', 'goal_not_approved', 'checkin_not_completed');
CREATE TYPE approval_action AS ENUM ('submitted', 'approved', 'returned', 'locked', 'unlocked');

-- 3. Tables (In dependency order)

-- Departments
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    employee_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cycles
CREATE TABLE cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    goal_setting_deadline TIMESTAMPTZ NOT NULL,
    q1_start TIMESTAMPTZ NOT NULL,
    q1_end TIMESTAMPTZ NOT NULL,
    q2_start TIMESTAMPTZ NOT NULL,
    q2_end TIMESTAMPTZ NOT NULL,
    q3_start TIMESTAMPTZ NOT NULL,
    q3_end TIMESTAMPTZ NOT NULL,
    q4_start TIMESTAMPTZ NOT NULL,
    q4_end TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Thrust Areas
CREATE TABLE thrust_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Goals
CREATE TABLE goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    thrust_area_id UUID NOT NULL REFERENCES thrust_areas(id) ON DELETE RESTRICT,
    title TEXT NOT NULL,
    description TEXT,
    uom_type uom_type NOT NULL,
    target NUMERIC, -- Can be null for ZERO_BASED, or hold timestamp epoch for TIMELINE
    target_date TIMESTAMPTZ, -- Explicit column for TIMELINE type
    weightage NUMERIC NOT NULL CHECK (weightage >= 10 AND weightage <= 100),
    status goal_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shared Goals (Linking table)
CREATE TABLE shared_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    recipient_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(primary_goal_id, recipient_profile_id)
);

-- Quarterly Checkins
CREATE TABLE quarterly_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    quarter quarter_type NOT NULL,
    achievement NUMERIC,
    achievement_date TIMESTAMPTZ, -- Explicit for TIMELINE
    comment TEXT,
    status progress_status NOT NULL DEFAULT 'not_started',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(goal_id, quarter)
);

-- Manager Comments
CREATE TABLE manager_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    cycle_id UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    quarter quarter_type NOT NULL,
    comment TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(profile_id, cycle_id, quarter)
);

-- Approvals
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    cycle_id UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    action approval_action NOT NULL,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Escalations
CREATE TABLE escalations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    escalated_to_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type escalation_type NOT NULL,
    cycle_id UUID NOT NULL REFERENCES cycles(id) ON DELETE CASCADE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Escalation Rules
CREATE TABLE escalation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type escalation_type NOT NULL,
    days_threshold INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(type)
);

-- 4. Indexes
CREATE INDEX idx_profiles_manager_id ON profiles(manager_id);
CREATE INDEX idx_profiles_department_id ON profiles(department_id);
CREATE INDEX idx_goals_profile_id ON goals(profile_id);
CREATE INDEX idx_goals_cycle_id ON goals(cycle_id);
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_quarterly_checkins_goal_id ON quarterly_checkins(goal_id);
CREATE INDEX idx_manager_comments_profile_cycle ON manager_comments(profile_id, cycle_id);
CREATE INDEX idx_approvals_profile_id ON approvals(profile_id);
CREATE INDEX idx_escalations_target_user_id ON escalations(target_user_id);
CREATE INDEX idx_escalations_resolved_at ON escalations(resolved_at);

-- 5. Row Level Security (RLS)

-- Helper function to get current user's role from profile
CREATE OR REPLACE FUNCTION get_my_role() RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated can read departments" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can write departments" ON departments FOR ALL TO authenticated USING (get_my_role() = 'admin');

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Managers can read their team's profiles" ON profiles FOR SELECT TO authenticated USING (manager_id = auth.uid());
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT TO authenticated USING (get_my_role() = 'admin');
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins can manage all profiles" ON profiles FOR ALL TO authenticated USING (get_my_role() = 'admin');

ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated can read cycles" ON cycles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can write cycles" ON cycles FOR ALL TO authenticated USING (get_my_role() = 'admin');

ALTER TABLE thrust_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "All authenticated can read thrust areas" ON thrust_areas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can write thrust areas" ON thrust_areas FOR ALL TO authenticated USING (get_my_role() = 'admin');

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own goals" ON goals FOR ALL TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "Managers can view team goals" ON goals FOR SELECT TO authenticated USING (
  profile_id IN (SELECT id FROM profiles WHERE manager_id = auth.uid())
);
CREATE POLICY "Managers can update team goals" ON goals FOR UPDATE TO authenticated USING (
  profile_id IN (SELECT id FROM profiles WHERE manager_id = auth.uid())
);
CREATE POLICY "Admins can view all goals" ON goals FOR SELECT TO authenticated USING (get_my_role() = 'admin');

ALTER TABLE shared_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their shared goals" ON shared_goals FOR SELECT TO authenticated USING (
  recipient_profile_id = auth.uid() OR primary_goal_id IN (SELECT id FROM goals WHERE profile_id = auth.uid())
);
CREATE POLICY "Admins can view all shared goals" ON shared_goals FOR SELECT TO authenticated USING (get_my_role() = 'admin');
CREATE POLICY "Primary owners can create shared goals" ON shared_goals FOR INSERT TO authenticated WITH CHECK (
  primary_goal_id IN (SELECT id FROM goals WHERE profile_id = auth.uid())
);

ALTER TABLE quarterly_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own checkins" ON quarterly_checkins FOR ALL TO authenticated USING (
  goal_id IN (SELECT id FROM goals WHERE profile_id = auth.uid())
);
CREATE POLICY "Managers can view team checkins" ON quarterly_checkins FOR SELECT TO authenticated USING (
  goal_id IN (SELECT id FROM goals WHERE profile_id IN (SELECT id FROM profiles WHERE manager_id = auth.uid()))
);
CREATE POLICY "Admins can view all checkins" ON quarterly_checkins FOR SELECT TO authenticated USING (get_my_role() = 'admin');

ALTER TABLE manager_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view comments on themselves" ON manager_comments FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "Managers can manage comments on their team" ON manager_comments FOR ALL TO authenticated USING (manager_id = auth.uid());
CREATE POLICY "Admins can view all manager comments" ON manager_comments FOR SELECT TO authenticated USING (get_my_role() = 'admin');

ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own approvals" ON approvals FOR SELECT TO authenticated USING (profile_id = auth.uid());
CREATE POLICY "Managers can manage team approvals" ON approvals FOR ALL TO authenticated USING (manager_id = auth.uid());
CREATE POLICY "Admins can view all approvals" ON approvals FOR SELECT TO authenticated USING (get_my_role() = 'admin');

ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own escalations" ON escalations FOR SELECT TO authenticated USING (target_user_id = auth.uid() OR escalated_to_id = auth.uid());
CREATE POLICY "Admins can manage escalations" ON escalations FOR ALL TO authenticated USING (get_my_role() = 'admin');

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view all audit logs" ON audit_logs FOR SELECT TO authenticated USING (get_my_role() = 'admin');
-- Only service role (bypassing RLS) should write to audit_logs

ALTER TABLE escalation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage escalation rules" ON escalation_rules FOR ALL TO authenticated USING (get_my_role() = 'admin');

-- 6. Postgres Analytics Functions

CREATE OR REPLACE FUNCTION calculate_progress_score(p_uom uom_type, p_target numeric, p_achieve numeric)
RETURNS numeric AS $$
BEGIN
    IF p_achieve IS NULL THEN RETURN 0; END IF;

    IF p_uom = 'zero_based' THEN
        IF p_achieve = 0 THEN RETURN 1; ELSE RETURN 0; END IF;
    END IF;

    IF p_uom = 'timeline' THEN
        -- Handled differently via UI, but fallback here
        RETURN 0; 
    END IF;

    IF p_uom IN ('numeric_min', 'percentage_min') THEN
        IF p_target = 0 THEN RETURN 0; END IF;
        RETURN LEAST(GREATEST(p_achieve / p_target, 0), 1);
    END IF;

    IF p_uom IN ('numeric_max', 'percentage_max') THEN
        IF p_achieve = 0 THEN RETURN 1; END IF;
        RETURN LEAST(GREATEST(p_target / p_achieve, 0), 1);
    END IF;

    RETURN 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_team_achievement_trend(p_manager_id uuid, p_cycle_id uuid)
RETURNS TABLE (quarter quarter_type, avg_score numeric, count integer) AS $$
BEGIN
    RETURN QUERY
    SELECT qc.quarter, COALESCE(AVG(calculate_progress_score(g.uom_type, g.target, qc.achievement)), 0) as avg_score, CAST(COUNT(*) as integer) as count
    FROM quarterly_checkins qc
    JOIN goals g ON g.id = qc.goal_id
    JOIN profiles p ON p.id = g.profile_id
    WHERE p.manager_id = p_manager_id AND g.cycle_id = p_cycle_id
    GROUP BY qc.quarter
    ORDER BY qc.quarter;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_completion_heatmap(p_cycle_id uuid)
RETURNS TABLE (department text, quarter quarter_type, completion_rate numeric) AS $$
BEGIN
    RETURN QUERY
    SELECT d.name as department, qc.quarter, COALESCE(AVG(calculate_progress_score(g.uom_type, g.target, qc.achievement)), 0) as completion_rate
    FROM departments d
    JOIN profiles p ON p.department_id = d.id
    JOIN goals g ON g.profile_id = p.id
    JOIN quarterly_checkins qc ON qc.goal_id = g.id
    WHERE g.cycle_id = p_cycle_id
    GROUP BY d.name, qc.quarter;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_goal_distribution(p_department_id uuid, p_cycle_id uuid)
RETURNS TABLE (thrust_area text, count integer, percentage numeric) AS $$
DECLARE
    total_goals integer;
BEGIN
    SELECT COUNT(*) INTO total_goals 
    FROM goals g 
    JOIN profiles p ON g.profile_id = p.id 
    WHERE (p_department_id IS NULL OR p.department_id = p_department_id) AND g.cycle_id = p_cycle_id;

    RETURN QUERY
    SELECT ta.name as thrust_area, CAST(COUNT(*) as integer) as count, CAST(COUNT(*) * 100.0 / NULLIF(total_goals, 0) as numeric) as percentage
    FROM thrust_areas ta
    JOIN goals g ON g.thrust_area_id = ta.id
    JOIN profiles p ON g.profile_id = p.id
    WHERE (p_department_id IS NULL OR p.department_id = p_department_id) AND g.cycle_id = p_cycle_id
    GROUP BY ta.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_manager_effectiveness(p_cycle_id uuid)
RETURNS TABLE (manager_id uuid, first_name text, last_name text, check_in_completion_rate numeric, avg_team_score numeric) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as manager_id, m.first_name, m.last_name,
        CAST(COUNT(qc.id) * 100.0 / NULLIF(COUNT(g.id) * 4, 0) as numeric) as check_in_completion_rate, -- Simplification assuming 4 quarters
        COALESCE(AVG(calculate_progress_score(g.uom_type, g.target, qc.achievement)), 0) as avg_team_score
    FROM profiles m
    JOIN profiles e ON e.manager_id = m.id
    JOIN goals g ON g.profile_id = e.id
    LEFT JOIN quarterly_checkins qc ON qc.goal_id = g.id AND g.cycle_id = p_cycle_id
    WHERE m.role IN ('manager', 'admin') AND g.cycle_id = p_cycle_id
    GROUP BY m.id, m.first_name, m.last_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Triggers

-- Trigger 1: Auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'first_name', ''), 
    COALESCE(new.raw_user_meta_data->>'last_name', '')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger 2: Auto-insert into audit_log if a locked goal is updated
CREATE OR REPLACE FUNCTION public.log_locked_goal_changes()
RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'locked' AND (
      OLD.target IS DISTINCT FROM NEW.target OR
      OLD.target_date IS DISTINCT FROM NEW.target_date OR
      OLD.weightage IS DISTINCT FROM NEW.weightage OR
      OLD.title IS DISTINCT FROM NEW.title
  ) THEN
    INSERT INTO audit_logs (profile_id, goal_id, action, previous_state, new_state, reason)
    VALUES (
      NEW.profile_id,
      NEW.id,
      'locked_goal_updated',
      row_to_json(OLD),
      row_to_json(NEW),
      'System: Goal updated after being locked'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_goal_change_after_lock
  AFTER UPDATE ON goals
  FOR EACH ROW EXECUTE PROCEDURE public.log_locked_goal_changes();
