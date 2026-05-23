import { Text, View } from "@react-pdf/renderer";
import type { Status } from "../../../schemas";
import { PDF_TOKENS } from "../styles/tokens";

const TIER_SLOTS = 6;

export function StatusRow({ status }: { status: Status }) {
  const fillColor =
    status.polarity === "helpful" ? PDF_TOKENS.moss : PDF_TOKENS.rust;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 3,
      }}
    >
      <Text style={{ fontSize: 10, flex: 1, color: PDF_TOKENS.inkBase }}>
        {status.name || "(unnamed)"}
      </Text>
      <View style={{ flexDirection: "row", gap: 2 }}>
        {Array.from({ length: TIER_SLOTS }).map((_, i) => (
          <View
            key={i}
            style={{
              width: 6,
              height: 8,
              backgroundColor:
                i < status.tier ? fillColor : PDF_TOKENS.mistLight,
            }}
          />
        ))}
      </View>
      <Text
        style={{
          fontSize: 8,
          color: PDF_TOKENS.inkSubtle,
          width: 14,
          textAlign: "right",
        }}
      >
        {status.tier}
      </Text>
    </View>
  );
}
