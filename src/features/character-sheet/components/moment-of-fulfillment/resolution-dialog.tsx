"use client";
import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { resolveMomentOfFulfillment } from "../../actions";
import { useCharacter } from "../CharacterProvider";
import type {
  Character,
  MomentOfFulfillmentPath,
  ResolveMomentOfFulfillmentInput,
  ThemeId,
  ThemeType,
} from "../../schemas";
import { ThemeTypeSchema, formatThemeType } from "../../schemas";
import { PathPicker } from "./path-picker";
import { PATH_INFO } from "./path-info";

type Resolution = ResolveMomentOfFulfillmentInput["resolution"];

type Step =
  | { kind: "intro" }
  | { kind: "configure"; path: MomentOfFulfillmentPath }
  | { kind: "review"; resolution: Resolution };

interface ResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MomentOfFulfillmentDialog({
  open,
  onOpenChange,
}: ResolutionDialogProps) {
  const { character } = useCharacter();
  const callAction = useActionWithToast();
  const router = useRouter();

  const [step, setStep] = useState<Step>({ kind: "intro" });
  const [pending, setPending] = useState(false);

  const reset = () => {
    setStep({ kind: "intro" });
    setPending(false);
  };

  const close = () => {
    if (pending) return;
    onOpenChange(false);
    reset();
  };

  const apply = async (resolution: Resolution) => {
    setPending(true);
    const result = await callAction(
      resolveMomentOfFulfillment({
        characterId: character.id,
        resolution,
      }),
      { onSuccess: "Moment of Fulfillment resolved" },
    );
    setPending(false);
    if (!result) return;
    onOpenChange(false);
    reset();
    if (result.shouldRedirectToDashboard) {
      router.push("/dashboard");
    } else {
      router.refresh();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent aria-describedby={undefined} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Moment of Fulfillment</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {character.identity.name || "Your hero"} has reached fulfillment.
          How does their story turn?
        </DialogDescription>
        <DialogBody className="flex flex-col gap-4">
          {step.kind === "intro" ? (
            <IntroStep
              onPick={(path) => setStep({ kind: "configure", path })}
            />
          ) : null}
          {step.kind === "configure" ? (
            <ConfigureStep
              path={step.path}
              character={character}
              onBack={() => setStep({ kind: "intro" })}
              onSubmit={(resolution) => setStep({ kind: "review", resolution })}
            />
          ) : null}
          {step.kind === "review" ? (
            <ReviewStep
              resolution={step.resolution}
              character={character}
              onBack={() =>
                setStep({ kind: "configure", path: step.resolution.path })
              }
              onApply={apply}
              pending={pending}
            />
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={close}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface IntroStepProps {
  onPick: (path: MomentOfFulfillmentPath) => void;
}

function IntroStep({ onPick }: IntroStepProps) {
  const [selected, setSelected] = useState<MomentOfFulfillmentPath | null>(
    null,
  );
  return (
    <div className="flex flex-col gap-4">
      <PathPicker value={selected} onChange={setSelected} />
      <div className="flex justify-end">
        <Button
          type="button"
          disabled={!selected}
          onClick={() => {
            if (selected) onPick(selected);
          }}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}

interface ConfigureStepProps {
  path: MomentOfFulfillmentPath;
  character: Character;
  onBack: () => void;
  onSubmit: (resolution: Resolution) => void;
}

function ConfigureStep({
  path,
  character,
  onBack,
  onSubmit,
}: ConfigureStepProps) {
  switch (path) {
    case "retire":
      return <RetireForm onBack={onBack} onSubmit={onSubmit} />;
    case "reforge":
      return (
        <ReforgeForm
          character={character}
          onBack={onBack}
          onSubmit={onSubmit}
        />
      );
    case "gainQuintessence":
      return <GainQuintessenceForm onBack={onBack} onSubmit={onSubmit} />;
    case "shakeWorld":
      return (
        <NarrativeOnlyForm
          path="shakeWorld"
          prompt="What changes in the world?"
          onBack={onBack}
          onSubmit={onSubmit}
        />
      );
    case "speakWordsEternal":
      return (
        <SpeakWordsEternalForm
          character={character}
          onBack={onBack}
          onSubmit={onSubmit}
        />
      );
    case "unearthTruths":
      return (
        <NarrativeOnlyForm
          path="unearthTruths"
          prompt="What truth comes to light?"
          onBack={onBack}
          onSubmit={onSubmit}
        />
      );
  }
}

interface FormNavProps {
  onBack: () => void;
  canSubmit: boolean;
}

function FormNav({ onBack, canSubmit }: FormNavProps) {
  return (
    <div className="flex justify-between gap-2">
      <Button type="button" variant="ghost" onClick={onBack}>
        Back
      </Button>
      <Button type="submit" disabled={!canSubmit}>
        Continue
      </Button>
    </div>
  );
}

function RetireForm({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (resolution: Resolution) => void;
}) {
  const [finalWords, setFinalWords] = useState("");
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ path: "retire", finalWords });
      }}
    >
      <FieldLabel htmlFor="mof-final-words">
        Final words <span className="text-ink-subtle">(optional)</span>
      </FieldLabel>
      <Textarea
        id="mof-final-words"
        value={finalWords}
        onChange={(e) => setFinalWords(e.currentTarget.value)}
        maxLength={2000}
        rows={4}
      />
      <FormNav onBack={onBack} canSubmit />
    </form>
  );
}

function ReforgeForm({
  character,
  onBack,
  onSubmit,
}: {
  character: Character;
  onBack: () => void;
  onSubmit: (resolution: Resolution) => void;
}) {
  const [themeIdToReplace, setThemeIdToReplace] = useState<ThemeId | "">("");
  const [newThemeName, setNewThemeName] = useState("");
  const [newThemeType, setNewThemeType] =
    useState<ThemeType>("origin:trait");
  const [newQuest, setNewQuest] = useState("");
  const [narrative, setNarrative] = useState("");

  const canSubmit =
    themeIdToReplace !== "" && newThemeName.trim().length > 0;

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({
          path: "reforge",
          themeIdToReplace: themeIdToReplace as ThemeId,
          newThemeName: newThemeName.trim(),
          newThemeType,
          newQuest,
          narrativeDescription: narrative,
        });
      }}
    >
      <FieldLabel htmlFor="mof-theme-replace">Theme to reforge</FieldLabel>
      <Select
        id="mof-theme-replace"
        value={themeIdToReplace}
        onChange={(e) =>
          setThemeIdToReplace(e.currentTarget.value as ThemeId)
        }
      >
        <option value="">Pick a theme…</option>
        {character.themes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name || "Unnamed theme"} · {formatThemeType(t.type).label}
          </option>
        ))}
      </Select>

      <FieldLabel htmlFor="mof-new-name">New theme name</FieldLabel>
      <Input
        id="mof-new-name"
        value={newThemeName}
        onChange={(e) => setNewThemeName(e.currentTarget.value)}
        maxLength={120}
        required
      />

      <FieldLabel htmlFor="mof-new-type">New theme type</FieldLabel>
      <Select
        id="mof-new-type"
        value={newThemeType}
        onChange={(e) =>
          setNewThemeType(e.currentTarget.value as ThemeType)
        }
      >
        {ThemeTypeSchema.options.map((opt) => {
          const meta = formatThemeType(opt);
          return (
            <option key={opt} value={opt}>
              {meta.mightLabel} · {meta.label}
            </option>
          );
        })}
      </Select>

      <FieldLabel htmlFor="mof-new-quest">
        New quest <span className="text-ink-subtle">(optional)</span>
      </FieldLabel>
      <Textarea
        id="mof-new-quest"
        value={newQuest}
        onChange={(e) => setNewQuest(e.currentTarget.value)}
        maxLength={200}
        rows={2}
      />

      <FieldLabel htmlFor="mof-reforge-narrative">
        Narrative <span className="text-ink-subtle">(optional)</span>
      </FieldLabel>
      <Textarea
        id="mof-reforge-narrative"
        value={narrative}
        onChange={(e) => setNarrative(e.currentTarget.value)}
        maxLength={2000}
        rows={3}
      />

      <FormNav onBack={onBack} canSubmit={canSubmit} />
    </form>
  );
}

function GainQuintessenceForm({
  onBack,
  onSubmit,
}: {
  onBack: () => void;
  onSubmit: (resolution: Resolution) => void;
}) {
  const [name, setName] = useState("");
  const [narrative, setNarrative] = useState("");
  const canSubmit = name.trim().length > 0;
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({
          path: "gainQuintessence",
          quintessenceName: name.trim(),
          narrativeDescription: narrative,
        });
      }}
    >
      <FieldLabel htmlFor="mof-quint-name">Quintessence name</FieldLabel>
      <Input
        id="mof-quint-name"
        value={name}
        onChange={(e) => setName(e.currentTarget.value)}
        maxLength={120}
        required
        placeholder="e.g. Unyielding Will"
      />
      <FieldLabel htmlFor="mof-quint-narrative">
        Narrative <span className="text-ink-subtle">(optional)</span>
      </FieldLabel>
      <Textarea
        id="mof-quint-narrative"
        value={narrative}
        onChange={(e) => setNarrative(e.currentTarget.value)}
        maxLength={2000}
        rows={3}
      />
      <FormNav onBack={onBack} canSubmit={canSubmit} />
    </form>
  );
}

function NarrativeOnlyForm({
  path,
  prompt,
  onBack,
  onSubmit,
}: {
  path: "shakeWorld" | "unearthTruths";
  prompt: string;
  onBack: () => void;
  onSubmit: (resolution: Resolution) => void;
}) {
  const [narrative, setNarrative] = useState("");
  const canSubmit = narrative.trim().length > 0;
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({ path, narrativeDescription: narrative.trim() });
      }}
    >
      <FieldLabel htmlFor="mof-narrative">{prompt}</FieldLabel>
      <Textarea
        id="mof-narrative"
        value={narrative}
        onChange={(e) => setNarrative(e.currentTarget.value)}
        maxLength={2000}
        rows={5}
        required
      />
      <FormNav onBack={onBack} canSubmit={canSubmit} />
    </form>
  );
}

function SpeakWordsEternalForm({
  character,
  onBack,
  onSubmit,
}: {
  character: Character;
  onBack: () => void;
  onSubmit: (resolution: Resolution) => void;
}) {
  const [themeId, setThemeId] = useState<ThemeId | "">("");
  const [tagName, setTagName] = useState("");
  const [narrative, setNarrative] = useState("");
  const canSubmit = themeId !== "" && tagName.trim().length > 0;
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({
          path: "speakWordsEternal",
          themeId: themeId as ThemeId,
          newPowerTagName: tagName.trim(),
          narrativeDescription: narrative,
        });
      }}
    >
      <FieldLabel htmlFor="mof-words-theme">Theme</FieldLabel>
      <Select
        id="mof-words-theme"
        value={themeId}
        onChange={(e) => setThemeId(e.currentTarget.value as ThemeId)}
      >
        <option value="">Pick a theme…</option>
        {character.themes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name || "Unnamed theme"}
          </option>
        ))}
      </Select>
      <FieldLabel htmlFor="mof-words-tag">New power tag name</FieldLabel>
      <Input
        id="mof-words-tag"
        value={tagName}
        onChange={(e) => setTagName(e.currentTarget.value)}
        maxLength={120}
        required
        placeholder="e.g. Last Stand"
      />
      <FieldLabel htmlFor="mof-words-narrative">
        Narrative <span className="text-ink-subtle">(optional)</span>
      </FieldLabel>
      <Textarea
        id="mof-words-narrative"
        value={narrative}
        onChange={(e) => setNarrative(e.currentTarget.value)}
        maxLength={2000}
        rows={3}
      />
      <FormNav onBack={onBack} canSubmit={canSubmit} />
    </form>
  );
}

interface ReviewStepProps {
  resolution: Resolution;
  character: Character;
  onBack: () => void;
  onApply: (resolution: Resolution) => Promise<void>;
  pending: boolean;
}

function ReviewStep({
  resolution,
  character,
  onBack,
  onApply,
  pending,
}: ReviewStepProps) {
  const info = PATH_INFO[resolution.path];
  const Icon = info.icon;
  const lines = buildResolutionSummary(resolution, character);
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-ember/40 bg-ember/5 p-4">
        <div className="mb-2 inline-flex items-center gap-2 font-display text-base">
          <Icon className="h-5 w-5 text-ember" aria-hidden="true" />
          {info.label}
        </div>
        <ul className="flex flex-col gap-1 text-sm">
          {lines.map((line, i) => (
            <li
              key={i}
              className={
                line.tone === "warning"
                  ? "text-rust-text dark:text-rust-text-dark"
                  : "text-ink-base dark:text-parchment-base"
              }
            >
              · {line.text}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs italic text-ink-muted dark:text-parchment-muted">
        This change is permanent. There&apos;s no going back.
      </p>
      <div className="flex justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={pending}
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={() => void onApply(resolution)}
          disabled={pending}
        >
          {pending ? "Applying…" : "Apply"}
        </Button>
      </div>
    </div>
  );
}

interface SummaryLine {
  text: string;
  tone?: "warning";
}

/**
 * Pure helper. Returns a list of bullet-line strings + optional tone for
 * the ReviewStep's "what will happen" box. Mirrors the action's
 * server-side effects so the player sees what they're committing to.
 */
function buildResolutionSummary(
  resolution: Resolution,
  character: Character,
): SummaryLine[] {
  const name = character.identity.name || "your hero";
  const lines: SummaryLine[] = [];
  switch (resolution.path) {
    case "retire":
      lines.push({ text: `${name} retires from the story.` });
      lines.push({
        text: "This character can no longer act.",
        tone: "warning",
      });
      if (resolution.finalWords.trim()) {
        lines.push({ text: `Final words: "${resolution.finalWords.trim()}"` });
      }
      break;
    case "reforge": {
      const old = character.themes.find(
        (t) => t.id === resolution.themeIdToReplace,
      );
      const oldLabel = old?.name || "Unnamed theme";
      lines.push({
        text: `${name} reforges "${oldLabel}" into "${resolution.newThemeName}" (${formatThemeType(resolution.newThemeType).label}).`,
      });
      lines.push({ text: "Promise resets to 0 / 5." });
      break;
    }
    case "gainQuintessence":
      lines.push({
        text: `${name} crystallizes "${resolution.quintessenceName}".`,
      });
      lines.push({ text: "Promise resets to 0 / 5." });
      break;
    case "shakeWorld":
      lines.push({
        text: `${name} shakes the world: "${resolution.narrativeDescription.trim()}".`,
      });
      lines.push({ text: "Promise resets to 0 / 5." });
      break;
    case "speakWordsEternal": {
      const theme = character.themes.find(
        (t) => t.id === resolution.themeId,
      );
      const themeName = theme?.name || "Unnamed theme";
      lines.push({
        text: `${name} adds "${resolution.newPowerTagName}" to "${themeName}".`,
      });
      lines.push({ text: "Promise resets to 0 / 5." });
      break;
    }
    case "unearthTruths":
      lines.push({
        text: `${name} unearths a truth: "${resolution.narrativeDescription.trim()}".`,
      });
      lines.push({ text: "Promise resets to 0 / 5." });
      break;
  }
  return lines;
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted"
    >
      {children}
    </label>
  );
}

function Textarea(
  props: {
    id: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
    rows?: number;
    maxLength?: number;
    required?: boolean;
  },
) {
  return (
    <textarea
      {...props}
      className="w-full rounded-lg border border-mist-light bg-parchment-elevated px-3 py-2 text-sm text-ink-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base"
    />
  );
}

function Select({
  id,
  value,
  onChange,
  children,
}: {
  id: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      className="h-11 w-full rounded-lg border border-mist-light bg-parchment-elevated px-3 text-sm text-ink-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base"
    >
      {children}
    </select>
  );
}
