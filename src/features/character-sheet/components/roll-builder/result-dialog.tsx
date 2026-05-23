"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { Scale, Shield, Sparkles, X } from "lucide-react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
} from "@/shared/ui";
import { getFirebaseDb } from "@/shared/firebase/client";
import { cn } from "@/shared/lib/cn";
import { useCharacter } from "../CharacterProvider";
import {
  useResultDialogAnimate,
  useResultDialogRollId,
  useRollBuilder,
} from "../../stores/roll-builder";
import { RollRecordSchema, type RollRecord } from "../../schemas";
import { AllocationStep } from "./allocation-step";

function tierTheme(tier: RollRecord["tier"]) {
  if (tier === "success") {
    return {
      className:
        "bg-moss-soft text-moss-text dark:bg-moss-soft-dark dark:text-moss-text-dark",
      icon: Sparkles,
      label: "SUCCESS",
      tagline: "Your action lands clean.",
    };
  }
  if (tier === "mixed") {
    return {
      className:
        "bg-tag-power-soft text-tag-power-text dark:bg-tag-power-soft-dark dark:text-tag-power-text-dark",
      icon: Scale,
      label: "MIXED",
      tagline: "It works — at a cost.",
    };
  }
  if (tier === "failure") {
    return {
      className:
        "bg-rust-soft text-rust-text dark:bg-rust-soft-dark dark:text-rust-text-dark",
      icon: X,
      label: "FAILURE",
      tagline: "It falls apart. Narrator's call.",
    };
  }
  return {
    className:
      "bg-ember/15 text-ember-text-light dark:text-ember-text-dark",
    icon: Shield,
    label: "REACTION",
    tagline: "Spend with Narrator.",
  };
}

function Die({
  value,
  reveal,
  celebrate,
}: {
  value: number;
  reveal: boolean;
  celebrate: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex h-16 w-16 items-center justify-center rounded-lg border-2 border-mist-light bg-parchment-elevated font-display numeric text-4xl",
        "dark:border-mist-dark dark:bg-ink-elevated",
        reveal && celebrate && "fx-celebrate",
      )}
      aria-live="polite"
    >
      {reveal ? value : "?"}
    </div>
  );
}

export function RollResultDialog() {
  const { character, role } = useCharacter();
  const rollId = useResultDialogRollId();
  const animate = useResultDialogAnimate();
  const closeResultDialog = useRollBuilder((s) => s.closeResultDialog);
  const setExpanded = useRollBuilder((s) => s.setExpanded);
  const [roll, setRoll] = useState<RollRecord | null>(null);
  const [revealStage, setRevealStage] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    if (!rollId) {
      // Reset via deferred timers so the lint rule doesn't fire on synchronous
      // setState within the effect body.
      const tReset = setTimeout(() => {
        setRoll(null);
        setRevealStage(0);
      }, 0);
      return () => clearTimeout(tReset);
    }
    const ref = doc(
      getFirebaseDb(),
      "characters",
      character.id,
      "rolls",
      rollId,
    );
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const raw = snap.data();
      const createdAt =
        raw.createdAt && typeof raw.createdAt.toDate === "function"
          ? raw.createdAt.toDate().toISOString()
          : new Date().toISOString();
      // Round-trip through Zod so .default() values materialize for
      // post-commit field reads (isDetailedAction, limitAllocationApplied,
      // etc.). Legacy rolls missing the new fields parse cleanly.
      const resolved = (raw.resolved as Record<string, unknown> | undefined) ?? {};
      const resolvedStatuses = Array.isArray(resolved.statuses)
        ? (resolved.statuses as Array<Record<string, unknown>>).map((s) =>
            s.location ? s : { ...s, location: { kind: "character" } },
          )
        : [];
      const parsed = RollRecordSchema.safeParse({
        ...raw,
        id: snap.id,
        createdAt,
        resolved: { ...resolved, statuses: resolvedStatuses },
      });
      if (parsed.success) {
        setRoll(parsed.data);
      } else {
        // Should never happen — log and surface raw shape so the dialog
        // can still render dice + tier.
        console.warn("[result-dialog] parse failed", parsed.error);
        setRoll({ ...raw, createdAt } as RollRecord);
      }
    });
    return unsub;
  }, [rollId, character.id]);

  useEffect(() => {
    if (!rollId) return;
    if (!animate) {
      // Replay mode: skip the dice-reveal animation entirely.
      const tReveal = setTimeout(() => setRevealStage(2), 0);
      return () => clearTimeout(tReveal);
    }
    // Live roll: stagger the reveal so each die lands separately.
    const tReset = setTimeout(() => setRevealStage(0), 0);
    const t1 = setTimeout(() => setRevealStage(1), 600);
    const t2 = setTimeout(() => setRevealStage(2), 800);
    return () => {
      clearTimeout(tReset);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [rollId, animate]);

  const open = rollId !== null;
  const tier = roll?.tier ?? null;
  const theme = tierTheme(tier);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closeResultDialog();
      }}
    >
      <DialogContent aria-describedby={undefined} className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Roll · {roll ? (tier ? tier : "Reaction") : "…"}
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5">
          {!roll ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-4">
                <Die
                  value={roll.d1}
                  reveal={revealStage >= 1}
                  celebrate={animate}
                />
                <span className="font-display text-2xl text-ink-muted dark:text-parchment-muted">
                  +
                </span>
                <Die
                  value={roll.d2}
                  reveal={revealStage >= 2}
                  celebrate={animate}
                />
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="numeric flex items-baseline gap-2 font-display">
                  <span className="text-sm uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
                    Power
                  </span>
                  <span className="text-xl">
                    {roll.power > 0 ? `+${roll.power}` : roll.power}
                  </span>
                </div>
                <div className="numeric flex items-baseline gap-2 font-display">
                  <span className="text-sm uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
                    Total
                  </span>
                  <span className="text-3xl text-ink-base dark:text-parchment-base">
                    {roll.total}
                  </span>
                </div>
              </div>

              {(roll.resolved.tags.length > 0 ||
                roll.resolved.statuses.length > 0) && (
                <ul className="flex flex-col gap-1 rounded-lg bg-parchment-soft p-3 text-sm dark:bg-ink-soft">
                  {roll.resolved.tags.map((t) => (
                    <li
                      key={`tag-${t.tagId}`}
                      className="flex items-center justify-between gap-2"
                    >
                      <span>
                        {t.name || "(unnamed)"}
                        {t.burned ? (
                          <span className="ml-2 text-[10px] uppercase tracking-wider text-crimson">
                            burned
                          </span>
                        ) : null}
                      </span>
                      <span className="numeric font-display">
                        {t.contribution > 0
                          ? `+${t.contribution}`
                          : t.contribution}
                      </span>
                    </li>
                  ))}
                  {roll.resolved.statuses
                    .filter((s) => s.contribution !== 0)
                    .map((s) => (
                      <li
                        key={`status-${s.statusId}`}
                        className="flex items-center justify-between gap-2"
                      >
                        <span>
                          {s.name || "(unnamed)"} · {s.tier}
                        </span>
                        <span className="numeric font-display">
                          {s.contribution > 0
                            ? `+${s.contribution}`
                            : s.contribution}
                        </span>
                      </li>
                    ))}
                  {roll.mightModifier !== 0 && (
                    <li className="flex items-center justify-between gap-2">
                      <span>Might</span>
                      <span className="numeric font-display">
                        {roll.mightModifier > 0
                          ? `+${roll.mightModifier}`
                          : roll.mightModifier}
                      </span>
                    </li>
                  )}
                </ul>
              )}

              {roll.isDetailedAction &&
              roll.detailedActionTarget &&
              !roll.limitAllocationApplied &&
              roll.power > 0 &&
              role === "owner" ? (
                <AllocationStep roll={roll} />
              ) : null}

              {roll.reactingTo ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-center justify-center gap-2 rounded-lg bg-ember/10 px-3 py-3 text-sm dark:bg-ember/5"
                >
                  <Shield
                    className="h-5 w-5 text-ember-text-light dark:text-ember-text-dark"
                    aria-hidden="true"
                  />
                  <span className="font-display text-sm uppercase tracking-wider text-ember-text-light dark:text-ember-text-dark">
                    Reaction · {roll.power} Power
                  </span>
                </div>
              ) : (
                <div
                  role="status"
                  aria-live="polite"
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                    theme.className,
                  )}
                >
                  <theme.icon className="h-5 w-5" aria-hidden="true" />
                  <span className="font-display text-sm uppercase tracking-wider">
                    {tier ? theme.label : `Power earned: ${roll.total}`}
                  </span>
                  <span className="ml-1">{theme.tagline}</span>
                </div>
              )}
            </>
          )}
        </DialogBody>
        <DialogFooter>
          {animate ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  closeResultDialog();
                }}
              >
                Roll again
              </Button>
              <Button
                type="button"
                onClick={() => {
                  closeResultDialog();
                  setExpanded(false);
                }}
              >
                Close
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={() => {
                closeResultDialog();
              }}
            >
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
