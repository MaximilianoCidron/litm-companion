# LitM Companion — Project Context

> **Update rule:** This file must be refreshed after any change that alters stack, architecture, routes, data model, auth flow, or major features — **before** committing those changes. Treat it as the canonical snapshot of "what this app is right now."

Last updated: 2026-05-16

---

## 1. Purpose

Companion web app for the tabletop RPG **Legend in the Mist (LitM)** — a Mist-engine system. Designed for table-side play: players track character themes/tags/statuses on phones; the Narrator (GM) drives sessions from a tablet or laptop. Real-time sync between all participants.

Two roles, two device targets:
- **Player** → mobile-first (phone in portrait, one-handed).
- **Narrator (GM)** → tablet/laptop primary.

## 2. Stack

| Layer | Tech | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.6 |
| Runtime | React | 19.2.4 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | ^4 (v4, `@tailwindcss/postcss`) |
| Primitives | shadcn/ui + Radix (`@radix-ui/react-{dialog,dropdown-menu,tabs,toast,slot}`) | — |
| Variants | `class-variance-authority` + `tailwind-merge` + `clsx` | — |
| Icons | `lucide-react` | ^1.16.0 |
| State (client UI only) | `zustand` + `immer` middleware | ^5 / ^11 |
| Validation | `zod` | ^4 |
| Backend SDK (client) | `firebase` | ^12.13.0 |
| Backend SDK (server) | `firebase-admin` | ^13.10.0 |
| Package manager | pnpm | — |
| Lint | ESLint + `eslint-config-next` + `eslint-plugin-boundaries` | — |

Scripts: `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm typecheck`.

## 3. Database & Real-Time

**Firestore** (Firebase). Decision rationale:
- Native real-time via `onSnapshot` — matches LitM's GM↔player sync model (§10 of design system).
- Firebase Auth already used for sessions; same project covers both.
- Security Rules enforce GM-vs-player visibility asymmetry server-side (rulebook requirement — Limits, Role, hidden threats must never reach player clients).
- Free tier sufficient for early development.

Wiring:
- Client: `src/shared/firebase/client.ts` → `getFirebaseDb()`.
- Admin (server-only): `src/shared/firebase/admin.ts` → `getAdminDb()`.

**Sync rules** (authoritative — see design system §10):
- All writes go through Next.js **Server Actions**, never client-direct Firestore writes from a player.
- Every Server Action **re-verifies** the session cookie via `requireUser()` (defense-in-depth vs CVE-2025-29927).
- Persistent state (themes, tags, quests, tracks) → optimistic UI OK.
- Ephemeral state (statuses, scratched flags, declared threats) → **no optimistic UI**; wait for snapshot.
- Offline > 3s → disable mechanical actions, show banner.
- Camp mode → batch writes per character.

## 4. Authentication

- **Firebase Auth** (email/password + Google popup).
- Client signs in → `getIdToken(true)` → `POST /api/auth/session` exchanges for httpOnly session cookie (`__session`).
- Client-side Firebase session is dropped after exchange — cookie is sole source of truth.
- Cookie max-age: 5 days default (`SESSION_COOKIE_MAX_AGE_SECONDS` env override).
- `(app)/layout.tsx` server-side gate via `verifySessionCookie`.
- Logout: Server Action revokes refresh tokens + clears cookie.

## 5. Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root: fonts (Cinzel/Spectral/Inter), html lang
│   ├── page.tsx                  # Redirect → /dashboard or /login
│   ├── globals.css               # Tailwind v4 + design tokens
│   ├── (auth)/
│   │   └── login/page.tsx        # Login route
│   ├── (app)/                    # Authenticated shell
│   │   ├── layout.tsx            # Session guard
│   │   └── dashboard/page.tsx    # Placeholder dashboard
│   └── api/
│       └── auth/session/route.ts # POST/DELETE session cookie
├── features/                     # Feature slices
│   └── auth/
│       ├── components/LoginForm.tsx
│       ├── actions/logout.ts     # Server Action
│       ├── lib/client-auth.ts    # signInWith{Password,Google}
│       ├── schemas/login.ts      # zod
│       └── index.ts              # Public barrel
└── shared/
    ├── firebase/
    │   ├── client.ts             # Browser SDK
    │   ├── admin.ts              # Admin SDK (server-only)
    │   └── session.ts            # verifySessionCookie / requireUser
    ├── stores/ui-store.ts        # Zustand — UI-only state (no Firestore data)
    ├── lib/cn.ts                 # clsx + tailwind-merge
    └── ui/
        ├── button.tsx            # CVA button (primary/secondary/ghost/danger)
        └── input.tsx             # CVA input (default/error)
```

**Architectural boundary** (enforced by `eslint-plugin-boundaries`):
`shared/` ← `features/` ← `app/`. Lower layers never import upward.

## 6. Design System

Authoritative rules: `.claude/skills/litm-companion-design-system/SKILL.md`.

Highlights:
- 8px spacing grid.
- Three-font system: **Cinzel** (display), **Spectral** (prose), **Inter** (UI/data).
- Color tokens in `globals.css`: parchment/ink surfaces, ember brand, moss/rust/crimson semantic, **locked canonical tag colors** (Power = yellow, Weakness = orange) — never use raw Tailwind palette.
- Mobile-first (375×667 portrait baseline).
- Dark mode mandatory on every colored class.
- WCAG AAA + 44px touch targets.
- Tag/Status/Track primitives are game-canonical — never re-implement.
- GM-only vs player-visible enforced server-side; separate components (`ChallengeCardPlayer` vs `ChallengeCardGM`), never `{isGM && …}` in shared component.

## 7. Current Feature State

**Built:**
- Firebase Auth (email/password + Google).
- Session cookie issuance + verification.
- Server-side route gating.
- Logout (Server Action + DELETE route).
- Login UI with form validation.
- Dashboard placeholder.
- Design system tokens (colors, fonts) wired in `globals.css`.
- Button + Input primitives.
- UI-only Zustand store.

**Not yet built (next phases):**
- Character sheet (4 themes + Fellowship, tags, statuses, tracks, backpack, Promise track).
- Theme Card / Tag Chip / Status Chip / Track Ticks components.
- Active scene view (declared threats, scene tags, roll panel).
- GM Dashboard (challenge editor, party roster snapshot, broadcasts).
- Camp mode.
- Firestore data model + Security Rules.
- Real-time `onSnapshot` wiring.
- shadcn primitive adoption (Dialog, Popover, DropdownMenu, Sheet, Tabs).

## 8. Environment Variables

Client (must be `NEXT_PUBLIC_*`):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

Server (admin):
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY` (escaped `\n` → real newlines)
- `SESSION_COOKIE_MAX_AGE_SECONDS` (optional)

## 9. Conventions

- **No client-side Firestore writes from players.** Server Actions only.
- **Re-verify cookie inside every Server Action** with `requireUser()`.
- **No optimistic UI** on GM-pushed state changes.
- **No raw Tailwind palette** (`bg-yellow-500`, etc.) — design tokens only.
- **Every colored class needs a `dark:` variant.**
- **`zustand` is for UI-only state.** Firestore data lives in `onSnapshot` listeners, never duplicated into stores.
- **shadcn primitives**: install with `npx shadcn@latest add`, then immediately align with §14 of design system (tokens, dark, 8px grid, focus ring) and add header comment.
