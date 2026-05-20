import {
  CharacterId,
  CampaignId,
  TagId,
  ThemeId,
  inferMightLevel,
  type Character,
  type Theme,
  type ThemeType,
} from "../schemas";

interface BuildBlankCharacterInput {
  id: string;
  userId: string;
  name: string;
  concept?: string;
  campaignIds?: string[];
}

interface BuildBlankThemeInput {
  type?: ThemeType;
  name?: string;
  quest?: string;
}

const DEFAULT_THEME_TYPE: ThemeType = "origin:trait";

export function buildBlankTheme(input: BuildBlankThemeInput = {}): Theme {
  const type = input.type ?? DEFAULT_THEME_TYPE;
  return {
    id: ThemeId.parse(crypto.randomUUID()),
    type,
    mightLevel: inferMightLevel(type),
    name: input.name ?? "",
    quest: input.quest ?? "",
    powerTags: [],
    weaknessTag: {
      id: TagId.parse(crypto.randomUUID()),
      name: "",
    },
    specialImprovements: [],
    tracks: { improve: 0, milestone: 0, abandon: 0 },
  };
}

/**
 * Build a brand-new character object ready for Firestore. Caller layers in
 * createdAt/updatedAt (server timestamps) before persistence.
 */
export function buildBlankCharacter(
  input: BuildBlankCharacterInput,
): Omit<Character, "createdAt" | "updatedAt"> {
  return {
    id: CharacterId.parse(input.id),
    userId: input.userId,
    campaignIds: (input.campaignIds ?? []).map((c) => CampaignId.parse(c)),
    identity: {
      name: input.name,
      concept: input.concept ?? "",
      playerName: "",
      pronouns: "",
      avatarUrl: null,
      legendMistBalance: 0,
    },
    themes: [
      buildBlankTheme(),
      buildBlankTheme(),
      buildBlankTheme(),
      buildBlankTheme(),
    ],
    statuses: [],
    backpack: { storyTags: [], notes: "" },
    progression: { promise: 0, quintessences: [] },
    fellowship: { relationships: [] },
  };
}
