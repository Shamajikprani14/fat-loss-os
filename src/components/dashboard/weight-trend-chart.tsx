"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeightTrendPoint } from "@/types";
import { formatShortDate } from "@/lib/utils";

export function WeightTrendChart({ data }: { data: WeightTrendPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
        Log your weight to see the trend.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: formatShortDate(d.date),
    weight: d.weight,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={chartData} margin={{ left: -16, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={["dataMin - 1", "dataMax + 1"]}
          tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(v: number) => [`${v} kg`, "Weight"]}
        />
        <Area
          type="monotone"
          dataKey="weight"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          fill="url(#weightFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
