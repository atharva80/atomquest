-- ============================================
-- AtomQuest — Seed Data
-- ============================================
-- This seed script populates the database with realistic demo data
-- that tells a "mid-flight quarterly review cycle" story.

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Departments
INSERT INTO public.departments (id, name) VALUES
    ('d1111111-1111-1111-1111-111111111111', 'Engineering'),
    ('d2222222-2222-2222-2222-222222222222', 'Sales'),
    ('d3333333-3333-3333-3333-333333333333', 'Marketing'),
    ('d4444444-4444-4444-4444-444444444444', 'HR'),
    ('d5555555-5555-5555-5555-555555555555', 'Operations');

-- 2. Thrust Areas
INSERT INTO public.thrust_areas (id, name, description) VALUES
    ('c1111111-1111-1111-1111-111111111111', 'Revenue Growth', 'Initiatives driving top-line revenue'),
    ('c2222222-2222-2222-2222-222222222222', 'Customer Satisfaction', 'Improving NPS, CSAT and support metrics'),
    ('c3333333-3333-3333-3333-333333333333', 'Operational Excellence', 'Process improvements, defect reduction, speed'),
    ('c4444444-4444-4444-4444-444444444444', 'People Development', 'Training, retention, hiring goals'),
    ('c5555555-5555-5555-5555-555555555555', 'Innovation', 'New products, R&D, patent filings'),
    ('c6666666-6666-6666-6666-666666666666', 'Cost Optimization', 'Reducing overhead, optimizing infrastructure costs');

-- 3. Active Cycle (FY 2025-26) - Assumes current date is in Q2 (Nov 2025)
INSERT INTO public.cycles (
    id, name, is_active, 
    start_date, end_date, goal_setting_deadline,
    q1_start, q1_end,
    q2_start, q2_end,
    q3_start, q3_end,
    q4_start, q4_end
) VALUES (
    'c1111111-1111-1111-1111-111111111111', 
    'FY 2025-26', 
    true, 
    '2025-04-01 00:00:00+00', '2026-03-31 23:59:59+00', '2025-04-30 23:59:59+00',
    '2025-04-01 00:00:00+00', '2025-06-30 23:59:59+00',
    '2025-07-01 00:00:00+00', '2025-09-30 23:59:59+00',
    '2025-10-01 00:00:00+00', '2025-12-31 23:59:59+00',
    '2026-01-01 00:00:00+00', '2026-03-31 23:59:59+00'
);

-- 4. Escalation Rules
INSERT INTO public.escalation_rules (type, days_threshold, is_active) VALUES
    ('goal_not_submitted', 10, true),
    ('goal_not_approved', 5, true),
    ('checkin_not_completed', 7, true);


-- ============================================
-- USER CREATION HELPER
-- ============================================
-- We insert directly into auth.users (which triggers profile creation)
-- Then we'll update the auto-created profiles with relationships

DO $$
DECLARE
    -- Admins
    admin1_id uuid := 'a1111111-1111-1111-1111-111111111111';
    admin2_id uuid := 'a2222222-2222-2222-2222-222222222222';
    -- Managers
    mgr_eng_id uuid := 'b1111111-1111-1111-1111-111111111111';
    mgr_sales_id uuid := 'b2222222-2222-2222-2222-222222222222';
    mgr_mktg_id uuid := 'b3333333-3333-3333-3333-333333333333';
    -- Employees
    emp_eng1_id uuid := 'e1111111-1111-1111-1111-111111111111';
    emp_eng2_id uuid := 'e1111112-1111-1111-1111-111111111111';
    emp_eng3_id uuid := 'e1111113-1111-1111-1111-111111111111';
    emp_sales1_id uuid := 'e2222221-2222-2222-2222-222222222222';
    emp_sales2_id uuid := 'e2222222-2222-2222-2222-222222222222';
    emp_mktg1_id uuid := 'e3333331-3333-3333-3333-333333333333';
    emp_ops1_id uuid := 'e4444441-4444-4444-4444-444444444444';

    v_goal1_id uuid;
    v_goal2_id uuid;
    v_goal3_id uuid;
    v_goal4_id uuid;
    v_goal_sales1_id uuid;
    v_goal_sales2_id uuid;

BEGIN

    -- 1. Create Auth Users
    -- (The trigger on_auth_user_created will auto-insert into profiles)
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data) VALUES
        (admin1_id, '00000000-0000-0000-0000-000000000000', 'admin@atomberg.com', crypt('password123', gen_salt('bf')), now(), '{"first_name": "Sarah", "last_name": "Connor"}'),
        (admin2_id, '00000000-0000-0000-0000-000000000000', 'hr.head@atomberg.com', crypt('password123', gen_salt('bf')), now(), '{"first_name": "Toby", "last_name": "Flenderson"}'),
        
        (mgr_eng_id, '00000000-0000-0000-0000-000000000000', 'eng.lead@atomberg.com', crypt('password123', gen_salt('bf')), now(), '{"first_name": "Michael", "last_name": "Scott"}'),
        (mgr_sales_id, '00000000-0000-0000-0000-000000000000', 'sales.lead@atomberg.com', crypt('password123', gen_salt('bf')), now(), '{"first_name": "Jim", "last_name": "Halpert"}'),
        (mgr_mktg_id, '00000000-0000-0000-0000-000000000000', 'mktg.lead@atomberg.com', crypt('password123', gen_salt('bf')), now(), '{"first_name": "Kelly", "last_name": "Kapoor"}'),
        
        (emp_eng1_id, '00000000-0000-0000-0000-000000000000', 'dev1@atomberg.com', crypt('password123', gen_salt('bf')), now(), '{"first_name": "Dwight", "last_name": "Schrute"}'),
        (emp_eng2_id, '00000000-0000-0000-0000-000000000000', 'dev2@atomberg.com', crypt('password123', gen_salt('bf')), now(), '{"first_name": "Angela", "last_name": "Martin"}'),
        (emp_eng3_id, '00000000-0000-0000-0000-000000000000', 'dev3@atomberg.com', crypt('password123', gen_salt('bf')), now(), '{"first_name": "Kevin", "last_name": "Malone"}'),
        
        (emp_sales1_id, '00000000-0000-0000-0000-000000000000', 'sales1@atomberg.com', crypt('password123', gen_salt('bf')), now(), '{"first_name": "Stanley", "last_name": "Hudson"}'),
        (emp_sales2_id, '00000000-0000-0000-0000-000000000000', 'sales2@atomberg.com', crypt('password123', gen_salt('bf')), now(), '{"first_name": "Phyllis", "last_name": "Vance"}'),
        
        (emp_mktg1_id, '00000000-0000-0000-0000-000000000000', 'mktg1@atomberg.com', crypt('password123', gen_salt('bf')), now(), '{"first_name": "Ryan", "last_name": "Howard"}'),
        (emp_ops1_id, '00000000-0000-0000-0000-000000000000', 'ops1@atomberg.com', crypt('password123', gen_salt('bf')), now(), '{"first_name": "Creed", "last_name": "Bratton"}');

    -- 2. Update Profiles (Set roles, departments, managers)
    UPDATE public.profiles SET role = 'admin', employee_code = 'ADM001' WHERE id = admin1_id;
    UPDATE public.profiles SET role = 'admin', department_id = 'd4444444-4444-4444-4444-444444444444', employee_code = 'HR001' WHERE id = admin2_id;
    
    UPDATE public.profiles SET role = 'manager', department_id = 'd1111111-1111-1111-1111-111111111111', employee_code = 'ENG001' WHERE id = mgr_eng_id;
    UPDATE public.profiles SET role = 'manager', department_id = 'd2222222-2222-2222-2222-222222222222', employee_code = 'SAL001' WHERE id = mgr_sales_id;
    UPDATE public.profiles SET role = 'manager', department_id = 'd3333333-3333-3333-3333-333333333333', employee_code = 'MKT001' WHERE id = mgr_mktg_id;
    
    UPDATE public.profiles SET role = 'employee', department_id = 'd1111111-1111-1111-1111-111111111111', manager_id = mgr_eng_id, employee_code = 'ENG002' WHERE id = emp_eng1_id;
    UPDATE public.profiles SET role = 'employee', department_id = 'd1111111-1111-1111-1111-111111111111', manager_id = mgr_eng_id, employee_code = 'ENG003' WHERE id = emp_eng2_id;
    UPDATE public.profiles SET role = 'employee', department_id = 'd1111111-1111-1111-1111-111111111111', manager_id = mgr_eng_id, employee_code = 'ENG004' WHERE id = emp_eng3_id;
    
    UPDATE public.profiles SET role = 'employee', department_id = 'd2222222-2222-2222-2222-222222222222', manager_id = mgr_sales_id, employee_code = 'SAL002' WHERE id = emp_sales1_id;
    UPDATE public.profiles SET role = 'employee', department_id = 'd2222222-2222-2222-2222-222222222222', manager_id = mgr_sales_id, employee_code = 'SAL003' WHERE id = emp_sales2_id;
    
    UPDATE public.profiles SET role = 'employee', department_id = 'd3333333-3333-3333-3333-333333333333', manager_id = mgr_mktg_id, employee_code = 'MKT002' WHERE id = emp_mktg1_id;
    UPDATE public.profiles SET role = 'employee', department_id = 'd5555555-5555-5555-5555-555555555555', manager_id = admin1_id, employee_code = 'OPS001' WHERE id = emp_ops1_id; -- Reports to super admin for demo

    -- 3. Goals & Checkins for Employee 1 (Dwight - Engineering)
    INSERT INTO public.goals (id, profile_id, cycle_id, thrust_area_id, title, description, uom_type, target, weightage, status)
    VALUES 
        (uuid_generate_v4(), emp_eng1_id, 'c1111111-1111-1111-1111-111111111111', 'c5555555-5555-5555-5555-555555555555', 'Deliver v2.0 Architecture', 'Complete rewrite of core services', 'timeline', null, 30, 'locked') RETURNING id INTO v_goal1_id;
    UPDATE public.goals SET target_date = '2025-10-15 00:00:00+00' WHERE id = v_goal1_id;
    
    INSERT INTO public.goals (id, profile_id, cycle_id, thrust_area_id, title, description, uom_type, target, weightage, status)
    VALUES 
        (uuid_generate_v4(), emp_eng1_id, 'c1111111-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333', 'Reduce Production Bugs', 'P0 and P1 bug counts per month', 'numeric_max', 5, 20, 'locked') RETURNING id INTO v_goal2_id;

    INSERT INTO public.goals (id, profile_id, cycle_id, thrust_area_id, title, description, uom_type, target, weightage, status)
    VALUES 
        (uuid_generate_v4(), emp_eng1_id, 'c1111111-1111-1111-1111-111111111111', 'c4444444-4444-4444-4444-444444444444', 'Mentorship', 'Mentor 2 junior devs', 'numeric_min', 2, 20, 'locked') RETURNING id INTO v_goal3_id;

    INSERT INTO public.goals (id, profile_id, cycle_id, thrust_area_id, title, description, uom_type, target, weightage, status)
    VALUES 
        (uuid_generate_v4(), emp_eng1_id, 'c1111111-1111-1111-1111-111111111111', 'c3333333-3333-3333-3333-333333333333', 'Zero Downtime Deployments', 'Maintain 100% uptime during deploys', 'zero_based', 0, 30, 'locked') RETURNING id INTO v_goal4_id;

    -- Dwight Q1 Checkins (Completed)
    INSERT INTO public.quarterly_checkins (goal_id, quarter, achievement, comment, status) VALUES
        (v_goal2_id, 'Q1', 2, 'Only 2 P1 bugs this quarter, well under target.', 'on_track'),
        (v_goal3_id, 'Q1', 1, 'Started mentoring Ryan.', 'on_track'),
        (v_goal4_id, 'Q1', 0, 'No downtime.', 'on_track');
        
    -- Dwight Q1 Manager Comment
    INSERT INTO public.manager_comments (profile_id, manager_id, cycle_id, quarter, comment, rating)
    VALUES (emp_eng1_id, mgr_eng_id, 'c1111111-1111-1111-1111-111111111111', 'Q1', 'Strong start to the year. Architecture is progressing well.', 4);

    -- Dwight Q2 Checkins (Mid-flight)
    INSERT INTO public.quarterly_checkins (goal_id, quarter, achievement, achievement_date, comment, status) VALUES
        (v_goal1_id, 'Q2', null, '2025-10-10 00:00:00+00', 'Delivered v2.0 ahead of Oct 15 deadline.', 'completed'),
        (v_goal2_id, 'Q2', 8, null, 'Had a rough patch during v2 rollout.', 'not_started');


    -- 4. Goals & Checkins for Sales Employee 1 (Stanley)
    INSERT INTO public.goals (id, profile_id, cycle_id, thrust_area_id, title, uom_type, target, weightage, status)
    VALUES 
        (uuid_generate_v4(), emp_sales1_id, 'c1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'Q3 Sales Quota', 'numeric_min', 500000, 50, 'locked') RETURNING id INTO v_goal_sales1_id;
    
    INSERT INTO public.goals (id, profile_id, cycle_id, thrust_area_id, title, uom_type, target, weightage, status)
    VALUES 
        (uuid_generate_v4(), emp_sales1_id, 'c1111111-1111-1111-1111-111111111111', 'c2222222-2222-2222-2222-222222222222', 'Client Retention', 'percentage_max', 5, 50, 'locked') RETURNING id INTO v_goal_sales2_id;

    -- Stanley Q1 Checkin
    INSERT INTO public.quarterly_checkins (goal_id, quarter, achievement, comment, status) VALUES
        (v_goal_sales1_id, 'Q1', 120000, 'On track to hit 500k', 'on_track'),
        (v_goal_sales2_id, 'Q1', 2, 'Lost one minor client', 'on_track');

    -- Stanley Q1 Manager Comment
    INSERT INTO public.manager_comments (profile_id, manager_id, cycle_id, quarter, comment, rating)
    VALUES (emp_sales1_id, mgr_sales_id, 'c1111111-1111-1111-1111-111111111111', 'Q1', 'Steady performance.', 3);
    
    -- NOTE: Stanley has NOT completed Q2 checkins (to trigger escalation)

    -- 5. Shared Goal Example (Sales and Marketing)
    -- Jim (Sales Lead) owns the primary goal, shares it with Kelly (Marketing Lead)
    INSERT INTO public.shared_goals (primary_goal_id, recipient_profile_id)
    VALUES (v_goal_sales1_id, mgr_mktg_id); -- Sharing Stanley's sales quota with Marketing lead as an example of cross-dept linkage

    -- 6. Approvals History for Dwight
    INSERT INTO public.approvals (profile_id, manager_id, cycle_id, action, comment) VALUES
        (emp_eng1_id, mgr_eng_id, 'c1111111-1111-1111-1111-111111111111', 'submitted', null),
        (emp_eng1_id, mgr_eng_id, 'c1111111-1111-1111-1111-111111111111', 'returned', 'Please reduce weightage on mentorship to 20% and increase architecture to 30%.'),
        (emp_eng1_id, mgr_eng_id, 'c1111111-1111-1111-1111-111111111111', 'submitted', null),
        (emp_eng1_id, mgr_eng_id, 'c1111111-1111-1111-1111-111111111111', 'approved', null),
        (emp_eng1_id, mgr_eng_id, 'c1111111-1111-1111-1111-111111111111', 'locked', null);

    -- 7. Escalations
    -- Resolved escalation from Q1
    INSERT INTO public.escalations (target_user_id, escalated_to_id, type, cycle_id, resolved_at, created_at)
    VALUES (emp_eng2_id, mgr_eng_id, 'goal_not_submitted', 'c1111111-1111-1111-1111-111111111111', '2025-05-15 10:00:00+00', '2025-05-10 00:00:00+00');
    
    -- Active escalation for Q2
    INSERT INTO public.escalations (target_user_id, escalated_to_id, type, cycle_id, created_at)
    VALUES (emp_sales1_id, mgr_sales_id, 'checkin_not_completed', 'c1111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 days');

    -- 8. Audit Logs
    INSERT INTO public.audit_logs (profile_id, goal_id, action, previous_state, new_state, reason)
    VALUES (
        admin1_id,
        v_goal2_id,
        'unlocked_goal_sheet',
        null,
        null,
        'Employee requested modification due to scope change in project.'
    );

END $$;
