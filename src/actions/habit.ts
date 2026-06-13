"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { habitSchema } from "@/lib/validations";
import type { ActionResult, Habit } from "@/types";

export async function createHabit(
  formData: FormData,
): Promise<ActionResult<Habit>> {
  const parsed = habitSchema.safeParse({
    habit_name: formData.get("habit_name"),
    target: formData.get("target"),
    unit: formData.get("unit") || null,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const { user, supabase } = await requireUser();
  const { data, error } = await supabase
    .from("habits")
    .insert({ user_id: user.id, ...parsed.data })
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  revalidatePath("/habits");
  revalidatePath("/dashboard");
  return { success: true, data: data as Habit };
}

export async function deleteHabit(id: string): Promise<ActionResult> {
  const { user, supabase } = await requireUser();
  const { error } = await supabase
    .from("habits")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/habits");
  return { success: true };
}

/**
 * Log (or upsert) today's value for a habit. Replaces any existing entry for
 * the current day so the streak math stays clean.
 */
export async function logHabit(
  habitId: string,
  value: number,
): Promise<ActionResult> {
  const { user, supabase } = await requireUser();

  // Confirm ownership of the parent habit.
  const { data: habit } = await supabase
    .from("habits")
    .select("id")
    .eq("id", habitId)
    .eq("user_id", user.id)
    .single();
  if (!habit) return { success: false, error: "Habit not found" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  await supabase
    .from("habit_logs")
    .delete()
    .eq("habit_id", habitId)
    .gte("logged_at", today.toISOString())
    .lt("logged_at", tomorrow.toISOString());

  const { error } = await supabase
    .from("habit_logs")
    .insert({ habit_id: habitId, value, logged_at: new Date().toISOString() });
  if (error) return { success: false, error: error.message };

  revalidatePath("/habits");
  revalidatePath("/dashboard");
  return { success: true };
}
