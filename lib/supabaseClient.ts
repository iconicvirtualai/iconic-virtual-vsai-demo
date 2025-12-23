import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a "no-op" client if env vars aren't present (prevents build crash)
export const supabase: SupabaseClient =
  url && anon
    ? createClient(url, anon)
    : (null as unknown as SupabaseClient);
