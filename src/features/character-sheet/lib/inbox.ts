import type { CampaignId } from "../schemas/ids";
import type { Invitation } from "../schemas/invitation";
import type { PendingThreat } from "../schemas/pending-threat";

export type InboxItemKind =
  | "invitation"
  | "pending-threat"
  | "pending-allocation";

export interface InboxItem {
  /** Unique within an inbox snapshot — `${kind}:${sourceId}`. */
  id: string;
  kind: InboxItemKind;
  /** ISO timestamp driving sort order and unread tracking. */
  createdAt: string;
  title: string;
  description: string;
  href: string;
}

export interface ThreatForMe {
  threat: PendingThreat;
  campaignId: CampaignId;
}

export interface AllocationForMe {
  threat: PendingThreat;
  campaignId: CampaignId;
  campaignName: string;
}

export interface InboxSources {
  invitations: readonly Invitation[];
  threatsForMe: readonly ThreatForMe[];
  allocationsForMe: readonly AllocationForMe[];
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + "…";
}

function describeConsequence(threat: PendingThreat): string {
  const c = threat.consequence;
  if (c.kind === "applyStatus") {
    return `${c.statusName} ${c.tier} (${c.polarity})`;
  }
  return `Scratch ${c.tagName}`;
}

export function buildInboxItems(sources: InboxSources): InboxItem[] {
  const items: InboxItem[] = [];

  for (const inv of sources.invitations) {
    const inviter = inv.invitedByName.trim() || "your GM";
    items.push({
      id: `invitation:${inv.id}`,
      kind: "invitation",
      createdAt: inv.createdAt,
      title: `Invitation from ${inviter}`,
      description: inv.campaignName,
      // The invitation doc id IS the token — `/invite/[token]` reads it.
      href: `/invite/${inv.id}`,
    });
  }

  for (const t of sources.threatsForMe) {
    items.push({
      id: `pending-threat:${t.threat.id}`,
      kind: "pending-threat",
      createdAt: t.threat.createdAt,
      title: "Threat awaiting reaction",
      description: `${t.threat.targetCharacterName} · ${truncate(
        describeConsequence(t.threat),
        60,
      )}`,
      href: `/characters/${t.threat.targetCharacterId}/hero`,
    });
  }

  for (const a of sources.allocationsForMe) {
    items.push({
      id: `pending-allocation:${a.threat.id}`,
      kind: "pending-allocation",
      createdAt: a.threat.createdAt,
      title: "Reaction to resolve",
      description: `${a.threat.targetCharacterName} · ${a.campaignName}`,
      href: `/campaigns/${a.campaignId}`,
    });
  }

  items.sort((x, y) =>
    x.createdAt < y.createdAt ? 1 : x.createdAt > y.createdAt ? -1 : 0,
  );
  return items;
}

export function countUnread(
  items: readonly InboxItem[],
  lastOpenedAt: string | null,
): number {
  if (lastOpenedAt === null) return items.length;
  let n = 0;
  for (const item of items) {
    if (item.createdAt > lastOpenedAt) n++;
  }
  return n;
}
