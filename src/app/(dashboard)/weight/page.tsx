import { requireUser } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { WeightTrendChart } from "@/components/dashboard/weight-trend-chart";
import { WeeklyAverageChart } from "@/components/dashboard/weekly-average-chart";
import { WeightManager } from "@/components/dashboard/weight-manager";
import {
  monthlyTrendSlope,
  toWeightTrend,
  weeklyAverages,
  weeklyChange,
} from "@/services/calculations";
import { formatDelta, formatWeight } from "@/lib/utils";
import { Scale, TrendingDown, CalendarRange } from "lucide-react";
import type { WeightLog } from "@/types";

export const metadata = { title: "Weight" };

export default async function WeightPage() {
  const { user, supabase } = await requireUser();
  const { data } = await supabase
    .from("weight_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("logged_at", { ascending: false })
    .limit(365);

  const logsDesc = (data as WeightLog[]) ?? [];
  const logsAsc = [...logsDesc].reverse();

  const latest = logsDesc[0]?.weight ?? null;
  const change = weeklyChange(logsAsc);
  const slope = monthlyTrendSlope(logsAsc);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weight"
        description="Track daily weight, weekly averages, and monthly trend."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Current"
          value={formatWeight(latest)}
          icon={Scale}
        />
        <StatCard
          label="7-day Change"
          value={change !== null ? `${formatDelta(change)} kg` : "—"}
          tone={change === null ? "default" : change <= 0 ? "positive" : "negative"}
          icon={TrendingDown}
        />
        <StatCard
          label="Trend"
          value={slope !== null ? `${formatDelta(slope)} kg/wk` : "—"}
          tone={slope === null ? "default" : slope <= 0 ? "positive" : "negative"}
          icon={CalendarRange}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Graph</CardTitle>
            <CardDescription>Every logged weigh-in</CardDescription>
          </CardHeader>
          <CardContent>
            <WeightTrendChart data={toWeightTrend(logsAsc)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Weekly Average</CardTitle>
            <CardDescription>Smoothed weekly trend</CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyAverageChart data={weeklyAverages(logsAsc)} />
          </CardContent>
        </Card>
      </div>

      <WeightManager logs={logsDesc} />
    </div>
  );
}
