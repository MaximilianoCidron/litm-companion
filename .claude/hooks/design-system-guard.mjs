#!/usr/bin/env node
/**
 * design-system-guard — PreToolUse hook for LitM Companion.
 *
 * Fires on Edit/Write/MultiEdit. When the target file is a UI surface
 * (component, stylesheet, or App Router route file), it injects a
 * non-blocking reminder to apply the litm-companion-design-system skill.
 *
 * Soft reminder only: never denies the edit. The reminder appears as
 * additionalContext so the model self-corrects before/while editing.
 *
 * Wired in .claude/settings.json under hooks.PreToolUse.
 */

import process from "node:process";

const SKILL_PATH = ".claude/skills/litm-companion-design-system/SKILL.md";

/** Read all of stdin as a string. */
function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    // No stdin (manual run) — resolve empty after a tick.
    if (process.stdin.isTTY) resolve("");
  });
}

/** Decide whether a file path is a UI surface. */
function isUiFile(filePath) {
  if (!filePath) return false;
  const p = filePath.replace(/\\/g, "/").toLowerCase();

  // Stylesheets and component/markup files always count.
  if (/\.(css|scss|tsx|jsx)$/.test(p)) return true;

  // App Router route/layout files (even if .ts) render output.
  if (/\/app\/.*\/(page|layout|template|loading|error|not-found|default)\.(t|j)sx?$/.test(p))
    return true;

  // Anything living under a components/ directory.
  if (/(^|\/)components\//.test(p)) return true;

  return false;
}

const REMINDER = [
  "🎨 UI change detected — the litm-companion-design-system skill is AUTHORITATIVE here (per CLAUDE.md §1).",
  "Before finalizing this edit, verify against the design system:",
  "• 8px spacing grid — no p-5/gap-7/arbitrary values (§2)",
  "• Typography: Cinzel headings / Spectral prose / Inter UI+data (§3)",
  "• Color: ONLY project tokens — never raw Tailwind (bg-yellow-500, text-orange-100, etc.) (§4)",
  "• Tag/Status/Track conventions; canonical yellow=Power, orange=Weakness (§6)",
  "• Mobile-first; 44px touch targets; WCAG AAA; color never the only signal (§1, §8)",
  "• dark: variant on every colored class (§9)",
  "• GM-only fields never client-conditioned; separate Player/GM components (§7)",
  "• shadcn primitives must be token-aligned + dark-mode (§14)",
  `If you have not already loaded it this session, read ${SKILL_PATH} (or invoke the skill) and run the §11 pre-merge checklist.`,
].join("\n");

async function main() {
  let filePath = "";
  try {
    const raw = await readStdin();
    if (raw.trim()) {
      const payload = JSON.parse(raw);
      const input = payload.tool_input ?? {};
      filePath = input.file_path ?? input.path ?? "";
    }
  } catch {
    // Malformed payload — fail open (no reminder, never block).
    process.exit(0);
  }

  if (!isUiFile(filePath)) process.exit(0);

  const out = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      additionalContext: REMINDER,
    },
  };
  process.stdout.write(JSON.stringify(out));
  process.exit(0);
}

main();
