import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { ProfileForms } from "@/components/dashboard/profile-forms";
import type { Goal, UserProfile } from "@/types";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { user, supabase } = await requireUser();

  const [profileRes, goalRes] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase.from("goals").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const profile =
    (profileRes.data as UserProfile) ??
    ({
      id: user.id,
      email: user.email ?? "",
      name: "",
      height_cm: null,
      date_of_birth: null,
      gender: null,
      activity_level: "moderate",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } satisfies UserProfile);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile & Goals"
        description="Keep these current — they power your targets and AI coaching."
      />
      <ProfileForms profile={profile} goal={(goalRes.data as Goal) ?? null} />
    </div>
  );
}
