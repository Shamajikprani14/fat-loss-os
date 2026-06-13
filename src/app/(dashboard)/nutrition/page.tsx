import { requireUser } from "@/lib/auth";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { NutritionManager } from "@/components/dashboard/nutrition-manager";
import { sumNutrition, weeklyAverageCalories } from "@/services/calculations";
import { startOfTodayISO } from "@/lib/utils";
import { Beef, Flame, CalendarRange } from "lucide-react";
import type { Goal, NutritionLog } from "@/types";

export const metadata = { title: "Nutrition" };

export default async function NutritionPage() {
  const { user, supabase } = await requireUser();
  const todayISO = startOfTodayISO();
  const weekAgoISO = new Date(Date.now() - 7 * 86400000).toISOString();

  const [goalRes, todayRes, weekRes] = await Promise.all([
    supabase.from("goals").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("logged_at", todayISO)
      .order("logged_at", { ascending: false }),
    supabase
      .from("nutrition_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("logged_at", weekAgoISO),
  ]);

  const goal = goalRes.data as Goal | null;
  const today = (todayRes.data as NutritionLog[]) ?? [];
  const week = (weekRes.data as NutritionLog[]) ?? [];

  const consumed = sumNutrition(today);
  const calPct = goal
    ? Math.min(100, Math.round((consumed.calories / goal.target_calories) * 100))
    : 0;
  const proteinPct = goal
    ? Math.min(100, Math.round((consumed.protein / goal.target_protein) * 100))
    : 0;
  const weeklyAvg = weeklyAverageCalories(week);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nutrition"
        description="Calories and macros, daily and weekly."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Calories Today"
          value={`${consumed.calories}`}
          hint={goal ? `of ${goal.target_calories} kcal` : undefined}
          icon={Flame}
        />
        <StatCard
          label="Protein Today"
          value={`${Math.round(consumed.protein)} g`}
          hint={goal ? `of ${goal.target_protein} g` : undefined}
          icon={Beef}
        />
        <StatCard
          label="Weekly Avg Calories"
          value={`${weeklyAvg}`}
          icon={CalendarRange}
        />
      </div>

      {goal && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Targets</CardTitle>
            <CardDescription>Progress toward today&apos;s goals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Calories</span>
                <span className="text-muted-foreground">
                  {consumed.calories} / {goal.target_calories}
                </span>
              </div>
              <Progress value={calPct} />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Protein</span>
                <span className="text-muted-foreground">
                  {Math.round(consumed.protein)} / {goal.target_protein} g
                </span>
              </div>
              <Progress value={proteinPct} />
            </div>
          </CardContent>
        </Card>
      )}

      <NutritionManager logs={today} />
    </div>
  );
}
