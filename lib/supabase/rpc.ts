import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/** PostgREST error when a function is not in the schema cache (migration not applied yet). */
const FUNCTION_NOT_FOUND = "PGRST202";

/**
 * Calls a database function, falling back to `fallback` when the function
 * does not exist yet. Lets the app ship before the migration is applied.
 */
export async function rpcWithFallback(
  supabase: SupabaseClient,
  fn: string,
  args: Record<string, unknown>,
  fallback: () => Promise<void>,
) {
  const { error } = await supabase.rpc(fn, args);
  if (!error) return;
  if (error.code === FUNCTION_NOT_FOUND) return fallback();
  throw new Error(error.message);
}
