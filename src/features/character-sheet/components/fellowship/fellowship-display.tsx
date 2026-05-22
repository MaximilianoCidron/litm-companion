// TODO(refactor): promote campaign subdomain to its own feature.
"use client";
import { useCallback } from "react";
import { Card, EditableField, TagPill, Track } from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import {
  mutateFellowship,
  updateTag,
} from "../../actions";
import {
  CharacterId,
  type Campaign,
  type CampaignId,
  type TagId,
} from "../../schemas";
import type { MutateFellowshipInput } from "../../schemas/inputs";
import { PowerTagAdder } from "../theme-card/power-tag-adder";
import { SpecialImprovementsList } from "../theme-card/special-improvements-list";

interface FellowshipDisplayProps {
  campaign: Campaign;
  /**
   * When true, every field becomes editable and dispatches to
   * `mutateFellowship` / `updateTag`. The character-sheet's Fellowship
   * Section always passes false (read-only); the campaign page passes
   * `role === "gm"`.
   */
  canEdit?: boolean;
  /**
   * Required only when canEdit is true. Lets `updateTag` route through the
   * existing character-scoped middleware in the same wire shape. The action
   * itself routes off `location.kind === "fellowship"` and only uses the
   * campaignId to authorize, but we keep a characterId in the input for
   * symmetry with theme/backpack updates.
   */
  characterId?: CharacterId;
}

export function FellowshipDisplay({
  campaign,
  canEdit = false,
  characterId,
}: FellowshipDisplayProps) {
  const fellowship = campaign.fellowship;
  const campaignId: CampaignId = campaign.id;
  const callAction = useActionWithToast();

  // characterId is required by the wire shape of UpdateTagInput. When the
  // GM edits the fellowship outside any specific character context (campaign
  // page), fall back to a placeholder branded id — the action routes off
  // location.kind === "fellowship" and never reads it. A stable sentinel
  // keeps the input shape valid without leaking which character was used.
  const effectiveCharacterId: CharacterId =
    characterId ?? CharacterId.parse("__fellowship__");

  const dispatch = useCallback(
    (op: MutateFellowshipInput["op"]) =>
      mutateFellowship({ campaignId, op }),
    [campaignId],
  );

  const renamePowerTag = canEdit
    ? async (tagId: TagId, newName: string) => {
        await callAction(
          updateTag({
            characterId: effectiveCharacterId,
            location: { kind: "fellowship", campaignId, tagId },
            patch: { kind: "rename", name: newName },
          }),
        );
      }
    : undefined;

  const removePowerTag = canEdit
    ? async (tagId: TagId) => {
        await callAction(dispatch({ kind: "removePowerTag", tagId }));
      }
    : undefined;

  return (
    <Card>
      <Card.Header>
        <div className="flex items-baseline gap-2">
          <h3 className="font-display text-base tracking-tight">Fellowship</h3>
          {!canEdit ? (
            <span className="text-xs text-ink-subtle dark:text-parchment-subtle">
              · editable by GM
            </span>
          ) : null}
        </div>
      </Card.Header>
      <Card.Body className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
            Theme
          </span>
          {canEdit ? (
            <EditableField
              value={fellowship.name}
              onCommit={(name) => dispatch({ kind: "setName", name })}
              ariaLabel="Fellowship name"
              maxLength={60}
              fontPreset="display"
              className="text-lg"
            />
          ) : (
            <p className="font-display text-lg text-ink-base dark:text-parchment-base">
              {fellowship.name || "Unnamed fellowship"}
            </p>
          )}
          {canEdit ? (
            <EditableField
              multiline
              value={fellowship.quest}
              onCommit={(quest) => dispatch({ kind: "setQuest", quest })}
              ariaLabel="Fellowship quest"
              maxLength={200}
              fontPreset="prose"
              placeholder="Set the fellowship's shared quest…"
            />
          ) : fellowship.quest ? (
            <p className="font-serif italic text-ink-muted dark:text-parchment-muted">
              {fellowship.quest}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
            Power tags
          </span>
          {fellowship.powerTags.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {fellowship.powerTags.map((tag) => {
                const tagIdBranded = tag.id as TagId;
                return (
                  <li key={tag.id}>
                    <TagPill
                      polarity="power"
                      label={tag.name}
                      state={
                        tag.burned
                          ? "burned"
                          : tag.scratched
                            ? "scratched"
                            : "active"
                      }
                      onRename={
                        renamePowerTag
                          ? (name) => renamePowerTag(tagIdBranded, name)
                          : undefined
                      }
                      onRemove={
                        removePowerTag
                          ? () => removePowerTag(tagIdBranded)
                          : undefined
                      }
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
              No power tags yet.
            </p>
          )}
          {canEdit ? (
            <PowerTagAdder
              currentCount={fellowship.powerTags.length}
              onAdd={(name) => dispatch({ kind: "addPowerTag", name })}
            />
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
            Weakness
          </span>
          {canEdit ? (
            <EditableField
              value={fellowship.weaknessTag.name}
              onCommit={(name) => dispatch({ kind: "renameWeakness", name })}
              ariaLabel="Fellowship weakness name"
              maxLength={60}
              placeholder="Name the fellowship weakness…"
            />
          ) : fellowship.weaknessTag.name ? (
            <TagPill polarity="weakness" label={fellowship.weaknessTag.name} />
          ) : (
            <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
              —
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
            Special improvements
          </span>
          {canEdit ? (
            <SpecialImprovementsList
              improvements={fellowship.specialImprovements}
              onAdd={(text) => dispatch({ kind: "addImprovement", text })}
              onEdit={(index, text) =>
                dispatch({ kind: "editImprovement", index, text })
              }
              onRemove={(index) =>
                dispatch({ kind: "removeImprovement", index })
              }
            />
          ) : fellowship.specialImprovements.length > 0 ? (
            <ul className="flex flex-col gap-1 text-sm">
              {fellowship.specialImprovements.map((s, i) => (
                <li
                  key={i}
                  className="font-serif text-ink-base dark:text-parchment-base"
                >
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
              None yet.
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Track
            total={3}
            filled={fellowship.tracks.improve}
            label="Improve"
            onChange={
              canEdit
                ? (delta) =>
                    callAction(
                      dispatch({ kind: "markTrack", track: "improve", delta }),
                    )
                : undefined
            }
          />
          <Track
            total={3}
            filled={fellowship.tracks.milestone}
            label="Milestone"
            onChange={
              canEdit
                ? (delta) =>
                    callAction(
                      dispatch({
                        kind: "markTrack",
                        track: "milestone",
                        delta,
                      }),
                    )
                : undefined
            }
          />
          <Track
            total={3}
            filled={fellowship.tracks.abandon}
            label="Abandon"
            onChange={
              canEdit
                ? (delta) =>
                    callAction(
                      dispatch({ kind: "markTrack", track: "abandon", delta }),
                    )
                : undefined
            }
          />
        </div>
      </Card.Body>
    </Card>
  );
}
