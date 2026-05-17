// TODO: replace with Firestore Admin SDK queries.
// Mock data only — exists so the UI renders end-to-end before the data layer lands.

import type { Character, CharacterSummary, ThemePlaceholder } from "../schemas";

const summaries: CharacterSummary[] = [
  {
    id: "char_1",
    name: "Gerrin",
    concept: "Deer stalker turned reluctant guide",
    avatarUrl: null,
    campaignName: "Hollow Pines",
    promise: 2,
  },
  {
    id: "char_2",
    name: "Higgins",
    concept: "Apprentice scribe with second sight",
    avatarUrl: null,
    campaignName: "Hollow Pines",
    promise: 0,
  },
  {
    id: "char_3",
    name: "Mara",
    concept: "Disgraced knight seeking absolution",
    avatarUrl: null,
    campaignName: "Saltmarch",
    promise: 4,
  },
];

function blankTheme(id: string, title: string, type: string): ThemePlaceholder {
  return {
    id,
    title,
    type,
    origin: "—",
    quest: "",
    powerTags: [],
    weaknessTags: [],
    abandon: 0,
    improve: 0,
    milestone: 0,
  };
}

const characters: Record<string, Character> = {
  char_1: {
    id: "char_1",
    name: "Gerrin",
    concept: "Deer stalker turned reluctant guide",
    avatarUrl: null,
    campaignName: "Hollow Pines",
    promise: 2,
    playerName: null,
    themes: [
      blankTheme("t1", "Quiet Tracker", "Origin"),
      blankTheme("t2", "Bow of Sighs", "Adventure"),
      blankTheme("t3", "The Old Pact", "Greatness"),
      blankTheme("t4", "Wolf at the Threshold", "Origin"),
    ],
  },
  char_2: {
    id: "char_2",
    name: "Higgins",
    concept: "Apprentice scribe with second sight",
    avatarUrl: null,
    campaignName: "Hollow Pines",
    promise: 0,
    playerName: null,
    themes: [
      blankTheme("t1", "Ink-Stained Apprentice", "Origin"),
      blankTheme("t2", "The Open Eye", "Greatness"),
      blankTheme("t3", "Library of Salt", "Adventure"),
      blankTheme("t4", "Whisper from the Page", "Origin"),
    ],
  },
  char_3: {
    id: "char_3",
    name: "Mara",
    concept: "Disgraced knight seeking absolution",
    avatarUrl: null,
    campaignName: "Saltmarch",
    promise: 4,
    playerName: null,
    themes: [
      blankTheme("t1", "Tarnished Oath", "Origin"),
      blankTheme("t2", "Iron Hand", "Adventure"),
      blankTheme("t3", "Penitent's Road", "Greatness"),
      blankTheme("t4", "Memory of Banners", "Origin"),
    ],
  },
};

export async function getMyCharactersStub(
  _uid: string,
): Promise<CharacterSummary[]> {
  return summaries;
}

export async function getCharacterStub(
  charId: string,
): Promise<Character | null> {
  return characters[charId] ?? null;
}
