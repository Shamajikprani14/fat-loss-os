"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { nutritionSchema } from "@/lib/validations";
import type { ActionResult, NutritionLog } from "@/types";

export async function addMeal(
  formData: FormData,
): Promise<ActionResult<NutritionLog>> {
  const parsed = nutritionSchema.safeParse({
    meal_name: formData.get("meal_name"),
    calories: formData.get("calories"),
    protein: formData.get("protein"),
    carbs: formData.get("carbs"),
    fat: formData.get("fat"),
    logged_at: formData.get("logged_at") || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const { user, supabase } = await requireUser();
  const { data, error } = await supabase
    .from("nutrition_logs")
    .insert({
      user_id: user.id,
      ...parsed.data,
      logged_at: parsed.data.logged_at ?? new Date().toISOString(),
    })
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  revalidatePath("/nutrition");
  revalidatePath("/dashboard");
  return { success: true, data: data as NutritionLog };
}

export async function updateMeal(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = nutritionSchema.safeParse({
    meal_name: formData.get("meal_name"),
    calories: formData.get("calories"),
    protein: formData.get("protein"),
    carbs: formData.get("carbs"),
    fat: formData.get("fat"),
    logged_at: formData.get("logged_at") || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const { user, supabase } = await requireUser();
  const { error } = await supabase
    .from("nutrition_logs")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/nutrition");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteMeal(id: string): Promise<ActionResult> {
  const { user, supabase } = await requireUser();
  const { error } = await supabase
    .from("nutrition_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/nutrition");
  revalidatePath("/dashboard");
  return { success: true };
}
