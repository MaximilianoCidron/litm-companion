import { Document } from "@react-pdf/renderer";
import type { Campaign, Character } from "../../schemas";
import { FellowshipPage } from "./fellowship-page";
import { HeroPage } from "./hero-page";
import { ThemesPage } from "./themes-page";

interface CharacterPdfProps {
  character: Character;
  campaign: Campaign | null;
}

export function CharacterPdf({ character, campaign }: CharacterPdfProps) {
  const [t0, t1, t2, t3] = character.themes;
  return (
    <Document
      title={`${character.identity.name || "Character"} — sheet`}
      author="Codex"
      creator="Codex"
      producer="Codex (@react-pdf)"
    >
      <HeroPage character={character} />
      <ThemesPage themes={[t0, t1]} />
      <ThemesPage themes={[t2, t3]} />
      {campaign ? (
        <FellowshipPage
          fellowship={campaign.fellowship}
          relationships={character.fellowship.relationships}
        />
      ) : null}
    </Document>
  );
}
