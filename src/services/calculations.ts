import type {
  ActivityLevel,
  Gender,
  HabitLog,
  NutritionLog,
  WeightLog,
} from "@/types/database";
import type {
  PersonalRecord,
  WeeklyAveragePoint,
  WeightTrendPoint,
} from "@/types";
import { ACTIVITY_LEVELS } from "@/lib/constants";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

/** Mifflin-St Jeor BMR. */
export function calculateBMR(params: {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender | null;
}): number {
  const { weightKg, heightCm, age, gender } = params;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === "female") return Math.round(base - 161);
  // Default to male offset for male/other/unknown.
  return Math.round(base + 5);
}

export function calculateTDEE(bmr: number, level: ActivityLevel | null): number {
  const factor =
    ACTIVITY_LEVELS.find((l) => l.value === level)?.factor ?? 1.55;
  return Math.round(bmr * factor);
}

export function ageFromDOB(dob: string | null): number {
  if (!dob) return 30;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.max(0, Math.floor(diff / (365.25 * DAY_MS)));
}

/**
 * Recommended daily calories for a target weekly loss.
 * 1 kg of fat ≈ 7700 kcal.
 */
export function recommendedCalories(
  tdee: number,
  weeklyTargetKg: number,
): number {
  const dailyDeficit = (weeklyTargetKg * 7700) / 7;
  return Math.max(1200, Math.round(tdee - dailyDeficit));
}

/** Sorted ascending by date. */
function sortByLoggedAt(logs: WeightLog[]): WeightLog[] {
  return [...logs].sort(
    (a, b) =>
      new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime(),
  );
}

export function toWeightTrend(logs: WeightLog[]): WeightTrendPoint[] {
  return sortByLoggedAt(logs).map((l) => ({
    date: l.logged_at,
    weight: Number(l.weight),
  }));
}

/** Average weight per ISO week, oldest first. */
export function weeklyAverages(logs: WeightLog[]): WeeklyAveragePoint[] {
  const buckets = new Map<string, { sum: number; count: number; ts: number }>();
  for (const log of logs) {
    const d = new Date(log.logged_at);
    const monday = new Date(d);
    const day = (d.getDay() + 6) % 7; // 0 = Monday
    monday.setDate(d.getDate() - day);
    monday.setHours(0, 0, 0, 0);
    const key = monday.toISOString().slice(0, 10);
    const cur = buckets.get(key) ?? { sum: 0, count: 0, ts: monday.getTime() };
    cur.sum += Number(log.weight);
    cur.count += 1;
    buckets.set(key, cur);
  }
  return [...buckets.entries()]
    .map(([week, v]) => ({
      week,
      average: Math.round((v.sum / v.count) * 10) / 10,
      _ts: v.ts,
    }))
    .sort((a, b) => a._ts - b._ts)
    .map(({ week, average }) => ({ week, average }));
}

/** Change over the trailing 7 days (negative = loss). */
export function weeklyChange(logs: WeightLog[]): number | null {
  const sorted = sortByLoggedAt(logs);
  if (sorted.length < 2) return null;
  const latest = sorted[sorted.length - 1]!;
  const latestTs = new Date(latest.logged_at).getTime();
  // Find the entry closest to 7 days before latest.
  let baseline = sorted[0]!;
  for (const log of sorted) {
    if (new Date(log.logged_at).getTime() <= latestTs - WEEK_MS) {
      baseline = log;
    }
  }
  return (
    Math.round((Number(latest.weight) - Number(baseline.weight)) * 10) / 10
  );
}

/** Simple linear-regression slope in kg/week over the available range. */
export function monthlyTrendSlope(logs: WeightLog[]): number | null {
  const sorted = sortByLoggedAt(logs);
  if (sorted.length < 2) return null;
  const t0 = new Date(sorted[0]!.logged_at).getTime();
  const xs = sorted.map((l) => (new Date(l.logged_at).getTime() - t0) / WEEK_MS);
  const ys = sorted.map((l) => Number(l.weight));
  const n = xs.length;
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i]!, 0);
  const sumX2 = xs.reduce((a, x) => a + x * x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;
  const slope = (n * sumXY - sumX * sumY) / denom;
  return Math.round(slope * 100) / 100;
}

export function totalWeightLost(
  startingWeight: number | null,
  currentWeight: number | null,
): number | null {
  if (startingWeight === null || currentWeight === null) return null;
  return Math.round((startingWeight - currentWeight) * 10) / 10;
}

/** Sum today's nutrition logs. */
export function sumNutrition(logs: NutritionLog[]) {
  return logs.reduce(
    (acc, l) => ({
      calories: acc.calories + Number(l.calories),
      protein: acc.protein + Number(l.protein),
      carbs: acc.carbs + Number(l.carbs),
      fat: acc.fat + Number(l.fat),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function weeklyAverageCalories(logs: NutritionLog[]): number {
  const byDay = new Map<string, number>();
  const cutoff = Date.now() - WEEK_MS;
  for (const l of logs) {
    const ts = new Date(l.logged_at).getTime();
    if (ts < cutoff) continue;
    const key = l.logged_at.slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + Number(l.calories));
  }
  if (byDay.size === 0) return 0;
  const total = [...byDay.values()].reduce((a, b) => a + b, 0);
  return Math.round(total / byDay.size);
}

/**
 * Habit streak: count consecutive days (ending today) where logged value
 * met or exceeded target.
 */
export function habitStreak(
  logs: HabitLog[],
  target: number,
): { current: number; longest: number } {
  const metDays = new Set<string>();
  const perDay = new Map<string, number>();
  for (const l of logs) {
    const key = l.logged_at.slice(0, 10);
    perDay.set(key, (perDay.get(key) ?? 0) + Number(l.value));
  }
  for (const [day, value] of perDay) {
    if (value >= target) metDays.add(day);
  }

  // current streak
  let current = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  // Allow streak to "start" from yesterday if today not logged yet.
  if (!metDays.has(cursor.toISOString().slice(0, 10))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (metDays.has(cursor.toISOString().slice(0, 10))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // longest streak
  const sortedDays = [...metDays].sort();
  let longest = 0;
  let run = 0;
  let prev: number | null = null;
  for (const day of sortedDays) {
    const ts = new Date(day).getTime();
    if (prev !== null && ts - prev === DAY_MS) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = ts;
  }

  return { current, longest: Math.max(longest, current) };
}

/** Best weight lifted per exercise (estimated 1RM via Epley). */
export function personalRecords(
  exercises: {
    exercise_name: string;
    weight: number;
    reps: number;
    achieved_at: string;
  }[],
): PersonalRecord[] {
  const best = new Map<string, PersonalRecord & { e1rm: number }>();
  for (const ex of exercises) {
    const e1rm = Number(ex.weight) * (1 + Number(ex.reps) / 30);
    const existing = best.get(ex.exercise_name);
    if (!existing || e1rm > existing.e1rm) {
      best.set(ex.exercise_name, {
        exercise_name: ex.exercise_name,
        weight: Number(ex.weight),
        reps: Number(ex.reps),
        achieved_at: ex.achieved_at,
        e1rm,
      });
    }
  }
  return [...best.values()]
    .sort((a, b) => b.e1rm - a.e1rm)
    .map(({ e1rm: _e1rm, ...pr }) => pr);
}
