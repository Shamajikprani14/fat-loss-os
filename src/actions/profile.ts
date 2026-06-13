"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { goalSchema, profileSchema } from "@/lib/validations";
import type { ActionResult } from "@/types";

export async function updateProfile(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    date_of_birth: formData.get("date_of_birth") || null,
    gender: formData.get("gender") || null,
    height_cm: formData.get("height_cm") || null,
    activity_level: formData.get("activity_level") || null,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const { user, supabase } = await requireUser();
  const { error } = await supabase
    .from("users")
    .update(parsed.data)
    .eq("id", user.id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function upsertGoals(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = goalSchema.safeParse({
    starting_weight: formData.get("starting_weight"),
    current_weight: formData.get("current_weight"),
    goal_weight: formData.get("goal_weight"),
    weekly_target: formData.get("weekly_target"),
    target_calories: formData.get("target_calories"),
    target_protein: formData.get("target_protein"),
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const { user, supabase } = await requireUser();
  const { data: existing } = await supabase
    .from("goals")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("goals").update(parsed.data).eq("id", existing.id)
    : await supabase.from("goals").insert({ user_id: user.id, ...parsed.data });
  if (error) return { success: false, error: error.message };

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true };
}
