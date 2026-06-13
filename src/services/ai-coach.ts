import OpenAI from "openai";
import type {
  Goal,
  HabitWithLogs,
  NutritionLog,
  WeightLog,
  Workout,
} from "@/types/database";
import {
  habitStreak,
  monthlyTrendSlope,
  totalWeightLost,
  weeklyAverageCalories,
  weeklyChange,
} from "@/services/calculations";

export interface CoachContext {
  goal: Goal | null;
  weightLogs: WeightLog[];
  nutritionLogs: NutritionLog[];
  workouts: Workout[];
  habits: HabitWithLogs[];
}

export interface CoachAnalysis {
  weightTrend: string;
  workoutConsistency: string;
  habitCompletion: string;
  nutritionAdherence: string;
}

/**
 * Build a deterministic summary of the week. This runs without the LLM and is
 * passed to the model as grounded context — and is also a usable fallback if
 * no API key is configured.
 */
export function buildAnalysis(ctx: CoachContext): CoachAnalysis {
  const { goal, weightLogs, nutritionLogs, workouts, habits } = ctx;

  const change = weeklyChange(weightLogs);
  const slope = monthlyTrendSlope(weightLogs);
  const lost = totalWeightLost(
    goal?.starting_weight ?? null,
    goal?.current_weight ?? null,
  );
  const weightTrend =
    change === null
      ? "Not enough weight data this week to detect a trend."
      : `Weight changed ${change > 0 ? "+" : ""}${change}kg over the last 7 days` +
        `${slope !== null ? ` (≈${slope}kg/week trend)` : ""}` +
        `${lost !== null ? `; ${lost}kg lost since start.` : "."}`;

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyWorkouts = workouts.filter(
    (w) => new Date(w.created_at).getTime() >= weekAgo,
  ).length;
  const workoutConsistency = `${weeklyWorkouts} workout${
    weeklyWorkouts === 1 ? "" : "s"
  } logged in the last 7 days.`;

  const habitSummaries = habits.map((h) => {
    const { current } = habitStreak(h.habit_logs ?? [], Number(h.target));
    return `${h.habit_name}: ${current}-day streak`;
  });
  const habitCompletion =
    habitSummaries.length > 0
      ? habitSummaries.join("; ") + "."
      : "No habits tracked yet.";

  const avgCals = weeklyAverageCalories(nutritionLogs);
  const target = goal?.target_calories ?? null;
  const nutritionAdherence =
    avgCals === 0
      ? "No meals logged this week."
      : `Averaging ${avgCals} kcal/day` +
        (target ? ` vs a ${target} kcal target.` : ".");

  return { weightTrend, workoutConsistency, habitCompletion, nutritionAdherence };
}

const SYSTEM_PROMPT = `You are an evidence-based fat loss coach. You are encouraging but direct.
You analyze a weekly summary of the user's weight, workouts, habits, and nutrition.
Respond in concise markdown with these sections:
## This Week
## What's Working
## What To Improve
## Your 3 Focus Areas for Next Week
Keep it under 350 words. Never give medical advice; suggest consulting a professional for medical concerns.`;

/**
 * Generate a weekly review. Falls back to a deterministic report when no
 * OPENAI_API_KEY is configured so the feature degrades gracefully.
 */
export async function generateWeeklyReview(
  ctx: CoachContext,
): Promise<string> {
  const analysis = buildAnalysis(ctx);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackReport(analysis);
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const userContent = `Weekly summary:
- Weight trend: ${analysis.weightTrend}
- Workout consistency: ${analysis.workoutConsistency}
- Habit completion: ${analysis.habitCompletion}
- Nutrition adherence: ${analysis.nutritionAdherence}

Goal: ${
    ctx.goal
      ? `from ${ctx.goal.starting_weight}kg to ${ctx.goal.goal_weight}kg, ${ctx.goal.weekly_target}kg/week`
      : "not set"
  }.`;

  try {
    const completion = await client.chat.completions.create({
      model,
      temperature: 0.6,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    });
    return (
      completion.choices[0]?.message?.content?.trim() ??
      fallbackReport(analysis)
    );
  } catch {
    return fallbackReport(analysis);
  }
}

function fallbackReport(a: CoachAnalysis): string {
  return `## This Week
- **Weight:** ${a.weightTrend}
- **Workouts:** ${a.workoutConsistency}
- **Habits:** ${a.habitCompletion}
- **Nutrition:** ${a.nutritionAdherence}

## Your 3 Focus Areas for Next Week
1. Keep logging weight at a consistent time (morning, post-bathroom) for cleaner trends.
2. Hit your protein target — it protects muscle in a deficit.
3. Aim for 3+ training sessions and keep your top habit streak alive.

_AI narrative is unavailable (no OPENAI_API_KEY configured); showing a data-driven summary instead._`;
}
