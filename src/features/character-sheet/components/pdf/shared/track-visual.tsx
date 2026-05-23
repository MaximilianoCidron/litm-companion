import { View } from "@react-pdf/renderer";
import { PDF_TOKENS } from "../styles/tokens";

interface TrackVisualProps {
  segments: number;
  filled: number;
}

export function TrackVisual({ segments, filled }: TrackVisualProps) {
  return (
    <View style={{ flexDirection: "row", gap: 3 }}>
      {Array.from({ length: segments }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            borderColor: PDF_TOKENS.inkMuted,
            borderWidth: 1,
            backgroundColor: i < filled ? PDF_TOKENS.inkMuted : "transparent",
          }}
        />
      ))}
    </View>
  );
}
