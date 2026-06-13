"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { generateWeeklyReview, type CoachContext } from "@/services/ai-coach";
import type { ActionResult, AiReport } from "@/types";

export async function generateReport(): Promise<ActionResult<AiReport>> {
  const { user, supabase } = await requireUser();

  const [goalRes, weightRes, nutritionRes, workoutRes, habitsRes] =
    await Promise.all([
      supabase.from("goals").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("weight_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: true })
        .limit(60),
      supabase
        .from("nutrition_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(120),
      supabase
        .from("workouts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("habits")
        .select("*, habit_logs(*)")
        .eq("user_id", user.id),
    ]);

  const ctx: CoachContext = {
    goal: goalRes.data ?? null,
    weightLogs: weightRes.data ?? [],
    nutritionLogs: nutritionRes.data ?? [],
    workouts: workoutRes.data ?? [],
    habits: (habitsRes.data as CoachContext["habits"]) ?? [],
  };

  const report = await generateWeeklyReview(ctx);

  const { data, error } = await supabase
    .from("ai_reports")
    .insert({ user_id: user.id, report })
    .select()
    .single();
  if (error) return { success: false, error: error.message };

  revalidatePath("/coach");
  return { success: true, data: data as AiReport };
}
