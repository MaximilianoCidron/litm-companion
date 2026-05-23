import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import type { Campaign, Character } from "../schemas";
import { CharacterPdf } from "../components/pdf/character-pdf";
import "../components/pdf/font-registry";

/**
 * Server-only PDF generator. Returns a Node Buffer suitable for direct use
 * as a Response body. Font registration happens once per module load via
 * the side-effect import above; @react-pdf reads them when the doc renders.
 */
export async function renderCharacterPdf({
  character,
  campaign,
}: {
  character: Character;
  campaign: Campaign | null;
}): Promise<Buffer> {
  return renderToBuffer(
    <CharacterPdf character={character} campaign={campaign} />,
  );
}
