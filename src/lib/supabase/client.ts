import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client. Uses the public anon key — all access is still
 * gated by Row Level Security.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
