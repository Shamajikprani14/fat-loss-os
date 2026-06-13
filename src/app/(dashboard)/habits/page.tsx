import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { HabitManager } from "@/components/dashboard/habit-manager";
import type { HabitWithLogs } from "@/types";

export const metadata = { title: "Habits" };

export default async function HabitsPage() {
  const { user, supabase } = await requireUser();
  const { data } = await supabase
    .from("habits")
    .select("*, habit_logs(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const habits = (data as HabitWithLogs[]) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Habits"
        description="Build consistency. Tap complete to keep your streak alive."
      />
      <HabitManager habits={habits} />
    </div>
  );
}
