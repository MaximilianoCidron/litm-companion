import { Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type {
  FellowshipRelationship,
  FellowshipTheme,
} from "../../schemas";
import { CardFrame } from "./shared/card-frame";
import { RelationshipRow } from "./shared/relationship-row";
import { TagPillPdf } from "./shared/tag-pill-pdf";
import { TrackVisual } from "./shared/track-visual";
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
  name: {
    fontFamily: "Cinzel",
    fontSize: 16,
    color: PDF_TOKENS.inkBase,
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
    marginTop: 12,
    marginBottom: 6,
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

interface FellowshipPageProps {
  fellowship: FellowshipTheme;
  relationships: readonly FellowshipRelationship[];
}

export function FellowshipPage({
  fellowship,
  relationships,
}: FellowshipPageProps) {
  return (
    <Page size="A4" style={styles.page}>
      <CardFrame title="Fellowship Card">
        <Text style={styles.name}>{fellowship.name || "Unnamed fellowship"}</Text>
        {fellowship.quest ? (
          <Text style={styles.quest}>{fellowship.quest}</Text>
        ) : null}

        {fellowship.powerTags.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>Power tags</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              {fellowship.powerTags.map((tag) => (
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

        {fellowship.weaknessTag.name.trim() ? (
          <>
            <Text style={styles.sectionLabel}>Weakness</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              <TagPillPdf name={fellowship.weaknessTag.name} variant="weakness" />
            </View>
          </>
        ) : null}

        <Text style={styles.sectionLabel}>Tracks</Text>
        <View style={styles.trackRow}>
          <Text style={styles.trackLabel}>Improve</Text>
          <TrackVisual segments={3} filled={fellowship.tracks.improve} />
        </View>
        <View style={styles.trackRow}>
          <Text style={styles.trackLabel}>Milestone</Text>
          <TrackVisual segments={3} filled={fellowship.tracks.milestone} />
        </View>
        <View style={styles.trackRow}>
          <Text style={styles.trackLabel}>Abandon</Text>
          <TrackVisual segments={3} filled={fellowship.tracks.abandon} />
        </View>

        {fellowship.specialImprovements.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>Special improvements</Text>
            {fellowship.specialImprovements.map((s, i) => (
              <Text key={i} style={styles.improvementBullet}>
                • {s}
              </Text>
            ))}
          </>
        ) : null}

        {relationships.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>Your Bonds</Text>
            {relationships.map((rel) => (
              <RelationshipRow key={rel.id} rel={rel} />
            ))}
          </>
        ) : null}
      </CardFrame>
    </Page>
  );
}
