"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addMeal, deleteMeal, updateMeal } from "@/actions/nutrition";
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
import type { NutritionLog } from "@/types";

const MACROS = [
  { name: "calories", label: "Calories", step: "1" },
  { name: "protein", label: "Protein (g)", step: "0.1" },
  { name: "carbs", label: "Carbs (g)", step: "0.1" },
  { name: "fat", label: "Fat (g)", step: "0.1" },
] as const;

export function NutritionManager({ logs }: { logs: NutritionLog[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NutritionLog | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = editing
        ? await updateMeal(editing.id, formData)
        : await addMeal(formData);
      if (res.success) {
        toast.success(editing ? "Meal updated" : "Meal added");
        setOpen(false);
        setEditing(null);
      } else {
        toast.error(res.error ?? "Something went wrong");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this meal?")) return;
    startTransition(async () => {
      const res = await deleteMeal(id);
      if (res.success) toast.success("Meal deleted");
      else toast.error(res.error ?? "Failed");
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Today&apos;s Meals</CardTitle>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4" /> Add meal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit meal" : "Add meal"}</DialogTitle>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meal_name">Meal name</Label>
                <Input
                  id="meal_name"
                  name="meal_name"
                  defaultValue={editing?.meal_name}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {MACROS.map((m) => (
                  <div key={m.name} className="space-y-2">
                    <Label htmlFor={m.name}>{m.label}</Label>
                    <Input
                      id={m.name}
                      name={m.name}
                      type="number"
                      step={m.step}
                      defaultValue={editing?.[m.name] ?? 0}
                      required
                    />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {editing ? "Save" : "Add meal"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-2">
        {logs.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No meals logged today.
          </p>
        )}
        {logs.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{m.meal_name}</p>
              <p className="text-xs text-muted-foreground">
                {m.calories} kcal · {Math.round(Number(m.protein))}P ·{" "}
                {Math.round(Number(m.carbs))}C · {Math.round(Number(m.fat))}F
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditing(m);
                  setOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => handleDelete(m.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
