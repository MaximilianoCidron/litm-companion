"use client";
import { cn } from "@/shared/lib/cn";
import { formatRelativeTime } from "@/shared/lib/format";
import { usePresenceOne } from "../../hooks/use-presence";

interface PresenceDotProps {
  uid: string;
  size?: "sm" | "md";
  className?: string;
}

export function PresenceDot({ uid, size = "sm", className }: PresenceDotProps) {
  const { doc, isOnline } = usePresenceOne(uid);
  const dimensions = size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5";
  const label = isOnline
    ? "Online"
    : doc
      ? `Last seen ${formatRelativeTime(doc.lastSeenAt)}`
      : "Offline";
  return (
    <span
      role="status"
      aria-label={label}
      title={label}
      className={cn(
        "inline-block rounded-full",
        dimensions,
        isOnline
          ? "bg-moss dark:bg-moss-dark"
          : "bg-mist-light dark:bg-mist-dark",
        className,
      )}
    />
  );
}
