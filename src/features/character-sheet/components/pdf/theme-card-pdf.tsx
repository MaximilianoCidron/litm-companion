import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { formatThemeType, type Theme } from "../../schemas";
import { CardFrame } from "./shared/card-frame";
import { TagPillPdf } from "./shared/tag-pill-pdf";
import { TrackVisual } from "./shared/track-visual";
import { PDF_TOKENS } from "./styles/tokens";

const styles = StyleSheet.create({
  themeName: {
    fontFamily: "Cinzel",
    fontSize: 14,
    color: PDF_TOKENS.inkBase,
  },
  typeChip: {
    fontFamily: "Cinzel",
    fontSize: 8,
    color: PDF_TOKENS.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 2,
  },
  quest: {
    fontFamily: "Spectral",
    fontStyle: "italic",
    fontSize: 10,
    color: PDF_TOKENS.inkMuted,
    marginTop: 4,
    marginBottom: 8,
  },
  sectionLabel: {
    fontFamily: "Cinzel",
    fontSize: 8,
    color: PDF_TOKENS.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 4,
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 3,
  },
  trackLabel: {
    fontFamily: "Cinzel",
    fontSize: 8,
    color: PDF_TOKENS.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    width: 60,
  },
  improvementBullet: {
    fontFamily: "Spectral",
    fontSize: 9,
    color: PDF_TOKENS.inkBase,
    marginBottom: 2,
  },
});

export function ThemeCardPdf({ theme }: { theme: Theme }) {
  const meta = formatThemeType(theme.type);
  const hasPowerTags = theme.powerTags.length > 0;
  const hasWeakness = theme.weaknessTag.name.trim().length > 0;
  const hasImprovements = theme.specialImprovements.length > 0;
  const hasQuest = theme.quest.trim().length > 0;

  return (
    <CardFrame title="Theme">
      <Text style={styles.themeName}>{theme.name || "Untitled theme"}</Text>
      <Text style={styles.typeChip}>
        {meta.mightLabel} · {meta.label}
      </Text>
      {hasQuest ? <Text style={styles.quest}>{theme.quest}</Text> : null}

      {hasPowerTags ? (
        <>
          <Text style={styles.sectionLabel}>Power tags</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            {theme.powerTags.map((tag) => (
              <TagPillPdf
                key={tag.id}
                name={tag.name}
                variant="power"
                scratched={tag.scratched}
                burned={tag.burned}
              />
            ))}
          </View>
        </>
      ) : null}

      {hasWeakness ? (
        <>
          <Text style={styles.sectionLabel}>Weakness</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            <TagPillPdf
              name={theme.weaknessTag.name}
              variant="weakness"
            />
          </View>
        </>
      ) : null}

      <Text style={styles.sectionLabel}>Tracks</Text>
      <View style={styles.trackRow}>
        <Text style={styles.trackLabel}>Improve</Text>
        <TrackVisual segments={3} filled={theme.tracks.improve} />
      </View>
      <View style={styles.trackRow}>
        <Text style={styles.trackLabel}>Milestone</Text>
        <TrackVisual segments={3} filled={theme.tracks.milestone} />
      </View>
      <View style={styles.trackRow}>
        <Text style={styles.trackLabel}>Abandon</Text>
        <TrackVisual segments={3} filled={theme.tracks.abandon} />
      </View>

      {hasImprovements ? (
        <>
          <Text style={styles.sectionLabel}>Special improvements</Text>
          {theme.specialImprovements.map((s, i) => (
            <Text key={i} style={styles.improvementBullet}>
              • {s}
            </Text>
          ))}
        </>
      ) : null}
    </CardFrame>
  );
}
