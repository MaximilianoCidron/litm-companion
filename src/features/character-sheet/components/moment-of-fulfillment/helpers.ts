import type { LucideIcon } from "lucide-react";
import {
  Eye,
  Globe2,
  Hammer,
  LogOut,
  ScrollText,
  Sparkle,
} from "lucide-react";
import type {
  Character,
  MomentOfFulfillmentPath,
  ResolveMomentOfFulfillmentInput,
} from "../../schemas";

export interface PathMeta {
  key: MomentOfFulfillmentPath;
  label: string;
  description: string;
  Icon: LucideIcon;
}

// Paraphrased descriptions — NOT rulebook-verbatim copy.
export const PATHS: PathMeta[] = [
  {
    key: "retire",
    label: "Retire",
    description:
      "Step away from the road. Archive this hero, story complete.",
    Icon: LogOut,
  },
  {
    key: "reforge",
    label: "Reforge",
    description:
      "Begin again. Wipe themes and tags; keep your quintessences and bonds.",
    Icon: Hammer,
  },
  {
    key: "gainQuintessence",
    label: "Gain Quintessence",
    description:
      "Earn a permanent, rule-bending power that stays with you.",
    Icon: Sparkle,
  },
  {
    key: "shakeWorld",
    label: "Shake the World",
    description:
      "Change the world. Describe the shift with your Narrator.",
    Icon: Globe2,
  },
  {
    key: "speakWordsEternal",
    label: "Speak Words Eternal",
    description:
      "Forge an enduring enchantment or relic into the world.",
    Icon: ScrollText,
  },
  {
    key: "unearthTruths",
    label: "Unearth Lost Truths",
    description:
      "The Narrator reveals a profound discovery about this world.",
    Icon: Eye,
  },
];

export function pathMeta(path: MomentOfFulfillmentPath): PathMeta {
  return PATHS.find((p) => p.key === path) ?? PATHS[0]!;
}

export function countBurnedTags(character: Character): number {
  return character.themes.reduce(
    (sum, t) => sum + t.powerTags.filter((tag) => tag.burned).length,
    0,
  );
}

type Payload = {
  retireDescription: string;
  reforgeNewName: string;
  reforgeNewConcept: string;
  reforgeDescription: string;
  quintessenceText: string;
  quintessenceDescription: string;
  shakeWorldDescription: string;
  speakWordsEternalDescription: string;
  unearthTruthsDescription: string;
};

export const EMPTY_PAYLOAD: Payload = {
  retireDescription: "",
  reforgeNewName: "",
  reforgeNewConcept: "",
  reforgeDescription: "",
  quintessenceText: "",
  quintessenceDescription: "",
  shakeWorldDescription: "",
  speakWordsEternalDescription: "",
  unearthTruthsDescription: "",
};

export type MomentOfFulfillmentPayload = Payload;

/**
 * Validate the local payload for a given path. Returns null when ready to
 * submit; otherwise a short reason string used to disable the Continue button.
 */
export function validatePayload(
  path: MomentOfFulfillmentPath,
  payload: Payload,
): string | null {
  if (path === "gainQuintessence" && payload.quintessenceText.trim() === "") {
    return "Name the quintessence first.";
  }
  if (path === "shakeWorld" && payload.shakeWorldDescription.trim() === "") {
    return "Describe how the world shifts.";
  }
  if (
    path === "speakWordsEternal" &&
    payload.speakWordsEternalDescription.trim() === ""
  ) {
    return "Speak the words first.";
  }
  if (
    path === "unearthTruths" &&
    payload.unearthTruthsDescription.trim() === ""
  ) {
    return "Describe the truth unearthed.";
  }
  return null;
}

/**
 * Build the discriminated `choice` shape from the local payload for the
 * chosen path, ready to submit to `resolveMomentOfFulfillment`.
 */
export function buildChoiceFromPayload(
  path: MomentOfFulfillmentPath,
  payload: Payload,
): ResolveMomentOfFulfillmentInput["choice"] {
  switch (path) {
    case "retire":
      return { kind: "retire", description: payload.retireDescription };
    case "reforge":
      return {
        kind: "reforge",
        newName: payload.reforgeNewName.trim() || undefined,
        newConcept: payload.reforgeNewConcept.trim() || undefined,
        description: payload.reforgeDescription,
      };
    case "gainQuintessence":
      return {
        kind: "gainQuintessence",
        text: payload.quintessenceText.trim(),
        description: payload.quintessenceDescription,
      };
    case "shakeWorld":
      return {
        kind: "shakeWorld",
        description: payload.shakeWorldDescription.trim(),
      };
    case "speakWordsEternal":
      return {
        kind: "speakWordsEternal",
        description: payload.speakWordsEternalDescription.trim(),
      };
    case "unearthTruths":
      return {
        kind: "unearthTruths",
        description: payload.unearthTruthsDescription.trim(),
      };
  }
}
