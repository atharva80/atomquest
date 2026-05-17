/**
 * Application Constants
 *
 * Defines system-wide constants, magic numbers, validation bounds,
 * and UI mappings used throughout the application.
 */

import { GoalStatus, ProgressStatus, UomType, QuarterType } from '@/types';
import { 
  LayoutDashboard, 
  Target, 
  ClipboardCheck, 
  Users, 
  GitPullRequest, 
  CalendarRange, 
  AlertTriangle, 
  ShieldAlert, 
  Network 
} from 'lucide-react';

export const VALIDATION = {
  MAX_GOALS_PER_EMPLOYEE: 8,
  MIN_WEIGHTAGE_PER_GOAL: 10,
  TOTAL_WEIGHTAGE: 100,
} as const;

export const QUARTER_MONTHS: Record<QuarterType, string> = {
  Q1: 'Jul-Sep',
  Q2: 'Oct-Dec',
  Q3: 'Jan-Mar',
  Q4: 'Apr-Jun',
};

// Next.js note: You can pass icon components like this in Client/Server components
// as long as they aren't serialized in server actions. 
export const NAV_ITEMS = {
  employee: [
    { title: 'Dashboard', href: '/employee', icon: 'dashboard' },
    { title: 'My Goals', href: '/employee/goals', icon: 'target' },
    { title: 'Check-ins', href: '/employee/check-ins', icon: 'fact_check' },
  ],
  manager: [
    { title: 'Dashboard', href: '/manager', icon: 'dashboard' },
    { title: 'My Team', href: '/manager/team', icon: 'groups' },
    { title: 'Approvals', href: '/manager/approvals', icon: 'rule' },
    { title: 'Team Check-ins', href: '/manager/check-ins', icon: 'fact_check' },
  ],
  admin: [
    { title: 'Dashboard', href: '/admin', icon: 'dashboard' },
    { title: 'Users & Roles', href: '/admin/users', icon: 'manage_accounts' },
    { title: 'Cycles & Quarters', href: '/admin/cycles', icon: 'autorenew' },
    { title: 'Escalations', href: '/admin/escalations', icon: 'error' },
    { title: 'Audit Trail', href: '/admin/audit', icon: 'history' },
    { title: 'Shared Goals', href: '/admin/shared-goals', icon: 'account_tree' },
  ],
} as const;

export const STATUS_COLORS: Record<GoalStatus | ProgressStatus, string> = {
  [GoalStatus.DRAFT]: 'bg-slate-100 text-slate-700 border-slate-200',
  [GoalStatus.SUBMITTED]: 'bg-blue-50 text-blue-700 border-blue-200',
  [GoalStatus.APPROVED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [GoalStatus.RETURNED]: 'bg-amber-50 text-amber-700 border-amber-200',
  [GoalStatus.LOCKED]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  
  [ProgressStatus.NOT_STARTED]: 'bg-slate-100 text-slate-700 border-slate-200',
  [ProgressStatus.ON_TRACK]: 'bg-blue-50 text-blue-700 border-blue-200',
  [ProgressStatus.COMPLETED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export const UOM_TYPES = [
  {
    value: UomType.NUMERIC_MIN,
    label: 'Numeric (Minimum)',
    description: 'Higher achievement is better (e.g. Revenue, Sales)',
  },
  {
    value: UomType.NUMERIC_MAX,
    label: 'Numeric (Maximum)',
    description: 'Lower achievement is better (e.g. Defects, Expenses)',
  },
  {
    value: UomType.PERCENTAGE_MIN,
    label: 'Percentage (Minimum)',
    description: 'Higher % is better (e.g. Profit Margin)',
  },
  {
    value: UomType.PERCENTAGE_MAX,
    label: 'Percentage (Maximum)',
    description: 'Lower % is better (e.g. Churn Rate)',
  },
  {
    value: UomType.TIMELINE,
    label: 'Timeline',
    description: 'Target is a date; completion on/before date is success',
  },
  {
    value: UomType.ZERO_BASED,
    label: 'Zero-Based',
    description: 'Goal is exactly 0 (e.g. Zero Safety Incidents)',
  },
] as const;
