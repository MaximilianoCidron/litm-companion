import { StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { PDF_TOKENS } from "../styles/tokens";

const styles = StyleSheet.create({
  card: {
    backgroundColor: PDF_TOKENS.parchment,
    borderColor: PDF_TOKENS.inkMuted,
    borderWidth: 1.5,
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
  },
  leatherStrip: {
    backgroundColor: PDF_TOKENS.inkMuted,
    color: PDF_TOKENS.parchment,
    paddingVertical: 4,
    paddingHorizontal: 10,
    fontFamily: "Cinzel",
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginHorizontal: -16,
    marginTop: -16,
    marginBottom: 12,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
});

interface CardFrameProps {
  title: string;
  children: ReactNode;
}

export function CardFrame({ title, children }: CardFrameProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.leatherStrip}>{title}</Text>
      {children}
    </View>
  );
}
