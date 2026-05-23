import type { NextRequest } from "next/server";
import { ActionError, getSessionUser } from "@/shared/auth";
import { requireCharacterAccess } from "@/features/character-sheet/lib/access";
import { getCharacterWithCampaign } from "@/features/character-sheet/lib/queries";
import { renderCharacterPdf } from "@/features/character-sheet/lib/pdf-generator";
import { slugify } from "@/shared/lib/slug";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ charId: string }> },
) {
  const { charId } = await params;

  let uid: string;
  try {
    const user = await getSessionUser();
    uid = user.uid;
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await requireCharacterAccess(charId, uid);
    const { character, campaign } = await getCharacterWithCampaign(
      charId,
      uid,
    );
    const buffer = await renderCharacterPdf({ character, campaign });
    const filename = `${slugify(character.identity.name || "character")}-${new Date()
      .toISOString()
      .slice(0, 10)}.pdf`;
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof ActionError) {
      const status =
        err.code === "NOT_FOUND"
          ? 404
          : err.code === "FORBIDDEN"
            ? 403
            : 400;
      return new Response(err.message, { status });
    }
    // eslint-disable-next-line no-console
    console.error("[export-pdf]", err);
    return new Response("PDF generation failed", { status: 500 });
  }
}
