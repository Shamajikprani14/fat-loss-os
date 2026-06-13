"use client";

import { useState, useTransition } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generateReport } from "@/actions/coach";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { AiReport } from "@/types";

/** Minimal markdown renderer for headings, bold, and list items. */
function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith("## "))
          return (
            <h3 key={i} className="pt-2 font-semibold">
              {line.slice(3)}
            </h3>
          );
        if (line.startsWith("# "))
          return (
            <h2 key={i} className="pt-2 text-lg font-bold">
              {line.slice(2)}
            </h2>
          );
        const bullet = /^\s*[-*\d.]+\s+/.test(line);
        const content = line.replace(/\*\*(.+?)\*\*/g, "$1");
        if (!content.trim()) return <div key={i} className="h-1" />;
        return (
          <p
            key={i}
            className={bullet ? "pl-4 text-muted-foreground" : ""}
          >
            {content}
          </p>
        );
      })}
    </div>
  );
}

export function CoachClient({ reports }: { reports: AiReport[] }) {
  const [items, setItems] = useState(reports);
  const [isPending, startTransition] = useTransition();

  function generate() {
    startTransition(async () => {
      const res = await generateReport();
      if (res.success && res.data) {
        setItems((prev) => [res.data!, ...prev]);
        toast.success("Weekly review ready");
      } else {
        toast.error(res.error ?? "Failed to generate");
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="flex flex-col items-start gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">Generate your weekly review</p>
            <p className="text-sm text-muted-foreground">
              Analyzes weight, workouts, habits, and nutrition into clear
              recommendations.
            </p>
          </div>
          <Button onClick={generate} disabled={isPending}>
            <Sparkles className="h-4 w-4" />
            {isPending ? "Analyzing…" : "Generate review"}
          </Button>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No reviews yet. Generate your first weekly review.
          </CardContent>
        </Card>
      ) : (
        items.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardTitle className="text-base">Weekly Review</CardTitle>
              <CardDescription>{formatDate(r.created_at)}</CardDescription>
            </CardHeader>
            <CardContent>
              <Markdown text={r.report} />
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
