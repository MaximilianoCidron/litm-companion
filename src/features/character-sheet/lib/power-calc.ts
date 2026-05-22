import type {
  Campaign,
  Character,
  MightModifier,
  PowerTag,
  ResolvedStatusInvocation,
  ResolvedTagInvocation,
  StatusInvocationInput,
  StoryTag,
  TagInvocationInput,
  WeaknessTag,
} from "../schemas";

export type PowerBreakdownItem = {
  source: "tag" | "status" | "might";
  label: string;
  value: number;
  detail?: string;
};

export type PowerBreakdown = {
  total: number;
  items: PowerBreakdownItem[];
};

function mightLabel(m: MightModifier): string {
  if (m === 6) return "Overwhelming";
  if (m === 3) return "Favored";
  if (m === -3) return "Imperiled";
  if (m === -6) return "Outmatched";
  return "Even";
}

interface ResolvedInvocations {
  tags: ResolvedTagInvocation[];
  statuses: ResolvedStatusInvocation[];
}

type ResolveOk = { ok: true; resolved: ResolvedInvocations };
type ResolveErr = { ok: false; reason: string };

/**
 * Walk the requested invocations against live character + campaign state,
 * validate each one, and produce the *resolved* shape with snapshotted
 * names + polarities + signed contributions. Pure — no I/O.
 *
 * `campaign` is required only when fellowship invocations are present; pass
 * `null` for purely character-scoped rolls. Burning is only valid for theme
 * power tags. Fellowship weakness cannot be invoked from the roll builder.
 */
export function resolveInvocations(
  character: Character,
  campaign: Campaign | null,
  invocations: {
    tags: TagInvocationInput[];
    statuses: StatusInvocationInput[];
  },
): ResolveOk | ResolveErr {
  const tags: ResolvedTagInvocation[] = [];

  for (const inv of invocations.tags) {
    const loc = inv.location;

    if (loc.kind === "theme") {
      const theme = character.themes.find((t) => t.id === loc.themeId);
      if (!theme) {
        return { ok: false, reason: `Theme ${loc.themeId} not found.` };
      }
      const power: PowerTag | undefined = theme.powerTags.find(
        (t) => t.id === inv.tagId,
      );
      if (power) {
        if (power.burned) {
          return {
            ok: false,
            reason: `Tag "${power.name}" is already burned.`,
          };
        }
        if (power.scratched && !inv.burn) {
          return {
            ok: false,
            reason: `Tag "${power.name}" is scratched — burn it to use it.`,
          };
        }
        tags.push({
          tagId: inv.tagId,
          location: loc,
          name: power.name,
          tagKind: "power",
          polarity: "helpful",
          burned: inv.burn,
          contribution: inv.burn ? 3 : 1,
        });
        continue;
      }
      const weakness: WeaknessTag | undefined =
        theme.weaknessTag.id === inv.tagId ? theme.weaknessTag : undefined;
      if (weakness) {
        if (inv.burn) {
          return { ok: false, reason: "Weakness tags cannot be burned." };
        }
        tags.push({
          tagId: inv.tagId,
          location: loc,
          name: weakness.name,
          tagKind: "weakness",
          polarity: "hindering",
          burned: false,
          contribution: -1,
        });
        continue;
      }
      return {
        ok: false,
        reason: `Tag ${inv.tagId} not found on theme "${theme.name}".`,
      };
    }

    if (loc.kind === "backpack") {
      const story: StoryTag | undefined = character.backpack.storyTags.find(
        (t) => t.id === inv.tagId,
      );
      if (!story) {
        return {
          ok: false,
          reason: `Story tag ${inv.tagId} not found in backpack.`,
        };
      }
      if (story.scratched) {
        return { ok: false, reason: `Story tag "${story.name}" is scratched.` };
      }
      if (inv.burn) {
        return { ok: false, reason: "Story tags cannot be burned." };
      }
      tags.push({
        tagId: inv.tagId,
        location: loc,
        name: story.name,
        tagKind: "story",
        polarity: story.polarity,
        burned: false,
        contribution: story.polarity === "helpful" ? 1 : -1,
      });
      continue;
    }

    if (loc.kind === "fellowship") {
      if (inv.burn) {
        return {
          ok: false,
          reason: "Fellowship tags cannot be burned.",
        };
      }
      if (!campaign) {
        return {
          ok: false,
          reason: "Fellowship invocation requires an active campaign.",
        };
      }
      if (campaign.id !== loc.campaignId) {
        return {
          ok: false,
          reason: "Fellowship campaign mismatch.",
        };
      }
      const fellowship = campaign.fellowship;
      const fellowshipPower = fellowship.powerTags.find(
        (t) => t.id === inv.tagId,
      );
      if (fellowshipPower) {
        // TODO(camp-rest-flow): scratch fellowship power tags on invocation;
        // refresh at rest. v1 ignores per-tag exhaustion for shared resources.
        tags.push({
          tagId: inv.tagId,
          location: loc,
          name: fellowshipPower.name,
          tagKind: "power",
          polarity: "helpful",
          burned: false,
          contribution: 1,
        });
        continue;
      }
      if (fellowship.weaknessTag.id === inv.tagId) {
        return {
          ok: false,
          reason: "Fellowship weakness cannot be invoked here.",
        };
      }
      return {
        ok: false,
        reason: `Fellowship tag ${inv.tagId} not found.`,
      };
    }

    // relationship
    if (inv.burn) {
      return {
        ok: false,
        reason: "Relationship tags cannot be burned.",
      };
    }
    const rel = character.fellowship.relationships.find(
      (r) => r.id === loc.relationshipId,
    );
    if (!rel) {
      return {
        ok: false,
        reason: `Relationship ${loc.relationshipId} not found.`,
      };
    }
    tags.push({
      tagId: inv.tagId,
      location: loc,
      name: `${rel.companionName} · ${rel.relationshipTag}`,
      tagKind: "story",
      polarity: rel.polarity,
      burned: false,
      contribution: rel.polarity === "helpful" ? 1 : -1,
    });
  }

  // Statuses: max per polarity contributes signed tier; rest contribute 0.
  const statusesResolved: ResolvedStatusInvocation[] = [];
  const requested = invocations.statuses.map((s) => {
    const found = character.statuses.find((c) => c.id === s.statusId);
    return { input: s, status: found };
  });
  for (const r of requested) {
    if (!r.status) {
      return { ok: false, reason: `Status ${r.input.statusId} not found.` };
    }
  }

  const helpfulTiers = requested
    .filter((r) => r.status?.polarity === "helpful")
    .map((r) => r.status!.tier);
  const hinderingTiers = requested
    .filter((r) => r.status?.polarity === "hindering")
    .map((r) => r.status!.tier);
  const maxHelpful = helpfulTiers.length > 0 ? Math.max(...helpfulTiers) : 0;
  const maxHindering =
    hinderingTiers.length > 0 ? Math.max(...hinderingTiers) : 0;

  let helpfulCredited = false;
  let hinderingCredited = false;

  for (const r of requested) {
    const status = r.status!;
    let contribution = 0;
    if (
      status.polarity === "helpful" &&
      !helpfulCredited &&
      status.tier === maxHelpful
    ) {
      contribution = maxHelpful;
      helpfulCredited = true;
    } else if (
      status.polarity === "hindering" &&
      !hinderingCredited &&
      status.tier === maxHindering
    ) {
      contribution = -maxHindering;
      hinderingCredited = true;
    }
    statusesResolved.push({
      statusId: status.id,
      name: status.name,
      tier: status.tier as ResolvedStatusInvocation["tier"],
      polarity: status.polarity,
      contribution,
    });
  }

  return { ok: true, resolved: { tags, statuses: statusesResolved } };
}

/**
 * Compute the live Power breakdown. Assumes invocations are valid (call
 * `resolveInvocations` first to check). The breakdown items are sorted by
 * source (tag → status → might) and then by signed value descending.
 */
export function computePower(
  character: Character,
  campaign: Campaign | null,
  invocations: {
    tags: TagInvocationInput[];
    statuses: StatusInvocationInput[];
  },
  mightModifier: MightModifier,
): PowerBreakdown {
  const resolved = resolveInvocations(character, campaign, invocations);
  if (!resolved.ok) {
    return { total: 0, items: [] };
  }

  const items: PowerBreakdownItem[] = [];
  for (const t of resolved.resolved.tags) {
    items.push({
      source: "tag",
      label: t.name || "(unnamed)",
      value: t.contribution,
      detail: t.burned ? "burned" : undefined,
    });
  }
  for (const s of resolved.resolved.statuses) {
    if (s.contribution === 0) continue;
    items.push({
      source: "status",
      label: `${s.name} · ${s.tier}`,
      value: s.contribution,
      detail:
        s.polarity === "helpful" ? "highest helpful" : "highest hindering",
    });
  }
  if (mightModifier !== 0) {
    items.push({
      source: "might",
      label: mightLabel(mightModifier),
      value: mightModifier,
    });
  }

  const sourceOrder: Record<PowerBreakdownItem["source"], number> = {
    tag: 0,
    status: 1,
    might: 2,
  };
  items.sort((a, b) => {
    if (a.source !== b.source) return sourceOrder[a.source] - sourceOrder[b.source];
    return b.value - a.value;
  });

  const total = items.reduce((acc, i) => acc + i.value, 0);
  return { total, items };
}
