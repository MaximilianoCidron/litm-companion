# Project Rules — LitM Companion

These rules apply to every Claude Code session in this repository. Read them before acting.

## 1. UI changes → consult the design system first

**Before writing or modifying ANY UI code** (component, page, layout, Tailwind classes, style change, shadcn adoption — anything that affects what the user sees), you MUST read and apply:

`.claude/skills/litm-companion-design-system/SKILL.md`

This applies even when the user's request doesn't mention "design system", "Tailwind", or "styling" — if the change affects rendered output, the design system is authoritative. Verify against:

- 8px spacing grid (§2)
- Typography hierarchy: Cinzel / Spectral / Inter (§3)
- Color & semantic tokens — **never use raw Tailwind palette** like `bg-yellow-500`, `text-orange-100` (§4)
- Mobile-first responsive (§1)
- Tag/Status/Track conventions (§6)
- GM-vs-player visibility (§7)
- WCAG AAA + 44px touch targets (§8)
- Dark mode on every colored class (§9)
- Pre-merge checklist (§11)
- Anti-patterns to avoid (§12)
- shadcn/Radix integration rules (§14)

If a request conflicts with the design system, surface the conflict before implementing — do not silently violate it.

## 2. Context.md must reflect reality

`Context.md` (project root) is the canonical snapshot of the app: stack, architecture, routes, data model, auth, conventions, current feature state.

**Update `Context.md` BEFORE committing** any change that alters:
- Stack / dependencies / versions
- Directory structure or module boundaries
- Routes, API endpoints, or Server Actions
- Data model / Firestore collections / Security Rules
- Auth flow or session handling
- Environment variables
- A feature transitioning from "not built" → "built" or vice versa
- Any new convention or architectural decision

Pure refactors with no external surface change don't require a Context.md update. When in doubt, update it.

## 3. Database

Firestore is the chosen database. Real-time sync via `onSnapshot`. All writes through Next.js Server Actions with cookie re-verification (`requireUser()`). See `Context.md` §3 and design system §10.

## 4. Security baseline

- Server Actions **must** call `requireUser()` before any mutation.
- Player clients **never** write Firestore directly.
- GM-only fields **never** ship to player clients — filter at Firestore Security Rules + server fetch, not client conditionals.
- Session cookie is httpOnly; do not expose tokens to client JS after the exchange.
