/**
 * History filter tests. Run with:
 *
 *   node --test --experimental-strip-types src/features/character-sheet/lib/__tests__/history-filter.test.ts
 *
 * Uses Node's built-in test runner + assert. Zero deps.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyHistoryFilters,
  countActiveFilters,
  emptyFilters,
  hasActiveFilters,
  resolveDateWindow,
  type HistoryFilters,
} from "../history-filter";
import type {
  ResolvedStatusInvocation,
  ResolvedTagInvocation,
  RollRecord,
  RollTier,
} from "../../schemas/roll";
import type { CharacterId, RollId, ThemeId } from "../../schemas/ids";

const NOW = Date.parse("2026-05-25T12:00:00.000Z");

function tag(
  name: string,
  themeId: ThemeId | null,
): ResolvedTagInvocation {
  return {
    tagId: `tag-${name}` as ResolvedTagInvocation["tagId"],
    location:
      themeId === null
        ? { kind: "backpack" }
        : { kind: "theme", themeId },
    name,
    tagKind: "power",
    polarity: "helpful",
    burned: false,
    contribution: 1,
  };
}

function status(name: string): ResolvedStatusInvocation {
  return {
    statusId: `status-${name}` as ResolvedStatusInvocation["statusId"],
    name,
    tier: 2,
    polarity: "helpful",
    contribution: 2,
    location: { kind: "character" },
  };
}

interface RollOverrides {
  id?: string;
  createdAt?: string;
  isReaction?: boolean;
  isDetailedAction?: boolean;
  tier?: RollTier | null;
  tags?: ResolvedTagInvocation[];
  statuses?: ResolvedStatusInvocation[];
}

function mkRoll(o: RollOverrides = {}): RollRecord {
  return {
    id: (o.id ?? "roll-1") as RollId,
    characterId: "char-1" as CharacterId,
    createdBy: "user-1",
    createdAt: o.createdAt ?? "2026-05-25T10:00:00.000Z",
    isReaction: o.isReaction ?? false,
    resolved: {
      tags: o.tags ?? [],
      statuses: o.statuses ?? [],
    },
    mightModifier: 0,
    d1: 3,
    d2: 4,
    power: 1,
    total: 8,
    tier: o.tier === undefined ? "mixed" : o.tier,
    reactingTo: null,
    sessionId: null,
    isDetailedAction: o.isDetailedAction ?? false,
    detailedActionTarget: null,
    limitAllocationApplied: false,
  };
}

const THEME_A = "theme-a" as ThemeId;
const THEME_B = "theme-b" as ThemeId;

describe("applyHistoryFilters", () => {
  it("returns all rolls when no filters active", () => {
    const rolls = [mkRoll({ id: "1" }), mkRoll({ id: "2" })];
    const out = applyHistoryFilters(rolls, emptyFilters(), NOW);
    assert.equal(out.length, 2);
  });

  it("filters by single tier", () => {
    const rolls = [
      mkRoll({ id: "1", tier: "success" }),
      mkRoll({ id: "2", tier: "failure" }),
    ];
    const filters: HistoryFilters = {
      ...emptyFilters(),
      tiers: new Set(["success"]),
    };
    const out = applyHistoryFilters(rolls, filters, NOW);
    assert.deepEqual(
      out.map((r) => r.id),
      ["1"],
    );
  });

  it("filters by multi-tier OR", () => {
    const rolls = [
      mkRoll({ id: "1", tier: "success" }),
      mkRoll({ id: "2", tier: "failure" }),
      mkRoll({ id: "3", tier: "mixed" }),
    ];
    const filters: HistoryFilters = {
      ...emptyFilters(),
      tiers: new Set(["success", "failure"]),
    };
    const out = applyHistoryFilters(rolls, filters, NOW);
    assert.deepEqual(
      out.map((r) => r.id).sort(),
      ["1", "2"],
    );
  });

  it("excludes null-tier rolls when any tier filter is active", () => {
    const rolls = [
      mkRoll({ id: "1", tier: "success" }),
      mkRoll({ id: "2", tier: null, isReaction: true }),
    ];
    const filters: HistoryFilters = {
      ...emptyFilters(),
      tiers: new Set(["success"]),
    };
    const out = applyHistoryFilters(rolls, filters, NOW);
    assert.deepEqual(
      out.map((r) => r.id),
      ["1"],
    );
  });

  it("rolls-only excludes reactions AND detailed actions", () => {
    const rolls = [
      mkRoll({ id: "1" }),
      mkRoll({ id: "2", isReaction: true }),
      mkRoll({ id: "3", isDetailedAction: true }),
    ];
    const filters: HistoryFilters = {
      ...emptyFilters(),
      roleFilter: "rolls-only",
    };
    const out = applyHistoryFilters(rolls, filters, NOW);
    assert.deepEqual(
      out.map((r) => r.id),
      ["1"],
    );
  });

  it("reactions-only keeps only reactions", () => {
    const rolls = [
      mkRoll({ id: "1" }),
      mkRoll({ id: "2", isReaction: true }),
      mkRoll({ id: "3", isDetailedAction: true }),
    ];
    const filters: HistoryFilters = {
      ...emptyFilters(),
      roleFilter: "reactions-only",
    };
    const out = applyHistoryFilters(rolls, filters, NOW);
    assert.deepEqual(
      out.map((r) => r.id),
      ["2"],
    );
  });

  it("detailed-only keeps only detailed actions", () => {
    const rolls = [
      mkRoll({ id: "1" }),
      mkRoll({ id: "2", isReaction: true }),
      mkRoll({ id: "3", isDetailedAction: true }),
    ];
    const filters: HistoryFilters = {
      ...emptyFilters(),
      roleFilter: "detailed-only",
    };
    const out = applyHistoryFilters(rolls, filters, NOW);
    assert.deepEqual(
      out.map((r) => r.id),
      ["3"],
    );
  });

  it("theme filter keeps rolls with at least one matching theme tag", () => {
    const rolls = [
      mkRoll({ id: "1", tags: [tag("alpha", THEME_A)] }),
      mkRoll({ id: "2", tags: [tag("beta", THEME_B)] }),
      mkRoll({ id: "3", tags: [tag("gamma", null)] }),
    ];
    const filters: HistoryFilters = {
      ...emptyFilters(),
      themeIds: new Set([THEME_A]),
    };
    const out = applyHistoryFilters(rolls, filters, NOW);
    assert.deepEqual(
      out.map((r) => r.id),
      ["1"],
    );
  });

  it("theme filter excludes rolls with no theme-kind tags", () => {
    const rolls = [mkRoll({ id: "1", tags: [tag("backpack-only", null)] })];
    const filters: HistoryFilters = {
      ...emptyFilters(),
      themeIds: new Set([THEME_A]),
    };
    const out = applyHistoryFilters(rolls, filters, NOW);
    assert.equal(out.length, 0);
  });

  it("text search matches tag name substring case-insensitively", () => {
    const rolls = [
      mkRoll({ id: "1", tags: [tag("Sharp Blade", THEME_A)] }),
      mkRoll({ id: "2", tags: [tag("Quiet Steps", THEME_A)] }),
    ];
    const filters: HistoryFilters = { ...emptyFilters(), text: "blade" };
    const out = applyHistoryFilters(rolls, filters, NOW);
    assert.deepEqual(
      out.map((r) => r.id),
      ["1"],
    );
  });

  it("text search matches status name", () => {
    const rolls = [
      mkRoll({ id: "1", statuses: [status("Wounded")] }),
      mkRoll({ id: "2", statuses: [status("Inspired")] }),
    ];
    const filters: HistoryFilters = { ...emptyFilters(), text: "wound" };
    const out = applyHistoryFilters(rolls, filters, NOW);
    assert.deepEqual(
      out.map((r) => r.id),
      ["1"],
    );
  });

  it("text search returns zero when no name matches", () => {
    const rolls = [mkRoll({ id: "1", tags: [tag("Sharp Blade", null)] })];
    const filters: HistoryFilters = { ...emptyFilters(), text: "zzzzz" };
    const out = applyHistoryFilters(rolls, filters, NOW);
    assert.equal(out.length, 0);
  });

  it("date preset past-week excludes older rolls", () => {
    const tenDaysAgo = new Date(NOW - 10 * 86_400_000).toISOString();
    const twoDaysAgo = new Date(NOW - 2 * 86_400_000).toISOString();
    const rolls = [
      mkRoll({ id: "old", createdAt: tenDaysAgo }),
      mkRoll({ id: "new", createdAt: twoDaysAgo }),
    ];
    const filters: HistoryFilters = {
      ...emptyFilters(),
      datePreset: "past-week",
    };
    const out = applyHistoryFilters(rolls, filters, NOW);
    assert.deepEqual(
      out.map((r) => r.id),
      ["new"],
    );
  });

  it("date custom range is inclusive of from and inclusive of to (whole day)", () => {
    const rolls = [
      mkRoll({ id: "before", createdAt: "2026-05-09T23:59:59.000Z" }),
      mkRoll({ id: "start", createdAt: "2026-05-10T00:00:00.000Z" }),
      mkRoll({ id: "mid", createdAt: "2026-05-12T12:00:00.000Z" }),
      mkRoll({ id: "end", createdAt: "2026-05-15T23:59:59.000Z" }),
      mkRoll({ id: "after", createdAt: "2026-05-16T00:00:01.000Z" }),
    ];
    const filters: HistoryFilters = {
      ...emptyFilters(),
      datePreset: "custom",
      customDateFrom: "2026-05-10",
      customDateTo: "2026-05-15",
    };
    const out = applyHistoryFilters(rolls, filters, NOW);
    assert.deepEqual(
      out.map((r) => r.id).sort(),
      ["end", "mid", "start"],
    );
  });

  it("multi-dimension AND combines tier + theme + text restrictively", () => {
    const rolls = [
      mkRoll({
        id: "match",
        tier: "success",
        tags: [tag("Storm Caller", THEME_A)],
      }),
      mkRoll({
        id: "wrong-tier",
        tier: "failure",
        tags: [tag("Storm Caller", THEME_A)],
      }),
      mkRoll({
        id: "wrong-theme",
        tier: "success",
        tags: [tag("Storm Caller", THEME_B)],
      }),
      mkRoll({
        id: "wrong-text",
        tier: "success",
        tags: [tag("Sun Bearer", THEME_A)],
      }),
    ];
    const filters: HistoryFilters = {
      ...emptyFilters(),
      tiers: new Set(["success"]),
      themeIds: new Set([THEME_A]),
      text: "storm",
    };
    const out = applyHistoryFilters(rolls, filters, NOW);
    assert.deepEqual(
      out.map((r) => r.id),
      ["match"],
    );
  });
});

describe("resolveDateWindow", () => {
  it("returns null window for 'any'", () => {
    const w = resolveDateWindow(emptyFilters(), NOW);
    assert.equal(w.fromMs, null);
    assert.equal(w.toMs, null);
  });

  it("returns from=now-7d for 'past-week'", () => {
    const w = resolveDateWindow(
      { ...emptyFilters(), datePreset: "past-week" },
      NOW,
    );
    assert.equal(w.fromMs, NOW - 7 * 86_400_000);
    assert.equal(w.toMs, null);
  });

  it("returns from=now-365d for 'past-year'", () => {
    const w = resolveDateWindow(
      { ...emptyFilters(), datePreset: "past-year" },
      NOW,
    );
    assert.equal(w.fromMs, NOW - 365 * 86_400_000);
    assert.equal(w.toMs, null);
  });

  it("custom range adds full day to 'to' so the end date is inclusive", () => {
    const w = resolveDateWindow(
      {
        ...emptyFilters(),
        datePreset: "custom",
        customDateFrom: "2026-05-10",
        customDateTo: "2026-05-15",
      },
      NOW,
    );
    assert.equal(w.fromMs, Date.parse("2026-05-10"));
    assert.equal(w.toMs, Date.parse("2026-05-15") + 86_400_000);
  });

  it("custom range with only one bound leaves the other null", () => {
    const w = resolveDateWindow(
      {
        ...emptyFilters(),
        datePreset: "custom",
        customDateFrom: "2026-05-10",
        customDateTo: null,
      },
      NOW,
    );
    assert.equal(w.fromMs, Date.parse("2026-05-10"));
    assert.equal(w.toMs, null);
  });
});

describe("hasActiveFilters + countActiveFilters", () => {
  it("empty filters → no active filters", () => {
    const f = emptyFilters();
    assert.equal(hasActiveFilters(f), false);
    assert.equal(countActiveFilters(f), 0);
  });

  it("text counts as one", () => {
    const f: HistoryFilters = { ...emptyFilters(), text: "hi" };
    assert.equal(hasActiveFilters(f), true);
    assert.equal(countActiveFilters(f), 1);
  });

  it("tier set counts as one regardless of cardinality", () => {
    const f: HistoryFilters = {
      ...emptyFilters(),
      tiers: new Set(["success", "mixed"]),
    };
    assert.equal(countActiveFilters(f), 1);
  });

  it("counts every non-default dimension", () => {
    const f: HistoryFilters = {
      text: "x",
      tiers: new Set(["success"]),
      roleFilter: "reactions-only",
      themeIds: new Set([THEME_A]),
      datePreset: "past-week",
      customDateFrom: null,
      customDateTo: null,
    };
    assert.equal(countActiveFilters(f), 5);
  });
});
