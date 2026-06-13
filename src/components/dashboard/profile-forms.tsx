"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateProfile, upsertGoals } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACTIVITY_LEVELS, GENDERS } from "@/lib/constants";
import type { Goal, UserProfile } from "@/types";

export function ProfileForms({
  profile,
  goal,
}: {
  profile: UserProfile;
  goal: Goal | null;
}) {
  const [isPending, startTransition] = useTransition();

  function submitProfile(formData: FormData) {
    startTransition(async () => {
      const res = await updateProfile(formData);
      if (res.success) toast.success("Profile saved");
      else toast.error(res.error ?? "Failed");
    });
  }

  function submitGoals(formData: FormData) {
    startTransition(async () => {
      const res = await upsertGoals(formData);
      if (res.success) toast.success("Goals saved");
      else toast.error(res.error ?? "Failed");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Used to personalize calculations.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={submitProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={profile.name ?? ""} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of birth</Label>
                <Input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  defaultValue={profile.date_of_birth ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height_cm">Height (cm)</Label>
                <Input
                  id="height_cm"
                  name="height_cm"
                  type="number"
                  step="0.1"
                  defaultValue={profile.height_cm ?? ""}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select name="gender" defaultValue={profile.gender ?? undefined}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>
                        {g.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="activity_level">Activity level</Label>
                <Select
                  name="activity_level"
                  defaultValue={profile.activity_level ?? "moderate"}
                >
                  <SelectTrigger id="activity_level">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_LEVELS.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={isPending}>
              Save profile
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Goals &amp; Targets</CardTitle>
          <CardDescription>Drives your dashboard metrics.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={submitGoals} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="starting_weight">Starting (kg)</Label>
                <Input
                  id="starting_weight"
                  name="starting_weight"
                  type="number"
                  step="0.1"
                  defaultValue={goal?.starting_weight ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="current_weight">Current (kg)</Label>
                <Input
                  id="current_weight"
                  name="current_weight"
                  type="number"
                  step="0.1"
                  defaultValue={goal?.current_weight ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal_weight">Goal (kg)</Label>
                <Input
                  id="goal_weight"
                  name="goal_weight"
                  type="number"
                  step="0.1"
                  defaultValue={goal?.goal_weight ?? ""}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weekly_target">Weekly target (kg)</Label>
                <Input
                  id="weekly_target"
                  name="weekly_target"
                  type="number"
                  step="0.1"
                  defaultValue={goal?.weekly_target ?? 0.5}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_calories">Calories</Label>
                <Input
                  id="target_calories"
                  name="target_calories"
                  type="number"
                  defaultValue={goal?.target_calories ?? 2000}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_protein">Protein (g)</Label>
                <Input
                  id="target_protein"
                  name="target_protein"
                  type="number"
                  defaultValue={goal?.target_protein ?? 150}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={isPending}>
              Save goals
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
