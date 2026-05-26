import { Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Character } from "../../schemas";
import { CardFrame } from "./shared/card-frame";
import { MomentHistoryList } from "./shared/moment-history-list";
import { PromiseTrack } from "./shared/promise-track";
import { StatusRow } from "./shared/status-row";
import { TagList } from "./shared/tag-list";
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
  identity: { marginBottom: 16 },
  avatarRow: {
    alignItems: "center",
    marginBottom: 12,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: PDF_TOKENS.inkMuted,
    objectFit: "cover",
  },
  name: {
    fontFamily: "Cinzel",
    fontSize: 22,
    fontWeight: "bold",
    color: PDF_TOKENS.inkBase,
  },
  concept: {
    fontFamily: "Spectral",
    fontStyle: "italic",
    fontSize: 11,
    color: PDF_TOKENS.inkMuted,
    marginTop: 4,
  },
  pronouns: {
    fontSize: 9,
    color: PDF_TOKENS.inkSubtle,
    marginTop: 2,
  },
  playerName: {
    fontSize: 9,
    color: PDF_TOKENS.inkSubtle,
    marginTop: 2,
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
  bullet: {
    fontFamily: "Spectral",
    fontSize: 10,
    color: PDF_TOKENS.inkBase,
    marginBottom: 2,
  },
});

export function HeroPage({ character }: { character: Character }) {
  const { identity, progression, statuses, backpack, status: charStatus } =
    character;
  const isRetired = charStatus === "retired";
  const hasMoments = character.momentsOfFulfillment.length > 0;
  const hasQuintessences = character.quintessences.length > 0;
  const hasStatuses = statuses.length > 0;
  const hasStoryTags = backpack.storyTags.length > 0;
  const hasNotes = backpack.notes.trim().length > 0;

  return (
    <Page size="A4" style={styles.page}>
      <CardFrame title={isRetired ? "Hero Card · Retired" : "Hero Card"}>
        {character.avatar?.mainUrl ? (
          <View style={styles.avatarRow}>
            {/* @react-pdf/renderer Image has no alt prop — disable jsx-a11y rule meant for HTML img */}
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={character.avatar.mainUrl} style={styles.avatarImage} />
          </View>
        ) : null}
        <View style={styles.identity}>
          <Text style={styles.name}>{identity.name || "Unnamed"}</Text>
          {identity.concept ? (
            <Text style={styles.concept}>{identity.concept}</Text>
          ) : null}
          {identity.pronouns ? (
            <Text style={styles.pronouns}>{identity.pronouns}</Text>
          ) : null}
          {identity.playerName ? (
            <Text style={styles.playerName}>
              Player: {identity.playerName}
            </Text>
          ) : null}
        </View>

        <Text style={styles.sectionLabel}>Promise</Text>
        <PromiseTrack value={progression.promise} />

        {hasQuintessences ? (
          <>
            <Text style={styles.sectionLabel}>Quintessences</Text>
            {character.quintessences.map((q) => (
              <Text key={q.id} style={styles.bullet}>
                • {q.name}
                {q.scratched ? " (scratched)" : ""}
              </Text>
            ))}
          </>
        ) : null}

        {hasMoments ? (
          <>
            <Text style={styles.sectionLabel}>Moments of Fulfillment</Text>
            <MomentHistoryList entries={character.momentsOfFulfillment} />
          </>
        ) : null}

        {hasStatuses ? (
          <>
            <Text style={styles.sectionLabel}>Statuses</Text>
            {statuses.map((s) => (
              <StatusRow key={s.id} status={s} />
            ))}
          </>
        ) : null}

        {hasStoryTags ? (
          <>
            <Text style={styles.sectionLabel}>Backpack — Story Tags</Text>
            <TagList tags={backpack.storyTags} />
          </>
        ) : null}

        {hasNotes ? (
          <>
            <Text style={styles.sectionLabel}>Backpack — Notes</Text>
            <Text
              style={{
                fontFamily: "Spectral",
                fontSize: 10,
                lineHeight: 1.4,
                color: PDF_TOKENS.inkBase,
              }}
            >
              {backpack.notes}
            </Text>
          </>
        ) : null}
      </CardFrame>
    </Page>
  );
}
