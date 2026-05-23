import { Text, View } from "@react-pdf/renderer";
import { PDF_TOKENS } from "../styles/tokens";

type Variant = "power" | "weakness" | "helpful" | "hindering" | "neutral";

interface TagPillPdfProps {
  name: string;
  variant: Variant;
  scratched?: boolean;
  burned?: boolean;
}

function paletteFor(variant: Variant) {
  switch (variant) {
    case "power":
    case "helpful":
      return { bg: PDF_TOKENS.tagPowerSoft, text: PDF_TOKENS.tagPower };
    case "weakness":
    case "hindering":
      return { bg: PDF_TOKENS.tagWeaknessSoft, text: PDF_TOKENS.tagWeakness };
    default:
      return { bg: PDF_TOKENS.mistLight, text: PDF_TOKENS.inkBase };
  }
}

export function TagPillPdf({
  name,
  variant,
  scratched = false,
  burned = false,
}: TagPillPdfProps) {
  const { bg, text } = paletteFor(variant);
  return (
    <View
      style={{
        backgroundColor: bg,
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 3,
        marginRight: 4,
        marginBottom: 4,
      }}
    >
      <Text
        style={{
          fontSize: 9,
          color: text,
          textDecoration: scratched ? "line-through" : "none",
          opacity: scratched ? 0.6 : 1,
        }}
      >
        {name || "(unnamed)"}
        {burned ? " [burned]" : ""}
      </Text>
    </View>
  );
}
