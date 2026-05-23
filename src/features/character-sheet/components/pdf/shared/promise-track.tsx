import { View } from "@react-pdf/renderer";
import { PDF_TOKENS } from "../styles/tokens";

const SLOTS = 5;

export function PromiseTrack({ value }: { value: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {Array.from({ length: SLOTS }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            borderColor: PDF_TOKENS.ember,
            borderWidth: 1.5,
            backgroundColor: i < value ? PDF_TOKENS.ember : "transparent",
          }}
        />
      ))}
    </View>
  );
}
