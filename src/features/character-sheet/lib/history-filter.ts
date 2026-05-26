import type { RollRecord, RollTier } from "../schemas/roll";
import type { ThemeId } from "../schemas/ids";

export type HistoryRoleFilter =
  | "all"
  | "rolls-only"
  | "reactions-only"
  | "detailed-only";

export type HistoryDatePreset =
  | "any"
  | "past-week"
  | "past-month"
  | "past-3-months"
  | "past-year"
  | "custom";

export interface HistoryFilters {
  text: string;
  tiers: ReadonlySet<RollTier>;
  roleFilter: HistoryRoleFilter;
  themeIds: ReadonlySet<ThemeId>;
  datePreset: HistoryDatePreset;
  customDateFrom: string | null;
  customDateTo: string | null;
}

const DAY_MS = 86_400_000;

export function emptyFilters(): HistoryFilters {
  return {
    text: "",
    tiers: new Set(),
    roleFilter: "all",
    themeIds: new Set(),
    datePreset: "any",
    customDateFrom: null,
    customDateTo: null,
  };
}

export function hasActiveFilters(f: HistoryFilters): boolean {
  return (
    f.text.length > 0 ||
    f.tiers.size > 0 ||
    f.roleFilter !== "all" ||
    f.themeIds.size > 0 ||
    f.datePreset !== "any"
  );
}

export function countActiveFilters(f: HistoryFilters): number {
  let n = 0;
  if (f.text.length > 0) n++;
  if (f.tiers.size > 0) n++;
  if (f.roleFilter !== "all") n++;
  if (f.themeIds.size > 0) n++;
  if (f.datePreset !== "any") n++;
  return n;
}

/**
 * Resolve a preset (or custom range) to a concrete [fromMs, toMs] window.
 * `toMs` is exclusive — for the `custom` preset we add a full day so the
 * user-selected end date is inclusive of its own 24h.
 */
export function resolveDateWindow(
  filters: HistoryFilters,
  now: number = Date.now(),
): { fromMs: number | null; toMs: number | null } {
  if (filters.datePreset === "any") return { fromMs: null, toMs: null };
  if (filters.datePreset === "custom") {
    const fromMs = filters.customDateFrom
      ? Date.parse(filters.customDateFrom)
      : null;
    const toRaw = filters.customDateTo ? Date.parse(filters.customDateTo) : null;
    const toMs = toRaw === null ? null : toRaw + DAY_MS;
    return {
      fromMs: Number.isNaN(fromMs ?? 0) ? null : fromMs,
      toMs: Number.isNaN(toMs ?? 0) ? null : toMs,
    };
  }
  const offset =
    filters.datePreset === "past-week"
      ? 7 * DAY_MS
      : filters.datePreset === "past-month"
        ? 30 * DAY_MS
        : filters.datePreset === "past-3-months"
          ? 90 * DAY_MS
          : 365 * DAY_MS;
  return { fromMs: now - offset, toMs: null };
}

function collectSearchableText(roll: RollRecord): string {
  const parts: string[] = [];
  for (const t of roll.resolved.tags) parts.push(t.name.toLowerCase());
  for (const s of roll.resolved.statuses) parts.push(s.name.toLowerCase());
  return parts.join("\n");
}

/**
 * Apply filters to a list of rolls. Pure; no I/O. Multi-dim AND;
 * within-dim OR for tier + theme; text is case-insensitive substring on
 * resolved tag + status names.
 */
export function applyHistoryFilters(
  rolls: readonly RollRecord[],
  filters: HistoryFilters,
  now: number = Date.now(),
): RollRecord[] {
  const text = filters.text.trim().toLowerCase();
  const { fromMs, toMs } = resolveDateWindow(filters, now);

  return rolls.filter((roll) => {
    if (filters.tiers.size > 0) {
      if (roll.tier === null) return false;
      if (!filters.tiers.has(roll.tier)) return false;
    }

    if (filters.roleFilter === "rolls-only") {
      if (roll.isReaction || roll.isDetailedAction) return false;
    } else if (filters.roleFilter === "reactions-only") {
      if (!roll.isReaction) return false;
    } else if (filters.roleFilter === "detailed-only") {
      if (!roll.isDetailedAction) return false;
    }

    if (filters.themeIds.size > 0) {
      const hit = roll.resolved.tags.some(
        (t) =>
          t.location.kind === "theme" && filters.themeIds.has(t.location.themeId),
      );
      if (!hit) return false;
    }

    if (fromMs !== null || toMs !== null) {
      const createdMs = Date.parse(roll.createdAt);
      if (Number.isNaN(createdMs)) return false;
      if (fromMs !== null && createdMs < fromMs) return false;
      if (toMs !== null && createdMs >= toMs) return false;
    }

    if (text.length > 0) {
      const hay = collectSearchableText(roll);
      if (!hay.includes(text)) return false;
    }

    return true;
  });
}
