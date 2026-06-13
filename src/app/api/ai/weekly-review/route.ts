import { NextResponse } from "next/server";
import { getOptionalUser } from "@/lib/auth";
import { generateWeeklyReview, type CoachContext } from "@/services/ai-coach";

export const runtime = "nodejs";

/**
 * POST /api/ai/weekly-review
 * Generates (and persists) a weekly AI review for the authenticated user.
 * Secured: requires a valid session; RLS scopes every query to the caller.
 */
export async function POST() {
  const { user, supabase } = await getOptionalUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
        .limit(120),
      supabase.from("workouts").select("*").eq("user_id", user.id).limit(30),
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ report: data });
}
