import {
  PROFILE_ACCENTS,
  type Profile,
  type ProfileAccent,
  type TaskColumnWidths,
} from "@/types/profile";

export const PROFILE_COLUMNS =
  "id,nickname,avatar_url,accent_color,display_mode,task_column_widths,created_at,updated_at";

export function normalizeProfileAccent(value: unknown): ProfileAccent {
  return PROFILE_ACCENTS.includes(value as ProfileAccent)
    ? (value as ProfileAccent)
    : "teal";
}

export function fallbackNickname(email: string | null | undefined) {
  return email?.split("@")[0]?.trim() || "Usuário";
}

function mapTaskColumnWidths(value: unknown): TaskColumnWidths | null {
  if (!value || typeof value !== "object") return null;
  const widths = value as Record<string, unknown>;
  const sections = ["not_started", "in_progress", "waiting", "completed"] as const;
  const valid = sections.every(
    (section) =>
      typeof widths[section] === "number" &&
      Number.isFinite(widths[section]) &&
      (widths[section] as number) > 0,
  );
  return valid ? (widths as unknown as TaskColumnWidths) : null;
}

export function mapProfile(value: unknown): Profile | null {
  if (!value || typeof value !== "object") return null;
  const profile = value as Partial<Profile>;
  if (
    typeof profile.id !== "string" ||
    typeof profile.created_at !== "string" ||
    typeof profile.updated_at !== "string"
  ) {
    return null;
  }

  return {
    id: profile.id,
    nickname:
      typeof profile.nickname === "string" && profile.nickname.trim()
        ? profile.nickname.trim()
        : "Usuário",
    avatar_url: typeof profile.avatar_url === "string" ? profile.avatar_url : null,
    accent_color: normalizeProfileAccent(profile.accent_color),
    display_mode: profile.display_mode === "compact" ? "compact" : "full",
    task_column_widths: mapTaskColumnWidths(profile.task_column_widths),
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}

/** Applies an accent to the whole document (portals included). */
export function applyDocumentAccent(accent: ProfileAccent) {
  document.documentElement.dataset.accent = accent;
}
