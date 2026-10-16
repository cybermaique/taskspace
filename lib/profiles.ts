import "server-only";

import type { UpdateProfileBody } from "@/lib/api/schemas";
import { HttpError } from "@/lib/api/route";
import { getCurrentUser } from "@/lib/auth";
import { mapProfile, PROFILE_COLUMNS } from "@/lib/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const AVATAR_BUCKET = "profile-avatars";
const MAX_AVATAR_BYTES = 4 * 1024 * 1024;

async function requireUserId() {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Sua sessão expirou. Entre novamente.");
  return user.id;
}

export async function updateProfile(input: UpdateProfileBody) {
  const userId = await requireUserId();
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .update(input)
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .single();

  const profile = mapProfile(data);
  if (error || !profile) throw new Error(error?.message ?? "Não foi possível salvar o perfil.");
  return profile;
}

export async function uploadAvatar(file: File) {
  if (!file.type.startsWith("image/") || file.type.includes("svg")) {
    throw new HttpError(400, "Escolha uma imagem PNG, JPG, GIF ou WebP.");
  }
  if (file.size > MAX_AVATAR_BYTES) throw new HttpError(400, "A imagem deve ter no máximo 4 MB.");

  const userId = await requireUserId();
  const supabase = await createSupabaseServerClient();
  const extension = file.type.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "png";
  const path = `${userId}/avatar.${extension}`;

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { cacheControl: "3600", contentType: file.type, upsert: true });
  if (error) throw new Error(error.message);

  const publicUrl = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
  const { data, error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: `${publicUrl}?v=${Date.now()}` })
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .single();

  const profile = mapProfile(data);
  if (updateError || !profile) throw new Error(updateError?.message ?? "Não foi possível salvar a foto.");
  return profile;
}
