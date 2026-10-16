function readRequiredEnv(value: string | undefined, key: string): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

/** False in environments without Supabase (e.g. CI running only the demo). */
export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

// Static `process.env.X` access is required so Next can inline public values in the client bundle.
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: () =>
    readRequiredEnv(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL",
    ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: () =>
    readRequiredEnv(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ),
};
