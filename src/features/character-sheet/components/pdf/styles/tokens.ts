// Mirror of design tokens from globals.css. Keep in sync manually when the
// canonical CSS variables (--parchment, --ink-muted, etc.) change.
// @react-pdf/renderer doesn't read CSS — these HEX values are baked in.

export const PDF_TOKENS = {
  parchment: "#f5ecd9",
  parchmentSoft: "#ebe1cb",
  parchmentElevated: "#fbf3e0",
  inkBase: "#2b251d",
  inkMuted: "#534b40",
  inkSubtle: "#7c7567",
  ember: "#c8581b",
  emberSoft: "#f2c8a8",
  moss: "#5a7a3a",
  rust: "#a13e1e",
  crimson: "#8b1a1a",
  mist: "#c2bca8",
  mistLight: "#d8d2bd",
  tagPower: "#d4a017",
  tagPowerSoft: "#f5e08a",
  tagWeakness: "#d97426",
  tagWeaknessSoft: "#f5c89a",
} as const;
