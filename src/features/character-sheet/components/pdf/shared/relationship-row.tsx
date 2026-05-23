import { Text, View } from "@react-pdf/renderer";
import type { FellowshipRelationship } from "../../../schemas";
import { PDF_TOKENS } from "../styles/tokens";

export function RelationshipRow({
  rel,
}: {
  rel: FellowshipRelationship;
}) {
  const tone =
    rel.polarity === "helpful" ? PDF_TOKENS.moss : PDF_TOKENS.rust;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 3,
      }}
    >
      <Text style={{ fontSize: 10, color: PDF_TOKENS.inkBase, width: 120 }}>
        {rel.companionName}
      </Text>
      <Text style={{ fontSize: 9, color: PDF_TOKENS.inkSubtle }}>→</Text>
      <Text
        style={{
          fontFamily: "Spectral",
          fontStyle: "italic",
          fontSize: 10,
          color: tone,
          flex: 1,
        }}
      >
        {rel.relationshipTag}
      </Text>
    </View>
  );
}
