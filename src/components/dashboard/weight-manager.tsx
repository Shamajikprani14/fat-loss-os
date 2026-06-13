"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  addWeightEntry,
  deleteWeightEntry,
  updateWeightEntry,
} from "@/actions/weight";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatWeight } from "@/lib/utils";
import type { WeightLog } from "@/types";

export function WeightManager({ logs }: { logs: WeightLog[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WeightLog | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(log: WeightLog) {
    setEditing(log);
    setOpen(true);
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = editing
        ? await updateWeightEntry(editing.id, formData)
        : await addWeightEntry(formData);
      if (res.success) {
        toast.success(editing ? "Entry updated" : "Weight logged");
        setOpen(false);
      } else {
        toast.error(res.error ?? "Something went wrong");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this entry?")) return;
    startTransition(async () => {
      const res = await deleteWeightEntry(id);
      if (res.success) toast.success("Entry deleted");
      else toast.error(res.error ?? "Failed to delete");
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Entries</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit entry" : "Add weight entry"}
              </DialogTitle>
              <DialogDescription>
                Log first thing in the morning for the cleanest trend.
              </DialogDescription>
            </DialogHeader>
            <form action={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    step="0.1"
                    defaultValue={editing?.weight}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waist_cm">Waist (cm)</Label>
                  <Input
                    id="waist_cm"
                    name="waist_cm"
                    type="number"
                    step="0.1"
                    defaultValue={editing?.waist_cm ?? ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={editing?.notes ?? ""}
                  placeholder="Optional"
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {editing ? "Save changes" : "Log weight"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-2">
        {logs.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No entries yet. Add your first weigh-in.
          </p>
        )}
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-center justify-between rounded-lg border p-3"
          >
            <div>
              <p className="font-medium">{formatWeight(log.weight)}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(log.logged_at)}
                {log.waist_cm ? ` · waist ${log.waist_cm}cm` : ""}
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEdit(log)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => handleDelete(log.id)}
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
