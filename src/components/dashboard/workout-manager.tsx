"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  createWorkout,
  deleteWorkout,
  updateWorkout,
} from "@/actions/workout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import type { WorkoutWithExercises } from "@/types";

type ExerciseRow = {
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
};

const emptyRow: ExerciseRow = {
  exercise_name: "",
  sets: 3,
  reps: 10,
  weight: 0,
};

export function WorkoutManager({
  workouts,
}: {
  workouts: WorkoutWithExercises[];
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WorkoutWithExercises | null>(null);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<ExerciseRow[]>([{ ...emptyRow }]);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setEditing(null);
    setName("");
    setDuration("");
    setNotes("");
    setRows([{ ...emptyRow }]);
  }

  function openCreate() {
    reset();
    setOpen(true);
  }

  function openEdit(w: WorkoutWithExercises) {
    setEditing(w);
    setName(w.workout_name);
    setDuration(w.duration_minutes?.toString() ?? "");
    setNotes(w.notes ?? "");
    setRows(
      w.exercise_logs.length
        ? w.exercise_logs.map((e) => ({
            exercise_name: e.exercise_name,
            sets: e.sets,
            reps: e.reps,
            weight: Number(e.weight),
          }))
        : [{ ...emptyRow }],
    );
    setOpen(true);
  }

  function updateRow(i: number, patch: Partial<ExerciseRow>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  function submit() {
    const payload = {
      workout_name: name,
      duration_minutes: duration ? Number(duration) : null,
      notes: notes || null,
      exercises: rows.filter((r) => r.exercise_name.trim().length > 0),
    };
    startTransition(async () => {
      const res = editing
        ? await updateWorkout(editing.id, payload)
        : await createWorkout(payload);
      if (res.success) {
        toast.success(editing ? "Workout updated" : "Workout saved");
        setOpen(false);
        reset();
      } else {
        toast.error(res.error ?? "Something went wrong");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this workout?")) return;
    startTransition(async () => {
      const res = await deleteWorkout(id);
      if (res.success) toast.success("Workout deleted");
      else toast.error(res.error ?? "Failed");
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Workouts</CardTitle>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) reset();
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" /> New workout
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit workout" : "Create workout"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wname">Name</Label>
                  <Input
                    id="wname"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Push Day"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wduration">Duration (min)</Label>
                  <Input
                    id="wduration"
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Exercises</Label>
                {rows.map((row, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="Exercise"
                        value={row.exercise_name}
                        onChange={(e) =>
                          updateRow(i, { exercise_name: e.target.value })
                        }
                      />
                    </div>
                    <Input
                      className="w-16"
                      type="number"
                      aria-label="sets"
                      value={row.sets}
                      onChange={(e) =>
                        updateRow(i, { sets: Number(e.target.value) })
                      }
                    />
                    <Input
                      className="w-16"
                      type="number"
                      aria-label="reps"
                      value={row.reps}
                      onChange={(e) =>
                        updateRow(i, { reps: Number(e.target.value) })
                      }
                    />
                    <Input
                      className="w-20"
                      type="number"
                      step="0.5"
                      aria-label="weight"
                      value={row.weight}
                      onChange={(e) =>
                        updateRow(i, { weight: Number(e.target.value) })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setRows((r) => r.filter((_, idx) => idx !== i))
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Columns: exercise · sets · reps · weight (kg)
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRows((r) => [...r, { ...emptyRow }])}
                >
                  <Plus className="h-4 w-4" /> Add exercise
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wnotes">Notes</Label>
                <Textarea
                  id="wnotes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={isPending}>
                {editing ? "Save changes" : "Save workout"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        {workouts.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No workouts yet.
          </p>
        )}
        {workouts.map((w) => (
          <div key={w.id} className="rounded-lg border p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium">{w.workout_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(w.created_at)} · {w.duration_minutes ?? 0} min ·{" "}
                  {w.exercise_logs.length} exercises
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(w)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => handleDelete(w.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {w.exercise_logs.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {w.exercise_logs.map((e) => (
                  <li key={e.id}>
                    {e.exercise_name} — {e.sets}×{e.reps} @ {e.weight}kg
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
