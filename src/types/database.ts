// Generated-style database type map. In a real project run:
//   supabase gen types typescript --project-id <ref> > src/types/database.ts
// This hand-maintained version mirrors database/migrations.

export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type PhotoType = "front" | "side" | "back";

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  height_cm: number | null;
  date_of_birth: string | null;
  gender: Gender | null;
  activity_level: ActivityLevel | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  starting_weight: number;
  current_weight: number;
  goal_weight: number;
  weekly_target: number;
  target_calories: number;
  target_protein: number;
  created_at: string;
  updated_at: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight: number;
  waist_cm: number | null;
  notes: string | null;
  logged_at: string;
}

export interface NutritionLog {
  id: string;
  user_id: string;
  meal_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  logged_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  workout_name: string;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
}

export interface ExerciseLog {
  id: string;
  workout_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface WorkoutWithExercises extends Workout {
  exercise_logs: ExerciseLog[];
}

export interface Habit {
  id: string;
  user_id: string;
  habit_name: string;
  target: number;
  unit: string | null;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  value: number;
  logged_at: string;
}

export interface HabitWithLogs extends Habit {
  habit_logs: HabitLog[];
}

export interface ProgressPhoto {
  id: string;
  user_id: string;
  image_url: string;
  storage_path: string | null;
  photo_type: PhotoType;
  uploaded_at: string;
}

export interface AiReport {
  id: string;
  user_id: string;
  report: string;
  created_at: string;
}
