import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. SERVER ONLY — bypasses RLS. Never import into a Client
 * Component. Use only for trusted server-side jobs (e.g. scheduled AI reviews).
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
