"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { workoutSchema } from "@/lib/validations";
import type { ActionResult } from "@/types";

type WorkoutPayload = {
  workout_name: string;
  duration_minutes: number | null;
  notes: string | null;
  exercises: {
    exercise_name: string;
    sets: number;
    reps: number;
    weight: number;
  }[];
};

export async function createWorkout(
  payload: WorkoutPayload,
): Promise<ActionResult<{ id: string }>> {
  const parsed = workoutSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const { user, supabase } = await requireUser();
  const { data: workout, error } = await supabase
    .from("workouts")
    .insert({
      user_id: user.id,
      workout_name: parsed.data.workout_name,
      duration_minutes: parsed.data.duration_minutes,
      notes: parsed.data.notes,
    })
    .select("id")
    .single();
  if (error || !workout) {
    return { success: false, error: error?.message ?? "Failed to create" };
  }

  const { error: exError } = await supabase.from("exercise_logs").insert(
    parsed.data.exercises.map((e) => ({ workout_id: workout.id, ...e })),
  );
  if (exError) return { success: false, error: exError.message };

  revalidatePath("/workouts");
  revalidatePath("/dashboard");
  return { success: true, data: { id: workout.id } };
}

export async function updateWorkout(
  id: string,
  payload: WorkoutPayload,
): Promise<ActionResult> {
  const parsed = workoutSchema.safeParse(payload);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const { user, supabase } = await requireUser();
  const { error } = await supabase
    .from("workouts")
    .update({
      workout_name: parsed.data.workout_name,
      duration_minutes: parsed.data.duration_minutes,
      notes: parsed.data.notes,
    })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { success: false, error: error.message };

  // Replace exercise rows (RLS scopes by parent workout).
  await supabase.from("exercise_logs").delete().eq("workout_id", id);
  const { error: exError } = await supabase.from("exercise_logs").insert(
    parsed.data.exercises.map((e) => ({ workout_id: id, ...e })),
  );
  if (exError) return { success: false, error: exError.message };

  revalidatePath("/workouts");
  return { success: true };
}

export async function deleteWorkout(id: string): Promise<ActionResult> {
  const { user, supabase } = await requireUser();
  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/workouts");
  revalidatePath("/dashboard");
  return { success: true };
}
