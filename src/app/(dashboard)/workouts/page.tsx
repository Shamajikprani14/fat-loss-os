import { requireUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { WorkoutManager } from "@/components/dashboard/workout-manager";
import { personalRecords } from "@/services/calculations";
import { Trophy } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { WorkoutWithExercises } from "@/types";

export const metadata = { title: "Workouts" };

export default async function WorkoutsPage() {
  const { user, supabase } = await requireUser();
  const { data } = await supabase
    .from("workouts")
    .select("*, exercise_logs(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const workouts = (data as WorkoutWithExercises[]) ?? [];

  const allExercises = workouts.flatMap((w) =>
    w.exercise_logs.map((e) => ({
      exercise_name: e.exercise_name,
      weight: Number(e.weight),
      reps: e.reps,
      achieved_at: w.created_at,
    })),
  );
  const prs = personalRecords(allExercises).slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workouts"
        description="Log sessions and track personal records."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" /> Personal Records
          </CardTitle>
          <CardDescription>Best estimated 1RM per exercise.</CardDescription>
        </CardHeader>
        <CardContent>
          {prs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Log a workout to start tracking PRs.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {prs.map((pr) => (
                <div
                  key={pr.exercise_name}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{pr.exercise_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(pr.achieved_at)}
                    </p>
                  </div>
                  <Badge variant="success">
                    {pr.weight}kg × {pr.reps}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <WorkoutManager workouts={workouts} />
    </div>
  );
}
