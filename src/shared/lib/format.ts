const RTF = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

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
