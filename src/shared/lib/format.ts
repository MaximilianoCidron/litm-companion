const RTF = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "3h 42m" / "0h 04m" / "12m" / "0s" for sub-minute. */
export function formatDuration(ms: number): string {
  if (ms < 0) return "0s";
  if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const absSec = Math.abs(diffSec);

  if (absSec < 5) return "just now";
  if (absSec < 45) return RTF.format(diffSec, "second");
  if (absSec < 3600) return RTF.format(Math.round(diffSec / 60), "minute");
  if (absSec < 86400) return RTF.format(Math.round(diffSec / 3600), "hour");
  if (absSec < 604800) return RTF.format(Math.round(diffSec / 86400), "day");

  return date.toLocaleDateString();
}
