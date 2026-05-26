import { Text, View } from "@react-pdf/renderer";
import type { MomentOfFulfillmentEntry } from "../../../schemas";
import { PDF_TOKENS } from "../styles/tokens";

const PATH_LABELS: Record<string, string> = {
  retire: "Retire",
  reforge: "Reforge",
  gainQuintessence: "Crystallize",
  shakeWorld: "Shake the world",
  speakWordsEternal: "Words eternal",
  unearthTruths: "Unearth truths",
};

const DATE_FMT = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function summarize(entry: MomentOfFulfillmentEntry): string {
  switch (entry.path) {
    case "retire":
      return entry.finalWords;
    case "reforge":
      return `${entry.replacedThemeName} → ${entry.newThemeName}${
        entry.narrativeDescription ? ` — ${entry.narrativeDescription}` : ""
      }`;
    case "gainQuintessence":
      return `${entry.quintessenceName}${
        entry.narrativeDescription ? ` — ${entry.narrativeDescription}` : ""
      }`;
    case "speakWordsEternal":
      return `"${entry.newPowerTagName}" → ${entry.themeName}${
        entry.narrativeDescription ? ` — ${entry.narrativeDescription}` : ""
      }`;
    case "shakeWorld":
    case "unearthTruths":
      return entry.narrativeDescription;
  }
}

export function MomentHistoryList({
  entries,
}: {
  entries: readonly MomentOfFulfillmentEntry[];
}) {
  const sorted = [...entries].sort((a, b) =>
    b.resolvedAt.localeCompare(a.resolvedAt),
  );
  return (
    <View>
      {sorted.map((e) => (
        <View
          key={e.id}
          style={{ flexDirection: "row", gap: 6, marginBottom: 3 }}
        >
          <Text
            style={{
              fontSize: 8,
              color: PDF_TOKENS.inkSubtle,
              width: 70,
            }}
          >
            {DATE_FMT.format(new Date(e.resolvedAt))}
          </Text>
          <Text
            style={{
              fontFamily: "Cinzel",
              fontSize: 9,
              color: PDF_TOKENS.ember,
              width: 90,
            }}
          >
            {PATH_LABELS[e.path] ?? e.path}
          </Text>
          <Text
            style={{
              fontFamily: "Spectral",
              fontSize: 9,
              color: PDF_TOKENS.inkMuted,
              flex: 1,
              fontStyle: "italic",
            }}
          >
            {summarize(e)}
          </Text>
        </View>
      ))}
    </View>
  );
}
