import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { UomType, GoalWithCheckins, QuarterType } from "@/types"
import { VALIDATION, QUARTER_MONTHS } from "@/lib/constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates progress score between 0 and 1 based on UoM Type rules.
 * 
 * @param uomType Type of Unit of Measure
 * @param target The target value (can be date string for timeline)
 * @param achievement The achieved value
 * @returns Score between 0.0 and 1.0
 */
export function calculateProgressScore(
  uomType: UomType,
  target: number | string | null,
  achievement: number | string | null
): number {
  if (achievement === null || achievement === undefined) return 0;
  
  if (uomType === UomType.ZERO_BASED) {
    const ach = Number(achievement);
    return ach === 0 ? 1 : 0;
  }
  
  if (uomType === UomType.TIMELINE) {
    if (!target) return 0;
    const targetDate = new Date(target as string);
    const achieveDate = new Date(achievement as string);
    return targetDate >= achieveDate ? 1 : 0;
  }
  
  const targetNum = Number(target);
  const achNum = Number(achievement);
  
  if (uomType === UomType.NUMERIC_MIN || uomType === UomType.PERCENTAGE_MIN) {
    if (targetNum === 0) return 0; // Avoid division by zero
    const score = achNum / targetNum;
    return Math.min(Math.max(score, 0), 1);
  }
  
  if (uomType === UomType.NUMERIC_MAX || uomType === UomType.PERCENTAGE_MAX) {
    if (achNum === 0) return 1; // Cap at 1.0 (avoid Infinity)
    const score = targetNum / achNum;
    return Math.min(Math.max(score, 0), 1);
  }
  
  return 0;
}

/**
 * Returns the weighted score for a goal
 * 
 * @param progressScore Base progress score (0 to 1)
 * @param weightage Goal weightage (0 to 100)
 * @returns Weighted score value
 */
export function getWeightedScore(progressScore: number, weightage: number): number {
  return progressScore * (weightage / 100);
}

/**
 * Calculates overall score across multiple goals
 * 
 * @param goals List of goals with check-ins
 * @returns Total score out of 100
 */
export function getOverallScore(goals: GoalWithCheckins[]): number {
  return goals.reduce((total, goal) => {
    if (!goal.quarterly_checkins || goal.quarterly_checkins.length === 0) return total;
    
    // Get latest checkin chronologically by quarter
    const checkin = [...goal.quarterly_checkins].sort((a, b) => b.quarter.localeCompare(a.quarter))[0];
    
    const progressScore = calculateProgressScore(goal.uom_type, goal.target, checkin.achievement);
    const weightedScore = getWeightedScore(progressScore, goal.weightage);
    
    return total + weightedScore;
  }, 0);
}

/**
 * Validates if the given goals have correct total weightages and min weightages
 * 
 * @param goals Array of goals with weightages
 * @returns Boolean if valid
 */
export function validateWeightage(goals: { weightage: number }[]): boolean {
  if (goals.length > VALIDATION.MAX_GOALS_PER_EMPLOYEE) return false;
  
  let total = 0;
  for (const goal of goals) {
    if (goal.weightage < VALIDATION.MIN_WEIGHTAGE_PER_GOAL) return false;
    total += goal.weightage;
  }
  
  return total === VALIDATION.TOTAL_WEIGHTAGE;
}

/**
 * Formats a quarter and cycle into a human readable range
 * 
 * @param quarter Quarter string (e.g., 'Q1')
 * @param cycleName Cycle string (e.g., 'FY 25-26')
 * @returns Formatted date range string
 */
export function formatQuarterRange(quarter: QuarterType, cycleName: string): string {
  const months = QUARTER_MONTHS[quarter];
  return `${quarter} (${months}) - ${cycleName}`;
}

/**
 * Gets initials from a full name
 * 
 * @param name Full name
 * @returns Initials
 */
export function getInitials(name: string): string {
  if (!name) return "";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
