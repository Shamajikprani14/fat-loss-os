"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { weightSchema } from "@/lib/validations";
import type { ActionResult, WeightLog } from "@/types";

export async function addWeightEntry(
  formData: FormData,
): Promise<ActionResult<WeightLog>> {
  const parsed = weightSchema.safeParse({
    weight: formData.get("weight"),
    waist_cm: formData.get("waist_cm") || null,
    notes: formData.get("notes") || null,
    logged_at: formData.get("logged_at") || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const { user, supabase } = await requireUser();
  const { data, error } = await supabase
    .from("weight_logs")
    .insert({
      user_id: user.id,
      weight: parsed.data.weight,
      waist_cm: parsed.data.waist_cm,
      notes: parsed.data.notes,
      logged_at: parsed.data.logged_at ?? new Date().toISOString(),
    })
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  // Keep goals.current_weight in sync with the latest entry.
  await supabase
    .from("goals")
    .update({ current_weight: parsed.data.weight })
    .eq("user_id", user.id);

  revalidatePath("/weight");
  revalidatePath("/dashboard");
  return { success: true, data: data as WeightLog };
}

export async function updateWeightEntry(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = weightSchema.safeParse({
    weight: formData.get("weight"),
    waist_cm: formData.get("waist_cm") || null,
    notes: formData.get("notes") || null,
    logged_at: formData.get("logged_at") || undefined,
  });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message };
  }

  const { user, supabase } = await requireUser();
  const { error } = await supabase
    .from("weight_logs")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id); // ownership guard (defense in depth with RLS)
  if (error) return { success: false, error: error.message };

  revalidatePath("/weight");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteWeightEntry(id: string): Promise<ActionResult> {
  const { user, supabase } = await requireUser();
  const { error } = await supabase
    .from("weight_logs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/weight");
  revalidatePath("/dashboard");
  return { success: true };
}
