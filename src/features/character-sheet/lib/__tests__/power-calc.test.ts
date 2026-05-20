/**
 * Power calculation tests. Run with:
 *
 *   node --test --experimental-strip-types src/features/character-sheet/lib/__tests__/power-calc.test.ts
 *
 * Uses Node's built-in test runner + assert. Zero deps. If a project-wide
 * test runner is added later (vitest, jest), these `describe`/`it` calls
 * are compatible with both.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computePower, resolveInvocations } from "../power-calc";
import type {
  Character,
  PowerTag,
  Status,
  StoryTag,
  Theme,
  WeaknessTag,
} from "../../schemas";

const NOW = "2026-05-19T00:00:00.000Z";

function powerTag(
  id: string,
  name: string,
  opts: { scratched?: boolean; burned?: boolean } = {},
): PowerTag {
  return {
    id: id as PowerTag["id"],
    name,
    scratched: opts.scratched ?? false,
    burned: opts.burned ?? false,
  };
}

function weaknessTag(id: string, name: string): WeaknessTag {
  return { id: id as WeaknessTag["id"], name };
}

function storyTag(
  id: string,
  name: string,
  polarity: "helpful" | "hindering",
  scratched = false,
): StoryTag {
  return {
    id: id as StoryTag["id"],
    name,
    polarity,
    isSingleUse: false,
    scratched,
  };
}

function status(
  id: string,
  name: string,
  tier: 1 | 2 | 3 | 4 | 5 | 6,
  polarity: "helpful" | "hindering",
): Status {
  return { id: id as Status["id"], name, tier, polarity };
}

function theme(overrides: Partial<Theme> = {}): Theme {
  return {
    id: ("theme-" + Math.random().toString(36).slice(2)) as Theme["id"],
    type: "origin:trait",
    mightLevel: "origin",
    name: "Test theme",
    quest: "",
    powerTags: [],
    weaknessTag: weaknessTag(
      "wk-" + Math.random().toString(36).slice(2),
      "",
    ),
    specialImprovements: [],
    tracks: { improve: 0, milestone: 0, abandon: 0 },
    ...overrides,
  };
}

function character(
  themes: Theme[],
  storyTags: StoryTag[] = [],
  statuses: Status[] = [],
): Character {
  const padded = [
    themes[0] ?? theme(),
    themes[1] ?? theme(),
    themes[2] ?? theme(),
    themes[3] ?? theme(),
  ] as Character["themes"];
  return {
    id: "char-1" as Character["id"],
    userId: "u1",
    campaignIds: [],
    identity: {
      name: "Test",
      concept: "",
      playerName: "",
      pronouns: "",
      avatarUrl: null,
      legendMistBalance: 0,
    },
    themes: padded,
    statuses,
    backpack: { storyTags, notes: "" },
    progression: { promise: 0, quintessences: [] },
    fellowship: { relationships: [] },
    createdAt: NOW,
    updatedAt: NOW,
  };
}

describe("computePower", () => {
  it("1. empty invocations + Even Might => Power 0", () => {
    const c = character([]);
    const result = computePower(
      c,
      { tags: [], statuses: [] },
      0,
    );
    assert.equal(result.total, 0);
    assert.equal(result.items.length, 0);
  });

  it("2. single power tag invoked normally => +1", () => {
    const t = theme({
      powerTags: [powerTag("p1", "Strong arm")],
    });
    const c = character([t]);
    const result = computePower(
      c,
      {
        tags: [
          {
            tagId: "p1" as PowerTag["id"],
            location: { kind: "theme", themeId: t.id },
            burn: false,
          },
        ],
        statuses: [],
      },
      0,
    );
    assert.equal(result.total, 1);
  });

  it("3. burning a power tag yields +3 instead of +1", () => {
    const t = theme({ powerTags: [powerTag("p1", "Strong arm")] });
    const c = character([t]);
    const result = computePower(
      c,
      {
        tags: [
          {
            tagId: "p1" as PowerTag["id"],
            location: { kind: "theme", themeId: t.id },
            burn: true,
          },
        ],
        statuses: [],
      },
      0,
    );
    assert.equal(result.total, 3);
  });

  it("4. invoking a weakness tag contributes -1", () => {
    const wk = weaknessTag("wk1", "Stubborn");
    const t = theme({ weaknessTag: wk });
    const c = character([t]);
    const result = computePower(
      c,
      {
        tags: [
          {
            tagId: "wk1" as PowerTag["id"],
            location: { kind: "theme", themeId: t.id },
            burn: false,
          },
        ],
        statuses: [],
      },
      0,
    );
    assert.equal(result.total, -1);
  });

  it("5. max helpful + max hindering statuses cancel signed by tier", () => {
    const c = character(
      [],
      [],
      [
        status("s1", "Confident", 3, "helpful"),
        status("s2", "Sleepy", 2, "hindering"),
      ],
    );
    const result = computePower(
      c,
      {
        tags: [],
        statuses: [
          { statusId: "s1" as Status["id"] },
          { statusId: "s2" as Status["id"] },
        ],
      },
      0,
    );
    assert.equal(result.total, 3 - 2);
  });

  it("6. only the highest helpful counts; others contribute 0", () => {
    const c = character(
      [],
      [],
      [
        status("s1", "Inspired", 2, "helpful"),
        status("s2", "Confident", 3, "helpful"),
      ],
    );
    const result = computePower(
      c,
      {
        tags: [],
        statuses: [
          { statusId: "s1" as Status["id"] },
          { statusId: "s2" as Status["id"] },
        ],
      },
      0,
    );
    assert.equal(result.total, 3);
  });

  it("7. helpful story tag contributes +1", () => {
    const c = character(
      [],
      [storyTag("st1", "Healing potion", "helpful")],
      [],
    );
    const result = computePower(
      c,
      {
        tags: [
          {
            tagId: "st1" as PowerTag["id"],
            location: { kind: "backpack" },
            burn: false,
          },
        ],
        statuses: [],
      },
      0,
    );
    assert.equal(result.total, 1);
  });

  it("8. Might modifier adds to total", () => {
    const c = character([]);
    const result = computePower(c, { tags: [], statuses: [] }, 3);
    assert.equal(result.total, 3);
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0]?.label, "Favored");
  });

  it("9. mixed: power tag + helpful status + Favored", () => {
    const t = theme({ powerTags: [powerTag("p1", "Sharp eye")] });
    const c = character([t], [], [status("s1", "Confident", 3, "helpful")]);
    const result = computePower(
      c,
      {
        tags: [
          {
            tagId: "p1" as PowerTag["id"],
            location: { kind: "theme", themeId: t.id },
            burn: false,
          },
        ],
        statuses: [{ statusId: "s1" as Status["id"] }],
      },
      3,
    );
    assert.equal(result.total, 1 + 3 + 3);
  });

  it("10. resolveInvocations rejects scratched power tag without burn", () => {
    const t = theme({
      powerTags: [powerTag("p1", "Worn", { scratched: true })],
    });
    const c = character([t]);
    const res = resolveInvocations(c, {
      tags: [
        {
          tagId: "p1" as PowerTag["id"],
          location: { kind: "theme", themeId: t.id },
          burn: false,
        },
      ],
      statuses: [],
    });
    assert.equal(res.ok, false);
  });

  it("11. resolveInvocations rejects already-burned power tag", () => {
    const t = theme({
      powerTags: [powerTag("p1", "Used", { burned: true, scratched: true })],
    });
    const c = character([t]);
    const res = resolveInvocations(c, {
      tags: [
        {
          tagId: "p1" as PowerTag["id"],
          location: { kind: "theme", themeId: t.id },
          burn: false,
        },
      ],
      statuses: [],
    });
    assert.equal(res.ok, false);
  });

  it("12. resolveInvocations rejects burning a weakness tag", () => {
    const wk = weaknessTag("wk1", "Stubborn");
    const t = theme({ weaknessTag: wk });
    const c = character([t]);
    const res = resolveInvocations(c, {
      tags: [
        {
          tagId: "wk1" as PowerTag["id"],
          location: { kind: "theme", themeId: t.id },
          burn: true,
        },
      ],
      statuses: [],
    });
    assert.equal(res.ok, false);
  });

  it("13. weakness self-invocation produces tagKind=weakness with -1", () => {
    const wk = weaknessTag("wk1", "Stubborn");
    const t = theme({ weaknessTag: wk });
    const c = character([t]);
    const res = resolveInvocations(c, {
      tags: [
        {
          tagId: "wk1" as PowerTag["id"],
          location: { kind: "theme", themeId: t.id },
          burn: false,
        },
      ],
      statuses: [],
    });
    if (!res.ok) throw new Error("expected ok");
    assert.equal(res.resolved.tags.length, 1);
    assert.equal(res.resolved.tags[0]?.tagKind, "weakness");
    assert.equal(res.resolved.tags[0]?.contribution, -1);
  });
});
