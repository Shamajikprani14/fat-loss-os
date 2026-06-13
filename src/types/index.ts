export * from "./database";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DashboardStats {
  currentWeight: number | null;
  goalWeight: number | null;
  startingWeight: number | null;
  totalWeightLost: number | null;
  weeklyChange: number | null;
  caloriesRemaining: number | null;
  proteinRemaining: number | null;
  targetCalories: number | null;
  targetProtein: number | null;
  caloriesConsumed: number;
  proteinConsumed: number;
}

export interface WeightTrendPoint {
  date: string;
  weight: number;
}

export interface WeeklyAveragePoint {
  week: string;
  average: number;
}

export interface PersonalRecord {
  exercise_name: string;
  weight: number;
  reps: number;
  achieved_at: string;
}

export interface HabitStreak {
  habitId: string;
  current: number;
  longest: number;
}
