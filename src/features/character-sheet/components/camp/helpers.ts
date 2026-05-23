import type { Character } from "../../schemas";

export type CampActivity = "rest" | "reflect" | "campAction";

export interface CampForecast {
  powerTagsRefreshed: number;
  hinderingStatusesCleared: number;
  storyTagsDiscarded: number;
  improveThemeName: string | null;
}

export function forecastCamp(
  character: Character,
  activity: CampActivity,
  reflectThemeId: string | null,
): CampForecast {
  const powerTagsRefreshed = character.themes.reduce((acc, t) => {
    return acc + t.powerTags.filter((p) => p.scratched && !p.burned).length;
  }, 0);

  const storyTagsDiscarded = character.backpack.storyTags.filter(
    (t) => !t.preserved,
  ).length;

  const hinderingStatusesCleared =
    activity === "rest"
      ? character.statuses.filter((s) => s.polarity === "hindering").length
      : 0;

  let improveThemeName: string | null = null;
  if (activity === "reflect" && reflectThemeId) {
    const theme = character.themes.find((t) => t.id === reflectThemeId);
    if (theme) improveThemeName = theme.name || "this theme";
  }

  return {
    powerTagsRefreshed,
    hinderingStatusesCleared,
    storyTagsDiscarded,
    improveThemeName,
  };
}

export function buildCampSummaryToast(summary: {
  powerTagsRefreshed: number;
  storyTagsDiscarded: number;
  statusesCleared: number;
  improveMarkedOnThemeId: string | null;
}): string {
  const parts: string[] = [];
  if (summary.powerTagsRefreshed > 0) {
    parts.push(
      `${summary.powerTagsRefreshed} tag${summary.powerTagsRefreshed === 1 ? "" : "s"} refreshed`,
    );
  }
  if (summary.statusesCleared > 0) {
    parts.push(
      `${summary.statusesCleared} status${summary.statusesCleared === 1 ? "" : "es"} cleared`,
    );
  }
  if (summary.storyTagsDiscarded > 0) {
    parts.push(
      `${summary.storyTagsDiscarded} story tag${summary.storyTagsDiscarded === 1 ? "" : "s"} discarded`,
    );
  }
  if (summary.improveMarkedOnThemeId) {
    parts.push("+1 Improve marked");
  }
  return parts.length > 0 ? parts.join(" · ") : "Nothing to clean up";
}
