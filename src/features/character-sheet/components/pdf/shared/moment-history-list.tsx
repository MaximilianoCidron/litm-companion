import { Text, View } from "@react-pdf/renderer";
import type { MomentOfFulfillmentEntry } from "../../../schemas";
import { PDF_TOKENS } from "../styles/tokens";

const PATH_LABELS: Record<string, string> = {
  retire: "Retire",
  reforge: "Reforge",
  gainQuintessence: "Quintessence",
  shakeWorld: "Shake the world",
  speakWordsEternal: "Words eternal",
  unearthTruths: "Unearth truths",
};

const DATE_FMT = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function MomentHistoryList({
  entries,
}: {
  entries: readonly MomentOfFulfillmentEntry[];
}) {
  const sorted = [...entries].sort((a, b) =>
    b.completedAt.localeCompare(a.completedAt),
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
            {DATE_FMT.format(new Date(e.completedAt))}
          </Text>
          <Text
            style={{
              fontFamily: "Cinzel",
              fontSize: 9,
              color: PDF_TOKENS.ember,
              width: 90,
            }}
          >
            {PATH_LABELS[e.chosenPath] ?? e.chosenPath}
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
            {e.description || ""}
          </Text>
        </View>
      ))}
    </View>
  );
}
