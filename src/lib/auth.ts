import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Returns the authenticated user or redirects to /login.
 * Use at the top of protected Server Components and Server Actions.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { user, supabase };
}

export async function getOptionalUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user, supabase };
}
