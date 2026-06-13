import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProgressManager } from "@/components/dashboard/progress-manager";
import type { ProgressPhoto } from "@/types";

export const metadata = { title: "Progress Photos" };

export default async function ProgressPage() {
  const { user, supabase } = await requireUser();
  const { data } = await supabase
    .from("progress_photos")
    .select("*")
    .eq("user_id", user.id)
    .order("uploaded_at", { ascending: false });

  const photos = (data as ProgressPhoto[]) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress Photos"
        description="Front, side, and back views over time."
      />
      <ProgressManager photos={photos} />
    </div>
  );
}
