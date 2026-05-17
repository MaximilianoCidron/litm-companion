# LitM Companion — Project Context

> **Update rule:** Refresh after any change that alters stack, architecture, routes, data model, auth flow, or major features — **before** committing those changes. Canonical snapshot of "what this app is right now."

Last updated: 2026-05-16 (UI primitives + app shell + character dashboard scaffold)

---

## 1. Purpose

Companion web app for a tabletop RPG (Mist-engine family). Designed for table-side play: players track character themes/tags/statuses on phones; the Narrator (GM) drives sessions from a tablet or laptop. Real-time sync between participants.

Two roles, two device targets:
- **Player** → mobile-first (phone in portrait, one-handed).
- **Narrator (GM)** → tablet/laptop primary.

Public branding: **Codex**. No proprietary terms in user-facing strings, metadata, or file names.

## 2. Stack

| Layer | Tech | Version |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.2.6 |
| Runtime | React | 19.2.4 |
| Language | TypeScript (strict, `noUncheckedIndexedAccess`) | ^5 |
| Styling | Tailwind CSS v4 (`@theme` tokens in `globals.css`) | ^4 |
| Primitives | Radix UI: `dialog`, `dropdown-menu`, `tabs`, `toast`, `tooltip`, `avatar`, `separator`, `slot`, `visually-hidden` | — |
| Scrollbars | `overlayscrollbars` + `overlayscrollbars-react` (replaces `@radix-ui/react-scroll-area`) | ^2.16 / ^0.5 |
| Variants | `class-variance-authority` + `tailwind-merge` + `clsx` | — |
| Icons | `lucide-react` | ^1.16.0 |
| State (client UI only) | `zustand` + `immer` | ^5 / ^11 |
| Validation | `zod` | ^4 |
| Backend SDK (client) | `firebase` | ^12.13.0 |
| Backend SDK (server) | `firebase-admin` | ^13.10.0 |
| Package manager | pnpm | — |
| Lint | ESLint + `eslint-config-next` + `eslint-plugin-boundaries` | — |

Scripts: `pnpm dev`, `pnpm build`, `pnpm start`, `pnpm lint`, `pnpm typecheck`.

## 3. Database & Real-Time

**Firestore** (Firebase). Stack picked for native `onSnapshot` real-time, server-enforced GM/player visibility via Security Rules, and shared Firebase Auth project.

Wiring:
- Client: `src/shared/firebase/client.ts` → `getFirebaseDb()`.
- Admin (server-only): `src/shared/firebase/admin.ts` → `getAdminDb()`.

**Sync rules** (authoritative — see design system §10):
- All writes through **Next.js Server Actions**; never client-direct from a player.
- Every Server Action **re-verifies** the session cookie via `requireUser()` (defense-in-depth vs CVE-2025-29927).
- Persistent state → optimistic UI OK.
- Ephemeral state (statuses, scratched flags, declared threats) → no optimistic UI; wait for snapshot.
- Offline > 3s → disable mechanical actions, show banner.
- Camp mode → batch writes per character.

## 4. Authentication

- **Firebase Auth** (email/password + Google popup).
- Client signs in → `getIdToken(true)` → `POST /api/auth/session` exchanges for httpOnly session cookie (`__session`).
- Client-side Firebase session dropped after exchange — cookie is sole source of truth.
- Cookie max-age: 5 days default (`SESSION_COOKIE_MAX_AGE_SECONDS` env override).
- `(app)/layout.tsx` is the server-side gate via `verifySessionCookie`.
- Sign-out: Server Action `signOutAction` revokes refresh tokens + clears cookie + redirects to `/login`.

## 5. Directory Structure

```
src/
├── app/                                       # Next.js App Router
│   ├── layout.tsx                             # Root: fonts, ThemeScript, Providers, metadata
│   ├── page.tsx                               # Redirect → /dashboard or /login
│   ├── globals.css                            # Tailwind v4 @theme tokens + base styles
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (app)/                                 # Auth-guarded shell
│   │   ├── layout.tsx                         # verifySessionCookie + AppHeader
│   │   ├── dashboard/page.tsx                 # Character grid (stub data)
│   │   └── characters/[charId]/
│   │       ├── layout.tsx                     # Char fetch + BookTabNav + BookTabBarMobile
│   │       ├── page.tsx                       # redirect → ./hero
│   │       ├── hero/page.tsx
│   │       ├── themes/page.tsx
│   │       ├── backpack/page.tsx
│   │       ├── fellowship/page.tsx
│   │       └── statuses/page.tsx
│   └── api/auth/session/route.ts              # POST/DELETE session cookie
├── features/
│   ├── auth/
│   │   ├── components/LoginForm.tsx
│   │   ├── actions/sign-out.ts                # signOutAction
│   │   ├── lib/client-auth.ts
│   │   ├── schemas/login.ts
│   │   └── index.ts
│   └── character-sheet/
│       ├── components/
│       │   ├── DashboardHeader.tsx
│       │   ├── CharacterGrid.tsx
│       │   ├── CharacterGridCard.tsx
│       │   ├── CreateCharacterCard.tsx
│       │   ├── CreateCharacterDialog.tsx
│       │   ├── BookTabNav.tsx                 # Vertical book-tab nav (md+)
│       │   ├── BookTabBarMobile.tsx           # Horizontal scrollable tabs (< md)
│       │   ├── ThemeCardPlaceholder.tsx
│       │   └── sections/
│       │       ├── HeroSection.tsx
│       │       ├── ThemesSection.tsx
│       │       ├── BackpackSection.tsx
│       │       ├── FellowshipSection.tsx
│       │       └── StatusesSection.tsx
│       ├── actions/create-character.ts        # Placeholder Server Action
│       ├── lib/stubs.ts                       # getMyCharactersStub, getCharacterStub (TODO: Firestore)
│       ├── schemas/character.ts               # Minimal Zod (Character, CharacterSummary, ThemePlaceholder)
│       ├── schemas/index.ts
│       └── index.ts
└── shared/
    ├── firebase/
    │   ├── client.ts
    │   ├── admin.ts
    │   └── session.ts                         # verifySessionCookie, requireUser
    ├── stores/ui-store.ts                     # Zustand: theme + mobile drawer + active modal
    ├── lib/
    │   ├── cn.ts                              # clsx + tailwind-merge
    │   └── theme.ts                           # Theme type, getStored/setStored/applyTheme
    ├── components/
    │   ├── ThemeScript.tsx                    # Pre-hydration script (FOUC-free)
    │   ├── Providers.tsx                      # TooltipProvider + Toaster + BodyScrollbar + theme hydration
    │   ├── BodyScrollbar.tsx                  # Mounts OverlayScrollbars on document.body
    │   ├── AppHeader.tsx                      # Sticky leather bar w/ breadcrumb
    │   └── UserMenu.tsx                       # Avatar dropdown + theme submenu + sign-out
    └── ui/                                    # Design-system primitives
        ├── button.tsx                         # primary | secondary | ghost | destructive
        ├── input.tsx
        ├── dialog.tsx                         # Radix Dialog w/ leather header strip
        ├── dropdown-menu.tsx                  # Radix DropdownMenu + sub-menu + radio items
        ├── tabs.tsx                           # Radix Tabs (horizontal + vertical)
        ├── toast.tsx + toaster.tsx + use-toast.ts  # Radix Toast + external store
        ├── tooltip.tsx
        ├── avatar.tsx                         # Radix Avatar (sm/md/lg)
        ├── scroll-area.tsx                     # OverlayScrollbars wrapper (theme `os-theme-codex`)
        ├── separator.tsx
        ├── card.tsx                           # Card.Header (leather strip) + Body + Footer
        ├── track.tsx                          # 3- or 5-pip discrete progress
        ├── status-tier-bar.tsx                # 6-segment moss/rust polarity bar
        ├── skeleton.tsx
        ├── tag-pill.tsx                       # Canonical power/weakness/story pill
        ├── tag-pill-icons.tsx                 # Sparkles/Thorn/Flame/Leaf icon exports
        ├── gm-block.tsx                       # GM-veil left-border wrapper
        └── index.ts                           # Barrel
```

**Architectural boundary** (enforced by `eslint-plugin-boundaries`):
`shared/` ← `features/` ← `app/`. Lower layers never import upward. Cross-feature imports are also disallowed.

## 6. Design System

Authoritative rules: `.claude/skills/litm-companion-design-system/SKILL.md`. Project rule (`CLAUDE.md`): **consult this skill before any UI change**.

Highlights:
- 8px spacing grid.
- Three-font system: **Cinzel** (display), **Spectral** (`.prose`), **Inter** (UI/data).
- Color tokens in `globals.css` (Tailwind v4 `@theme`): parchment/ink surfaces, ember brand, moss/rust/crimson semantic, **locked canonical tag colors** (Power = yellow, Weakness = orange), `gm-veil` for GM-only blocks.
- Mobile-first; 44px+ touch targets; WCAG AAA pass on locked tokens.
- Dark mode mandatory on every colored class. `.dark` toggled on `<html>` by ThemeScript pre-hydration + Zustand store post-hydration.
- Leather aesthetic: `bg-ink-muted` for sticky header, book-tab spines, card headers — same in both modes.

## 7. Current Feature State

**Built (this branch):**
- Firebase Auth (email/password + Google).
- Session cookie issuance + verification.
- Server-side route gating.
- Sign-out Server Action.
- Login UI with form validation.
- **Dashboard** with character grid (stub data, 3 mocked characters).
- **Character page shell** with vertical book-tab nav (Hero / Themes / Pack / Fellowship / Status) + horizontal mobile equivalent.
- **5 section placeholder views** (skeletons, ThemeCardPlaceholder, StatusTierBar samples).
- **15 design-system primitives** (`shared/ui/`): Button, Input, Dialog, DropdownMenu, Tabs, Toast/Toaster/use-toast, Tooltip, Avatar, ScrollArea, Separator, Card, Track, StatusTierBar, Skeleton, TagPill, GMBlock.
- **App shell**: sticky leather header (Codex brand + breadcrumb + UserMenu), TooltipProvider + Toaster providers, ThemeScript for FOUC-free dark mode.
- **Theme system**: light/dark/system via `useUIStore`, persisted in `localStorage` (`codex.theme`), pre-hydration script + post-hydration store sync.
- **CreateCharacterDialog** placeholder (Server Action stub → toast.success "Coming soon").

**Not yet built:**
- Firestore data model + Security Rules.
- Real character schemas (full Theme, Tag, Status, Track entities).
- Real `getCharacterStub` → Firestore admin query.
- Real `createCharacterAction` (write path).
- Interactive Tag/Status/Track components (tap-to-invoke, scratch, burn).
- Active scene view (declared threats, scene tags, roll panel).
- GM Dashboard.
- Camp mode.
- Real-time `onSnapshot` wiring.

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
- `FIREBASE_ADMIN_PRIVATE_KEY` (escaped `\n` → real newlines at runtime)
- `SESSION_COOKIE_MAX_AGE_SECONDS` (optional, default 5 days)

## 9. Conventions

- **No client-side Firestore writes from players.** Server Actions only.
- **Re-verify cookie inside every Server Action** with `requireUser()`.
- **No optimistic UI** on GM-pushed state changes.
- **No raw Tailwind palette** (`bg-yellow-500`, etc.) — design tokens only. Especially canonical tag colors flow through `tag-power-*` / `tag-weakness-*` exclusively.
- **Every colored class needs a `dark:` variant.**
- **`zustand` is for UI-only state.** Firestore data lives in `onSnapshot` listeners, never duplicated into stores.
- **No proprietary terms** in user-facing strings, metadata, or file names.
- **Shadcn/Radix primitives** live in `shared/ui/`. Project-specific composites live in `features/<feature>/components/`. Never re-implement what Radix covers.
- **Server Actions passed as props** when a Client Component (e.g., `UserMenu` in `shared/`) needs to invoke an action from a feature (`shared/` cannot import `features/`).
- **Scrollbars**: OverlayScrollbars only — never use native scrollbars or Radix `ScrollArea`. Global body scrollbar mounted by `<BodyScrollbar />` in `<Providers>`. Inner scrollers use `<ScrollArea>` from `@/shared/ui`. Theme class `os-theme-codex` lives in `globals.css` (light + dark variants).
- **`argsIgnorePattern: "^_"` honored** — unused params prefixed with `_` are intentional stubs (Firestore swap-in points).
