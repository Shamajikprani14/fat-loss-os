import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { CoachClient } from "@/components/dashboard/coach-client";
import type { AiReport } from "@/types";

export const metadata = { title: "AI Coach" };

export default async function CoachPage() {
  const { user, supabase } = await requireUser();
  const { data } = await supabase
    .from("ai_reports")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const reports = (data as AiReport[]) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Coach"
        description="Weekly, data-driven coaching and recommendations."
      />
      <CoachClient reports={reports} />
    </div>
  );
}
