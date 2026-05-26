/**
 * Inbox builder + unread-count tests. Run with:
 *
 *   node --test --experimental-strip-types src/features/character-sheet/lib/__tests__/inbox.test.ts
 *
 * Uses Node's built-in test runner + assert. Zero deps.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildInboxItems,
  countUnread,
  type AllocationForMe,
  type InboxItem,
  type ThreatForMe,
} from "../inbox";
import type { Invitation } from "../../schemas/invitation";
import type { PendingThreat } from "../../schemas/pending-threat";
import type {
  CampaignId,
  CharacterId,
  ChallengeId,
  InvitationId,
  PendingThreatId,
  ThreatId,
} from "../../schemas/ids";

const CAMPAIGN = "camp-1" as CampaignId;
const CHAR = "char-1" as CharacterId;

function mkInvitation(overrides: Partial<Invitation> = {}): Invitation {
  return {
    kind: "directed",
    id: ((overrides as { id?: InvitationId }).id ?? "inv-1") as InvitationId,
    campaignId: CAMPAIGN,
    campaignName: "The Long Road",
    invitedByUid: "gm-1",
    invitedByName: "Brena",
    status: "open",
    consumedByUid: null,
    consumedAt: null,
    createdAt: "2026-05-20T10:00:00.000Z",
    expiresAt: "2026-05-27T10:00:00.000Z",
    directedAtUid: "me",
    directedAtEmail: "me@example.com",
    directedAtName: null,
    ...(overrides as Partial<Extract<Invitation, { kind: "directed" }>>),
  };
}

function mkThreat(overrides: Partial<PendingThreat> = {}): PendingThreat {
  return {
    id: ("pt-1" as PendingThreatId),
    campaignId: CAMPAIGN,
    initiatedByUid: "gm-1",
    challengeId: "ch-1" as ChallengeId,
    threatId: "thr-1" as ThreatId,
    targetCharacterId: CHAR,
    targetCharacterName: "Brena",
    targetUid: "me",
    consequence: {
      kind: "applyStatus",
      statusName: "Wounded",
      tier: 2,
      polarity: "hindering",
    },
    status: "awaitingReaction",
    reactionRollId: null,
    reactionPower: null,
    resolution: { kind: "pending" },
    createdAt: "2026-05-22T10:00:00.000Z",
    resolvedAt: null,
    ...overrides,
  };
}

describe("buildInboxItems", () => {
  it("returns empty list when all sources are empty", () => {
    const out = buildInboxItems({
      invitations: [],
      threatsForMe: [],
      allocationsForMe: [],
    });
    assert.equal(out.length, 0);
  });

  it("builds an invitation item with campaign name in description", () => {
    const inv = mkInvitation();
    const [item] = buildInboxItems({
      invitations: [inv],
      threatsForMe: [],
      allocationsForMe: [],
    });
    assert.equal(item?.kind, "invitation");
    assert.equal(item?.id, "invitation:inv-1");
    assert.equal(item?.title, "Invitation from Brena");
    assert.equal(item?.description, "The Long Road");
    assert.equal(item?.href, "/invite/inv-1");
  });

  it("falls back to 'your GM' for empty invitedByName", () => {
    const inv = mkInvitation({ invitedByName: "" });
    const [item] = buildInboxItems({
      invitations: [inv],
      threatsForMe: [],
      allocationsForMe: [],
    });
    assert.equal(item?.title, "Invitation from your GM");
  });

  it("builds a pending-threat item with character name + consequence", () => {
    const threat = mkThreat();
    const tfm: ThreatForMe = { threat, campaignId: CAMPAIGN };
    const [item] = buildInboxItems({
      invitations: [],
      threatsForMe: [tfm],
      allocationsForMe: [],
    });
    assert.equal(item?.kind, "pending-threat");
    assert.equal(item?.id, "pending-threat:pt-1");
    assert.equal(item?.title, "Threat awaiting reaction");
    assert.equal(item?.description, "Brena · Wounded 2 (hindering)");
    assert.equal(item?.href, `/characters/${CHAR}/hero`);
  });

  it("builds a pending-allocation item with character + campaign name", () => {
    const threat = mkThreat({ status: "reactionRolled" });
    const afm: AllocationForMe = {
      threat,
      campaignId: CAMPAIGN,
      campaignName: "The Long Road",
    };
    const [item] = buildInboxItems({
      invitations: [],
      threatsForMe: [],
      allocationsForMe: [afm],
    });
    assert.equal(item?.kind, "pending-allocation");
    assert.equal(item?.title, "Reaction to resolve");
    assert.equal(item?.description, "Brena · The Long Road");
    assert.equal(item?.href, `/campaigns/${CAMPAIGN}`);
  });

  it("truncates long consequence descriptions in the threat row", () => {
    const longName = "X".repeat(80);
    const threat = mkThreat({
      consequence: {
        kind: "scratchTag",
        location: { kind: "backpack" },
        tagId: "tag-x" as PendingThreat["consequence"] extends {
          tagId: infer T;
        }
          ? T
          : never,
        tagName: longName,
      },
    });
    const tfm: ThreatForMe = { threat, campaignId: CAMPAIGN };
    const [item] = buildInboxItems({
      invitations: [],
      threatsForMe: [tfm],
      allocationsForMe: [],
    });
    assert.ok(item);
    // Format: "<charName> · Scratch <truncated 60>"
    // The truncate budget applies to the consequence string only.
    const dotIdx = item.description.indexOf("·");
    assert.ok(dotIdx > 0);
    const after = item.description.slice(dotIdx + 1).trim();
    assert.equal(after.endsWith("…"), true);
    assert.ok(after.length <= 60);
  });

  it("sorts items newest first across all kinds", () => {
    const inv = mkInvitation({
      id: "inv-old" as InvitationId,
      createdAt: "2026-05-10T00:00:00.000Z",
    });
    const newThreat: ThreatForMe = {
      threat: mkThreat({
        id: "pt-new" as PendingThreatId,
        createdAt: "2026-05-23T00:00:00.000Z",
      }),
      campaignId: CAMPAIGN,
    };
    const midAlloc: AllocationForMe = {
      threat: mkThreat({
        id: "pt-mid" as PendingThreatId,
        createdAt: "2026-05-15T00:00:00.000Z",
        status: "reactionRolled",
      }),
      campaignId: CAMPAIGN,
      campaignName: "Road",
    };
    const items = buildInboxItems({
      invitations: [inv],
      threatsForMe: [newThreat],
      allocationsForMe: [midAlloc],
    });
    assert.deepEqual(
      items.map((i) => i.id),
      [
        "pending-threat:pt-new",
        "pending-allocation:pt-mid",
        "invitation:inv-old",
      ],
    );
  });
});

describe("countUnread", () => {
  function mkItem(id: string, createdAt: string): InboxItem {
    return {
      id,
      kind: "invitation",
      createdAt,
      title: "",
      description: "",
      href: "/",
    };
  }

  it("returns total length when lastOpenedAt is null", () => {
    const items = [
      mkItem("a", "2026-05-01T00:00:00.000Z"),
      mkItem("b", "2026-05-02T00:00:00.000Z"),
    ];
    assert.equal(countUnread(items, null), 2);
  });

  it("returns 0 when all items are older than lastOpenedAt", () => {
    const items = [
      mkItem("a", "2026-05-01T00:00:00.000Z"),
      mkItem("b", "2026-05-02T00:00:00.000Z"),
    ];
    assert.equal(countUnread(items, "2026-05-10T00:00:00.000Z"), 0);
  });

  it("counts items strictly newer than lastOpenedAt", () => {
    const items = [
      mkItem("old", "2026-05-01T00:00:00.000Z"),
      mkItem("same", "2026-05-10T00:00:00.000Z"),
      mkItem("new", "2026-05-20T00:00:00.000Z"),
    ];
    // `same` does NOT count (strict greater-than).
    assert.equal(countUnread(items, "2026-05-10T00:00:00.000Z"), 1);
  });
});
