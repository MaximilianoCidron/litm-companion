import {
  BookOpenText,
  Hammer,
  Mountain,
  ScrollText,
  Sparkles,
  Sunset,
  type LucideIcon,
} from "lucide-react";
import type { MomentOfFulfillmentPath } from "../../schemas";

interface PathInfo {
  label: string;
  description: string;
  icon: LucideIcon;
}

/**
 * Shared dictionary for path labels + descriptions + icons. Used by the
 * PathPicker (card grid), ReviewStep (header glyph), and the Legend
 * history list on HeroSection. All copy is paraphrased — no proprietary
 * terms per Context §9.
 */
export const PATH_INFO: Record<MomentOfFulfillmentPath, PathInfo> = {
  retire: {
    label: "Retire",
    description: "Step out of the story. The hero's tale is told.",
    icon: Sunset,
  },
  reforge: {
    label: "Reforge",
    description: "Replace one of your themes with something new.",
    icon: Hammer,
  },
  gainQuintessence: {
    label: "Crystallize",
    description: "Distill your essence into a permanent power.",
    icon: Sparkles,
  },
  shakeWorld: {
    label: "Shake the World",
    description: "Your deeds permanently change the world around you.",
    icon: Mountain,
  },
  speakWordsEternal: {
    label: "Speak Words Eternal",
    description: "Add a new power tag to an existing theme.",
    icon: ScrollText,
  },
  unearthTruths: {
    label: "Unearth Truths",
    description: "Discover a secret that reshapes what you know.",
    icon: BookOpenText,
  },
};
