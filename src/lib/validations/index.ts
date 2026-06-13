import { z } from "zod";

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
export const profileSchema = z.object({
  name: z.string().min(2).max(80),
  date_of_birth: z.string().optional().nullable(),
  gender: z
    .enum(["male", "female", "other", "prefer_not_to_say"])
    .optional()
    .nullable(),
  height_cm: z.coerce.number().min(50).max(260).optional().nullable(),
  activity_level: z
    .enum(["sedentary", "light", "moderate", "active", "very_active"])
    .optional()
    .nullable(),
});
export type ProfileInput = z.infer<typeof profileSchema>;

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------
export const goalSchema = z.object({
  starting_weight: z.coerce.number().min(20).max(500),
  current_weight: z.coerce.number().min(20).max(500),
  goal_weight: z.coerce.number().min(20).max(500),
  weekly_target: z.coerce.number().min(0).max(2),
  target_calories: z.coerce.number().int().min(1000).max(6000),
  target_protein: z.coerce.number().int().min(0).max(500),
});
export type GoalInput = z.infer<typeof goalSchema>;

// ---------------------------------------------------------------------------
// Weight
// ---------------------------------------------------------------------------
export const weightSchema = z.object({
  weight: z.coerce.number().min(20).max(500),
  waist_cm: z.coerce.number().min(30).max(250).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  logged_at: z.string().optional(),
});
export type WeightInput = z.infer<typeof weightSchema>;

// ---------------------------------------------------------------------------
// Nutrition
// ---------------------------------------------------------------------------
export const nutritionSchema = z.object({
  meal_name: z.string().min(1, "Meal name is required").max(120),
  calories: z.coerce.number().int().min(0).max(10000),
  protein: z.coerce.number().min(0).max(1000),
  carbs: z.coerce.number().min(0).max(1000),
  fat: z.coerce.number().min(0).max(1000),
  logged_at: z.string().optional(),
});
export type NutritionInput = z.infer<typeof nutritionSchema>;

// ---------------------------------------------------------------------------
// Workout + exercises
// ---------------------------------------------------------------------------
export const exerciseSchema = z.object({
  exercise_name: z.string().min(1, "Exercise name is required").max(120),
  sets: z.coerce.number().int().min(0).max(100),
  reps: z.coerce.number().int().min(0).max(1000),
  weight: z.coerce.number().min(0).max(1000),
});

export const workoutSchema = z.object({
  workout_name: z.string().min(1, "Workout name is required").max(120),
  duration_minutes: z.coerce.number().int().min(0).max(600).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  exercises: z.array(exerciseSchema).min(1, "Add at least one exercise"),
});
export type WorkoutInput = z.infer<typeof workoutSchema>;
export type ExerciseInput = z.infer<typeof exerciseSchema>;

// ---------------------------------------------------------------------------
// Habits
// ---------------------------------------------------------------------------
export const habitSchema = z.object({
  habit_name: z.string().min(1, "Habit name is required").max(80),
  target: z.coerce.number().min(0).max(100000),
  unit: z.string().max(40).optional().nullable(),
});
export type HabitInput = z.infer<typeof habitSchema>;

export const habitLogSchema = z.object({
  habit_id: z.string().uuid(),
  value: z.coerce.number().min(0).max(100000),
  logged_at: z.string().optional(),
});
export type HabitLogInput = z.infer<typeof habitLogSchema>;

// ---------------------------------------------------------------------------
// Progress photos
// ---------------------------------------------------------------------------
export const photoTypeSchema = z.enum(["front", "side", "back"]);
