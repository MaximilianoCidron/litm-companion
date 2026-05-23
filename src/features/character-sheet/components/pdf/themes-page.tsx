import { Page, StyleSheet } from "@react-pdf/renderer";
import type { Theme } from "../../schemas";
import { ThemeCardPdf } from "./theme-card-pdf";
import { PDF_TOKENS } from "./styles/tokens";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: PDF_TOKENS.parchmentSoft,
    padding: 24,
    fontFamily: "Inter",
    fontSize: 10,
    color: PDF_TOKENS.inkBase,
  },
});

export function ThemesPage({ themes }: { themes: readonly [Theme, Theme] }) {
  return (
    <Page size="A4" style={styles.page}>
      <ThemeCardPdf theme={themes[0]} />
      <ThemeCardPdf theme={themes[1]} />
    </Page>
  );
}
