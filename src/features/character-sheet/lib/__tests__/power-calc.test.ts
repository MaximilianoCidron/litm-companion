/**
 * Power calculation tests. Run with:
 *
 *   node --test --experimental-strip-types src/features/character-sheet/lib/__tests__/power-calc.test.ts
 *
 * Uses Node's built-in test runner + assert. Zero deps.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computePower, resolveInvocations } from "../power-calc";
import type {
  Campaign,
  CampaignId,
  Character,
  FellowshipRelationship,
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
  isSingleUse = false,
): StoryTag {
  return {
    id: id as StoryTag["id"],
    name,
    polarity,
    isSingleUse,
    scratched,
    preserved: false,
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
  relationships: FellowshipRelationship[] = [],
  campaignIds: Character["campaignIds"] = [],
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
    campaignIds,
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
    progression: {
      promise: 0,
      quintessences: [],
      momentsOfFulfillment: [],
    },
    fellowship: { relationships },
    status: "active",
    avatar: null,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function buildCampaign(
  id: string,
  powerTags: PowerTag[] = [],
): Campaign {
  return {
    id: id as Campaign["id"],
    name: "Test Fellowship",
    gmUid: "gm",
    fellowship: {
      name: "Fellowship",
      quest: "",
      powerTags,
      weaknessTag: weaknessTag("fwk1", "Fractured"),
      specialImprovements: [],
      tracks: { improve: 0, milestone: 0, abandon: 0 },
    },
    roster: [],
    characterIds: [],
    playerUids: [],
    activeSessionId: null,
    activeSessionNumber: null,
    createdAt: NOW,
    updatedAt: NOW,
  };
}

describe("computePower", () => {
  it("1. empty invocations + Even Might => Power 0", () => {
    const c = character([]);
    const result = computePower(c, null, new Map(), { tags: [], statuses: [] }, 0);
    assert.equal(result.total, 0);
    assert.equal(result.items.length, 0);
  });

  it("2. single power tag invoked normally => +1", () => {
    const t = theme({ powerTags: [powerTag("p1", "Strong arm")] });
    const c = character([t]);
    const result = computePower(
      c,
      null,
      new Map(),
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
      null,
      new Map(),
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
      null,
      new Map(),
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
      null,
      new Map(),
      {
        tags: [],
        statuses: [
          { statusId: "s1" as Status["id"], location: { kind: "character" } },
          { statusId: "s2" as Status["id"], location: { kind: "character" } },
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
      null,
      new Map(),
      {
        tags: [],
        statuses: [
          { statusId: "s1" as Status["id"], location: { kind: "character" } },
          { statusId: "s2" as Status["id"], location: { kind: "character" } },
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
      null,
      new Map(),
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
    const result = computePower(c, null, new Map(), { tags: [], statuses: [] }, 3);
    assert.equal(result.total, 3);
    assert.equal(result.items.length, 1);
    assert.equal(result.items[0]?.label, "Favored");
  });

  it("9. mixed: power tag + helpful status + Favored", () => {
    const t = theme({ powerTags: [powerTag("p1", "Sharp eye")] });
    const c = character([t], [], [status("s1", "Confident", 3, "helpful")]);
    const result = computePower(
      c,
      null,
      new Map(),
      {
        tags: [
          {
            tagId: "p1" as PowerTag["id"],
            location: { kind: "theme", themeId: t.id },
            burn: false,
          },
        ],
        statuses: [
          { statusId: "s1" as Status["id"], location: { kind: "character" } },
        ],
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
    const res = resolveInvocations(c, null, new Map(), {
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
    const res = resolveInvocations(c, null, new Map(), {
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
    const res = resolveInvocations(c, null, new Map(), {
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
    const res = resolveInvocations(c, null, new Map(), {
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

  it("14. fellowship power tag contributes +1", () => {
    const camp = buildCampaign("camp-1", [powerTag("fp1", "Bonded oath")]);
    const c = character([], [], [], [], [camp.id]);
    const result = computePower(
      c,
      camp,
      new Map(),
      {
        tags: [
          {
            tagId: "fp1" as PowerTag["id"],
            location: { kind: "fellowship", campaignId: camp.id },
            burn: false,
          },
        ],
        statuses: [],
      },
      0,
    );
    assert.equal(result.total, 1);
  });

  it("15. fellowship invocation without campaign rejected", () => {
    const c = character([]);
    const res = resolveInvocations(c, null, new Map(), {
      tags: [
        {
          tagId: "fp1" as PowerTag["id"],
          location: {
            kind: "fellowship",
            campaignId: "camp-x" as Campaign["id"],
          },
          burn: false,
        },
      ],
      statuses: [],
    });
    assert.equal(res.ok, false);
  });

  it("16. fellowship weakness cannot be invoked", () => {
    const camp = buildCampaign("camp-2");
    const c = character([], [], [], [], [camp.id]);
    const res = resolveInvocations(c, camp, new Map(), {
      tags: [
        {
          tagId: "fwk1" as PowerTag["id"],
          location: { kind: "fellowship", campaignId: camp.id },
          burn: false,
        },
      ],
      statuses: [],
    });
    assert.equal(res.ok, false);
  });

  it("17. helpful relationship contributes +1", () => {
    const rel: FellowshipRelationship = {
      id: "rel-1" as FellowshipRelationship["id"],
      companionCharId: null,
      companionName: "Sara",
      relationshipTag: "sworn-friend",
      polarity: "helpful",
    };
    const c = character([], [], [], [rel]);
    const result = computePower(
      c,
      null,
      new Map(),
      {
        tags: [
          {
            tagId: "rel-1" as PowerTag["id"],
            location: { kind: "relationship", relationshipId: rel.id },
            burn: false,
          },
        ],
        statuses: [],
      },
      0,
    );
    assert.equal(result.total, 1);
  });

  it("18. hindering relationship contributes -1", () => {
    const rel: FellowshipRelationship = {
      id: "rel-2" as FellowshipRelationship["id"],
      companionCharId: null,
      companionName: "Mira",
      relationshipTag: "indebted",
      polarity: "hindering",
    };
    const c = character([], [], [], [rel]);
    const result = computePower(
      c,
      null,
      new Map(),
      {
        tags: [
          {
            tagId: "rel-2" as PowerTag["id"],
            location: { kind: "relationship", relationshipId: rel.id },
            burn: false,
          },
        ],
        statuses: [],
      },
      0,
    );
    assert.equal(result.total, -1);
  });

  it("19. burning fellowship tag rejected", () => {
    const camp = buildCampaign("camp-3", [powerTag("fp1", "Banner")]);
    const c = character([], [], [], [], [camp.id]);
    const res = resolveInvocations(c, camp, new Map(), {
      tags: [
        {
          tagId: "fp1" as PowerTag["id"],
          location: { kind: "fellowship", campaignId: camp.id },
          burn: true,
        },
      ],
      statuses: [],
    });
    assert.equal(res.ok, false);
  });

  it("20a. resolveInvocations rejects scratched fellowship power tag", () => {
    const camp = buildCampaign("camp-scratched", [
      powerTag("fp1", "Exhausted", { scratched: true }),
    ]);
    const c = character([], [], [], [], [camp.id]);
    const res = resolveInvocations(c, camp, new Map(), {
      tags: [
        {
          tagId: "fp1" as PowerTag["id"],
          location: { kind: "fellowship", campaignId: camp.id },
          burn: false,
        },
      ],
      statuses: [],
    });
    assert.equal(res.ok, false);
    if (!res.ok) {
      assert.match(res.reason, /exhausted/i);
      assert.match(res.reason, /Exhausted/);
    }
  });

  it("20b. fresh fellowship power tag (scratched=false) is accepted", () => {
    const camp = buildCampaign("camp-fresh", [
      powerTag("fp1", "Ready", { scratched: false }),
    ]);
    const c = character([], [], [], [], [camp.id]);
    const res = resolveInvocations(c, camp, new Map(), {
      tags: [
        {
          tagId: "fp1" as PowerTag["id"],
          location: { kind: "fellowship", campaignId: camp.id },
          burn: false,
        },
      ],
      statuses: [],
    });
    assert.equal(res.ok, true);
  });

  it("20. combined: theme power + fellowship power + helpful relationship + Favored", () => {
    const camp = buildCampaign("camp-4", [powerTag("fp1", "Banner")]);
    const t = theme({ powerTags: [powerTag("p1", "Quick")] });
    const rel: FellowshipRelationship = {
      id: "rel-3" as FellowshipRelationship["id"],
      companionCharId: null,
      companionName: "Jin",
      relationshipTag: "trusted",
      polarity: "helpful",
    };
    const c = character([t], [], [], [rel], [camp.id]);
    const result = computePower(
      c,
      camp,
      new Map(),
      {
        tags: [
          {
            tagId: "p1" as PowerTag["id"],
            location: { kind: "theme", themeId: t.id },
            burn: false,
          },
          {
            tagId: "fp1" as PowerTag["id"],
            location: { kind: "fellowship", campaignId: camp.id },
            burn: false,
          },
          {
            tagId: "rel-3" as PowerTag["id"],
            location: { kind: "relationship", relationshipId: rel.id },
            burn: false,
          },
        ],
        statuses: [],
      },
      3,
    );
    assert.equal(result.total, 1 + 1 + 1 + 3);
  });

  // ---- Challenge invocations (prompt 14) ----

  it("21. challenge invocation rejected when challenge not engaged", () => {
    const c = character([], [], [], [], ["camp-eng" as CampaignId]);
    const res = resolveInvocations(c, null, new Map(), {
      tags: [
        {
          tagId: "ctag1" as PowerTag["id"],
          location: {
            kind: "challenge",
            campaignId: "camp-eng" as CampaignId,
            challengeId: "ch-missing" as never,
          },
          burn: false,
        },
      ],
      statuses: [],
    });
    assert.equal(res.ok, false);
    if (!res.ok) assert.match(res.reason, /no longer engaged/i);
  });

  it("22. challenge invocation rejected when tag scratched", () => {
    const challengeId = "ch-1" as never;
    const tagId = "ctag1" as PowerTag["id"];
    const engaged = new Map([
      [
        challengeId as unknown as string,
        {
          id: challengeId,
          campaignId: "camp-eng" as CampaignId,
          name: "Bandit Chief",
          tags: [
            { id: tagId, name: "Worn", polarity: "hindering" as const, scratched: true },
          ],
          statuses: [],
          limits: [],
          updatedAt: NOW,
        },
      ],
    ]);
    const c = character([], [], [], [], ["camp-eng" as CampaignId]);
    const res = resolveInvocations(c, null, engaged, {
      tags: [
        {
          tagId,
          location: {
            kind: "challenge",
            campaignId: "camp-eng" as CampaignId,
            challengeId,
          },
          burn: false,
        },
      ],
      statuses: [],
    });
    assert.equal(res.ok, false);
    if (!res.ok) assert.match(res.reason, /exhausted/i);
  });

  it("23. helpful challenge tag contributes +1", () => {
    const challengeId = "ch-1" as never;
    const tagId = "ctag1" as PowerTag["id"];
    const engaged = new Map([
      [
        challengeId as unknown as string,
        {
          id: challengeId,
          campaignId: "camp-eng" as CampaignId,
          name: "Friendly Beast",
          tags: [
            { id: tagId, name: "Loyal", polarity: "helpful" as const, scratched: false },
          ],
          statuses: [],
          limits: [],
          updatedAt: NOW,
        },
      ],
    ]);
    const c = character([], [], [], [], ["camp-eng" as CampaignId]);
    const result = computePower(c, null, engaged, {
      tags: [
        {
          tagId,
          location: {
            kind: "challenge",
            campaignId: "camp-eng" as CampaignId,
            challengeId,
          },
          burn: false,
        },
      ],
      statuses: [],
    }, 0);
    assert.equal(result.total, 1);
  });

  it("24. hindering challenge tag contributes -1", () => {
    const challengeId = "ch-1" as never;
    const tagId = "ctag1" as PowerTag["id"];
    const engaged = new Map([
      [
        challengeId as unknown as string,
        {
          id: challengeId,
          campaignId: "camp-eng" as CampaignId,
          name: "Bandit Chief",
          tags: [
            { id: tagId, name: "Brutish", polarity: "hindering" as const, scratched: false },
          ],
          statuses: [],
          limits: [],
          updatedAt: NOW,
        },
      ],
    ]);
    const c = character([], [], [], [], ["camp-eng" as CampaignId]);
    const result = computePower(c, null, engaged, {
      tags: [
        {
          tagId,
          location: {
            kind: "challenge",
            campaignId: "camp-eng" as CampaignId,
            challengeId,
          },
          burn: false,
        },
      ],
      statuses: [],
    }, 0);
    assert.equal(result.total, -1);
  });

  // ---- Challenge status invocations (prompt 19) ----

  it("25. challenge helpful status contributes signed tier", () => {
    const challengeId = "ch-1" as never;
    const statusId = "cs1" as Status["id"];
    const engaged = new Map([
      [
        challengeId as unknown as string,
        {
          id: challengeId,
          campaignId: "camp-eng" as CampaignId,
          name: "Wise Sage",
          tags: [],
          statuses: [status(statusId, "Insightful", 3, "helpful")],
          limits: [],
          updatedAt: NOW,
        },
      ],
    ]);
    const c = character([], [], [], [], ["camp-eng" as CampaignId]);
    const result = computePower(
      c,
      null,
      engaged,
      {
        tags: [],
        statuses: [
          {
            statusId,
            location: {
              kind: "challenge",
              campaignId: "camp-eng" as CampaignId,
              challengeId,
            },
          },
        ],
      },
      0,
    );
    assert.equal(result.total, 3);
  });

  it("26. challenge hindering status contributes negative signed tier", () => {
    const challengeId = "ch-1" as never;
    const statusId = "cs1" as Status["id"];
    const engaged = new Map([
      [
        challengeId as unknown as string,
        {
          id: challengeId,
          campaignId: "camp-eng" as CampaignId,
          name: "Storm Wall",
          tags: [],
          statuses: [status(statusId, "Battered", 2, "hindering")],
          limits: [],
          updatedAt: NOW,
        },
      ],
    ]);
    const c = character([], [], [], [], ["camp-eng" as CampaignId]);
    const result = computePower(
      c,
      null,
      engaged,
      {
        tags: [],
        statuses: [
          {
            statusId,
            location: {
              kind: "challenge",
              campaignId: "camp-eng" as CampaignId,
              challengeId,
            },
          },
        ],
      },
      0,
    );
    assert.equal(result.total, -2);
  });

  it("27. challenge status invocation rejected when challenge not engaged", () => {
    const c = character([], [], [], [], ["camp-eng" as CampaignId]);
    const res = resolveInvocations(c, null, new Map(), {
      tags: [],
      statuses: [
        {
          statusId: "cs1" as Status["id"],
          location: {
            kind: "challenge",
            campaignId: "camp-eng" as CampaignId,
            challengeId: "ch-missing" as never,
          },
        },
      ],
    });
    assert.equal(res.ok, false);
  });

  it("28. character + challenge statuses pool by polarity — only highest of each side counts", () => {
    const challengeId = "ch-1" as never;
    const challengeStatusId = "cs1" as Status["id"];
    const engaged = new Map([
      [
        challengeId as unknown as string,
        {
          id: challengeId,
          campaignId: "camp-eng" as CampaignId,
          name: "Shadow",
          tags: [],
          statuses: [status(challengeStatusId, "Looming", 4, "hindering")],
          limits: [],
          updatedAt: NOW,
        },
      ],
    ]);
    const c = character(
      [],
      [],
      [
        status("s1", "Inspired", 2, "helpful"),
        status("s2", "Confident", 3, "helpful"),
        status("s3", "Sleepy", 1, "hindering"),
      ],
      [],
      ["camp-eng" as CampaignId],
    );
    const result = computePower(
      c,
      null,
      engaged,
      {
        tags: [],
        statuses: [
          { statusId: "s1" as Status["id"], location: { kind: "character" } },
          { statusId: "s2" as Status["id"], location: { kind: "character" } },
          { statusId: "s3" as Status["id"], location: { kind: "character" } },
          {
            statusId: challengeStatusId,
            location: {
              kind: "challenge",
              campaignId: "camp-eng" as CampaignId,
              challengeId,
            },
          },
        ],
      },
      0,
    );
    // Pool: helpful max = 3 (s2). Hindering max tier = 4 (challenge "Looming").
    // Net = 3 + (-4) = -1.
    assert.equal(result.total, -1);
  });
});
