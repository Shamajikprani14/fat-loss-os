"use client";

import { useState, useTransition } from "react";
import { Check, Flame, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createHabit, deleteHabit, logHabit } from "@/actions/habit";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { habitStreak } from "@/services/calculations";
import { startOfTodayISO } from "@/lib/utils";
import type { HabitWithLogs } from "@/types";

export function HabitManager({ habits }: { habits: HabitWithLogs[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const todayISO = startOfTodayISO();

  function todaysValue(h: HabitWithLogs) {
    return (h.habit_logs ?? [])
      .filter((l) => l.logged_at >= todayISO)
      .reduce((sum, l) => sum + Number(l.value), 0);
  }

  function quickLog(habitId: string, value: number) {
    startTransition(async () => {
      const res = await logHabit(habitId, value);
      if (res.success) toast.success("Logged");
      else toast.error(res.error ?? "Failed");
    });
  }

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const res = await createHabit(formData);
      if (res.success) {
        toast.success("Habit added");
        setOpen(false);
      } else toast.error(res.error ?? "Failed");
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this habit and its history?")) return;
    startTransition(async () => {
      const res = await deleteHabit(id);
      if (res.success) toast.success("Habit deleted");
      else toast.error(res.error ?? "Failed");
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Habits</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" /> Custom habit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New habit</DialogTitle>
            </DialogHeader>
            <form action={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="habit_name">Name</Label>
                <Input id="habit_name" name="habit_name" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target">Daily target</Label>
                  <Input
                    id="target"
                    name="target"
                    type="number"
                    step="0.5"
                    defaultValue={1}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input id="unit" name="unit" placeholder="glasses, min…" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  Add habit
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        {habits.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No habits yet.
          </p>
        )}
        {habits.map((h) => {
          const value = todaysValue(h);
          const done = value >= Number(h.target);
          const { current, longest } = habitStreak(
            h.habit_logs ?? [],
            Number(h.target),
          );
          return (
            <div
              key={h.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{h.habit_name}</p>
                  {current > 0 && (
                    <Badge variant="success" className="gap-1">
                      <Flame className="h-3 w-3" /> {current}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {value} / {h.target} {h.unit ?? ""} today · best {longest}d
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={done ? "secondary" : "default"}
                  size="sm"
                  disabled={isPending}
                  onClick={() => quickLog(h.id, Number(h.target))}
                >
                  <Check className="h-4 w-4" /> {done ? "Done" : "Complete"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => handleDelete(h.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
