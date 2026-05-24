"use client";
import { cn } from "@/shared/lib/cn";
import { getInitials } from "../../lib/initials";

interface CharacterAvatarProps {
  avatarUrl: string | null;
  characterName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CharacterAvatar({
  avatarUrl,
  characterName,
  size = "md",
  className,
}: CharacterAvatarProps) {
  const dimensionClass =
    size === "sm" ? "h-12 w-12" : size === "lg" ? "h-24 w-24" : "h-16 w-16";
  const initials = getInitials(characterName);

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center overflow-hidden rounded-full border border-ink-muted/40 bg-mist-light font-display text-ink-muted dark:bg-mist-dark dark:text-parchment-muted",
        dimensionClass,
        className,
      )}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={`${characterName}'s portrait`}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className={size === "sm" ? "text-sm" : "text-xl"}>{initials}</span>
      )}
    </div>
  );
}
