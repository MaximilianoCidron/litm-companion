"use client";

interface BurnedRestoreToggleProps {
  burnedCount: number;
  value: boolean;
  onChange: (next: boolean) => void;
}

export function BurnedRestoreToggle({
  burnedCount,
  value,
  onChange,
}: BurnedRestoreToggleProps) {
  if (burnedCount === 0) return null;
  return (
    <label className="flex items-center gap-2 rounded-lg border border-mist-light bg-parchment-soft p-3 text-sm dark:border-mist-dark dark:bg-ink-soft">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.currentTarget.checked)}
        className="h-4 w-4 accent-ember"
      />
      <span className="text-ink-base dark:text-parchment-base">
        Restore all burned tags ({burnedCount} currently burned)
      </span>
    </label>
  );
}
