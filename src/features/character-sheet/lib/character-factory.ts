import {
  CharacterId,
  CampaignId,
  TagId,
  ThemeId,
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

const DEFAULT_THEME_TYPE: ThemeType = "origin:trait";

function blankTheme(): Theme {
  return {
    id: ThemeId.parse(crypto.randomUUID()),
    type: DEFAULT_THEME_TYPE,
    mightLevel: "origin",
    name: "",
    quest: "",
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
    themes: [blankTheme(), blankTheme(), blankTheme(), blankTheme()],
    statuses: [],
    backpack: { storyTags: [], notes: "" },
    progression: { promise: 0, quintessences: [] },
    fellowship: { relationships: [] },
  };
}
