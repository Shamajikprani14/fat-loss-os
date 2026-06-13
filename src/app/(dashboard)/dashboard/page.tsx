import Link from "next/link";
import {
  Dumbbell,
  Flame,
  Beef,
  Scale,
  Target,
  TrendingDown,
  Utensils,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { WeightTrendChart } from "@/components/dashboard/weight-trend-chart";
import { WeeklyAverageChart } from "@/components/dashboard/weekly-average-chart";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  sumNutrition,
  toWeightTrend,
  totalWeightLost,
  weeklyAverages,
  weeklyChange,
  habitStreak,
} from "@/services/calculations";
import {
  formatDelta,
  formatNumber,
  formatWeight,
  startOfTodayISO,
} from "@/lib/utils";
import type {
  Goal,
  HabitWithLogs,
  NutritionLog,
  WeightLog,
  WorkoutWithExercises,
} from "@/types";

export default async function DashboardPage() {
  const { user, supabase } = await requireUser();
  const todayISO = startOfTodayISO();

  const [goalRes, weightRes, todayNutritionRes, workoutsRes, habitsRes] =
    await Promise.all([
      supabase.from("goals").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("weight_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: true })
        .limit(90),
      supabase
        .from("nutrition_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("logged_at", todayISO),
      supabase
        .from("workouts")
        .select("*, exercise_logs(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3),
      supabase.from("habits").select("*, habit_logs(*)").eq("user_id", user.id),
    ]);

  const goal = goalRes.data as Goal | null;
  const weightLogs = (weightRes.data as WeightLog[]) ?? [];
  const todayNutrition = (todayNutritionRes.data as NutritionLog[]) ?? [];
  const workouts = (workoutsRes.data as WorkoutWithExercises[]) ?? [];
  const habits = (habitsRes.data as HabitWithLogs[]) ?? [];

  const latest = weightLogs[weightLogs.length - 1]?.weight ?? null;
  const currentWeight = goal?.current_weight ?? latest;
  const goalWeight = goal?.goal_weight ?? null;
  const lost = totalWeightLost(goal?.starting_weight ?? null, currentWeight);
  const change = weeklyChange(weightLogs);

  const consumed = sumNutrition(todayNutrition);
  const caloriesRemaining = goal
    ? goal.target_calories - consumed.calories
    : null;
  const proteinRemaining = goal
    ? Math.round(goal.target_protein - consumed.protein)
    : null;

  const trend = toWeightTrend(weightLogs);
  const weekly = weeklyAverages(weightLogs);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Your fat loss at a glance."
        action={
          <Button asChild>
            <Link href="/weight">Log weight</Link>
          </Button>
        }
      />

      {!goal && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex flex-col items-start gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium">Set your goals to unlock targets</p>
              <p className="text-sm text-muted-foreground">
                Add your starting, current, and goal weight plus calorie and
                protein targets.
              </p>
            </div>
            <Button asChild>
              <Link href="/profile">Set goals</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Current Weight"
          value={formatWeight(currentWeight)}
          icon={Scale}
        />
        <StatCard
          label="Goal Weight"
          value={formatWeight(goalWeight)}
          icon={Target}
        />
        <StatCard
          label="Total Lost"
          value={lost !== null ? `${formatNumber(lost)} kg` : "—"}
          hint={lost !== null && lost > 0 ? "Keep going!" : undefined}
          tone={lost !== null && lost > 0 ? "positive" : "default"}
          icon={TrendingDown}
        />
        <StatCard
          label="Weekly Change"
          value={change !== null ? `${formatDelta(change)} kg` : "—"}
          tone={
            change === null ? "default" : change <= 0 ? "positive" : "negative"
          }
          icon={TrendingDown}
        />
        <StatCard
          label="Calories Left"
          value={caloriesRemaining !== null ? `${caloriesRemaining}` : "—"}
          hint={goal ? `of ${goal.target_calories} kcal` : "Set a target"}
          icon={Flame}
        />
        <StatCard
          label="Protein Left"
          value={proteinRemaining !== null ? `${proteinRemaining} g` : "—"}
          hint={goal ? `of ${goal.target_protein} g` : "Set a target"}
          icon={Beef}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weight Trend</CardTitle>
            <CardDescription>Last 90 days</CardDescription>
          </CardHeader>
          <CardContent>
            <WeightTrendChart data={trend} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Weekly Average</CardTitle>
            <CardDescription>Average weight by week</CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyAverageChart data={weekly} />
          </CardContent>
        </Card>
      </div>

      {/* Widgets */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Habits</CardTitle>
            <CardDescription>Streaks update as you log.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {habits.length === 0 && (
              <p className="text-sm text-muted-foreground">No habits yet.</p>
            )}
            {habits.map((h) => {
              const { current } = habitStreak(
                h.habit_logs ?? [],
                Number(h.target),
              );
              return (
                <div
                  key={h.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{h.habit_name}</span>
                  <Badge variant={current > 0 ? "success" : "secondary"}>
                    {current} day{current === 1 ? "" : "s"}
                  </Badge>
                </div>
              );
            })}
            <Button asChild variant="outline" className="w-full">
              <Link href="/habits">Open habits</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Workouts</CardTitle>
            <CardDescription>Your latest sessions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {workouts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No workouts logged.
              </p>
            )}
            {workouts.map((w) => (
              <div key={w.id} className="flex items-center gap-3 text-sm">
                <Dumbbell className="h-4 w-4 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{w.workout_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {w.exercise_logs?.length ?? 0} exercises ·{" "}
                    {w.duration_minutes ?? 0} min
                  </p>
                </div>
              </div>
            ))}
            <Button asChild variant="outline" className="w-full">
              <Link href="/workouts">Open workouts</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Nutrition</CardTitle>
            <CardDescription>
              {consumed.calories} kcal · {Math.round(consumed.protein)}g protein
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayNutrition.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nothing logged today.
              </p>
            )}
            {todayNutrition.slice(0, 4).map((m) => (
              <div key={m.id} className="flex items-center gap-3 text-sm">
                <Utensils className="h-4 w-4 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{m.meal_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.calories} kcal · {Math.round(Number(m.protein))}g P
                  </p>
                </div>
              </div>
            ))}
            <Button asChild variant="outline" className="w-full">
              <Link href="/nutrition">Open nutrition</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
