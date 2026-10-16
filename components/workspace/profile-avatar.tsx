import { cn } from "@/lib/utils";
import type { Profile } from "@/types/profile";

export function getInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}

export function ProfileAvatar({
  profile,
  src,
  name,
  className,
}: {
  profile?: Pick<Profile, "nickname" | "avatar_url">;
  src?: string | null;
  name?: string;
  className?: string;
}) {
  const image = src !== undefined ? src : profile?.avatar_url;
  const label = name ?? profile?.nickname ?? "";

  return (
    <span
      className={cn(
        "relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-soft text-xs font-semibold text-primary ring-1 ring-border",
        className,
      )}
    >
      {image ? (
        // Avatars come from Supabase Storage public URLs; no optimizer config needed.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="size-full object-cover" />
      ) : (
        getInitials(label)
      )}
    </span>
  );
}
