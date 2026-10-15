import "server-only";

import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import { fallbackNickname, mapProfile, PROFILE_COLUMNS } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const getCurrentUser = cache(async () => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

/** Loads the signed-in user's profile, creating it on first access. */
export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();

  if (error) return null;
  if (data) return mapProfile(data);

  const { data: created } = await supabase
    .from("profiles")
    .insert({ id: user.id, nickname: fallbackNickname(user.email) })
    .select(PROFILE_COLUMNS)
    .single();

  return mapProfile(created);
});
