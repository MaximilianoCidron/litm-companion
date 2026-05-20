# LitM Companion — Project Context

> **Update rule:** Refresh after any change that alters stack, architecture, routes, data model, auth flow, or major features — **before** committing those changes. Canonical snapshot of "what this app is right now."

Last updated: 2026-05-19 (interactive ThemeCard: editable name/type/quest, power-tag add/remove, special improvements CRUD, ±1 track stepper, advancement badge)

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
│   │   ├── dashboard/
│   │   │   ├── page.tsx                       # getMyCharacters (real Admin SDK read)
│   │   │   ├── loading.tsx                    # 8-card skeleton grid
│   │   │   └── error.tsx                      # Client error boundary
│   │   └── characters/[charId]/
│   │       ├── layout.tsx                     # getCharacter + CharacterProvider + tab navs
│   │       ├── page.tsx                       # redirect → ./hero
│   │       ├── loading.tsx                    # Two-column shell skeleton
│   │       ├── error.tsx                      # Client error boundary (detects forbidden)
│   │       ├── not-found.tsx                  # "Hero not found" card
│   │       ├── hero/page.tsx                  # thin: <HeroSection />
│   │       ├── themes/page.tsx                # thin: <ThemesSection />
│   │       ├── backpack/page.tsx              # thin: <BackpackSection />
│   │       ├── fellowship/page.tsx            # thin: <FellowshipSection />
│   │       └── statuses/page.tsx              # thin: <StatusesSection />
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
│       │   ├── CreateCharacterDialog.tsx      # Wired to createCharacter Server Action
│       │   ├── BookTabNav.tsx                 # Vertical book-tab nav (md+)
│       │   ├── BookTabBarMobile.tsx           # Horizontal scrollable tabs (< md)
│       │   ├── theme-card/                    # Interactive theme card (replaces ThemeCardPlaceholder)
│       │   │   ├── index.tsx                  # <ThemeCard theme characterId canEdit>
│       │   │   ├── type-selector.tsx          # DropdownMenu grouped by Might level
│       │   │   ├── power-tag-list.tsx         # Read-only TagPill list w/ hover × remove
│       │   │   ├── power-tag-adder.tsx        # Inline "+ Add tag" editor
│       │   │   ├── weakness-tag-row.tsx       # EditableField → updateTag(rename)
│       │   │   ├── track-row.tsx              # 3× Track (±1 stepper) + AdvancementBadge
│       │   │   ├── advancement-badge.tsx      # Toast placeholder; one-shot fx-celebrate glow
│       │   │   └── special-improvements-list.tsx  # Add/edit/remove rows
│       │   ├── CharacterProvider.tsx          # Client: hosts useCharacterSnapshot + exports useCharacter()
│       │   ├── CharacterHeader.tsx            # Client: live name + concept (reads context)
│       │   ├── ConnectionBanner.tsx           # Client: rust-soft strip when listener errors
│       │   └── sections/                      # All "use client", consume useCharacter()
│       │       ├── HeroSection.tsx
│       │       ├── ThemesSection.tsx
│       │       ├── BackpackSection.tsx
│       │       ├── FellowshipSection.tsx
│       │       └── StatusesSection.tsx
│       ├── actions/
│       │   ├── create-character.ts            # createCharacter
│       │   ├── update-tag.ts                  # updateTag (rename | scratch)
│       │   ├── burn-tag.ts                    # burnTag (power tags only)
│       │   ├── apply-status.ts                # applyStatus (add | update | clear)
│       │   ├── mark-track.ts                  # markTrack (improve | milestone | abandon)
│       │   ├── update-theme.ts                # updateTheme (rename | retype atomically with mightLevel | setQuest)
│       │   ├── add-power-tag.ts               # addPowerTag (max 12 per theme)
│       │   ├── remove-power-tag.ts            # removePowerTag
│       │   ├── mutate-special-improvements.ts # mutateSpecialImprovements (add | remove | edit)
│       │   └── index.ts                       # barrel (re-exports action fns only)
│       ├── hooks/
│       │   └── use-character-snapshot.ts      # Client: onSnapshot listener; last-known-good preservation
│       ├── lib/
│       │   ├── access.ts                      # requireCharacterAccess (server; used by queries + actions)
│       │   ├── queries.ts                     # getMyCharacters, getCharacter (Admin SDK Server Component reads)
│       │   ├── character-factory.ts           # buildBlankCharacter()
│       │   └── serialize.ts                   # firestoreToCharacter (SDK-agnostic duck-typed snapshot)
│       ├── schemas/
│       │   ├── ids.ts                         # Branded IDs (CharacterId, ThemeId, TagId, StatusId, CampaignId, FellowshipRelationshipId)
│       │   ├── tag.ts                         # PowerTag (refine burned⇒scratched), WeaknessTag, StoryTag
│       │   ├── theme.ts                       # MightLevel, 17 namespaced ThemeType, ThemeSchema (refine type↔mightLevel), inferMightLevel
│       │   ├── status.ts                      # Status (tier 1..6, helpful|hindering)
│       │   ├── backpack.ts                    # Backpack (storyTags max 40, notes ≤ 2000)
│       │   ├── progression.ts                 # Promise 0..5 + quintessences
│       │   ├── identity.ts                    # Identity (name/concept/avatar/legendMistBalance)
│       │   ├── fellowship.ts                  # FellowshipRelationship
│       │   ├── character.ts                   # CharacterSchema + CharacterSummarySchema (authoritative)
│       │   ├── inputs.ts                      # ALL Server Action input schemas
│       │   └── index.ts
│       └── index.ts
└── shared/
    ├── auth/
    │   ├── errors.ts                          # ActionError, ActionResult<T>, ActionErrorCode
    │   ├── require-auth.ts                    # requireAuth() — checkRevoked=true; returns {uid, email, displayName, photoURL}
    │   ├── get-session-user.ts                # Server Component helper: redirect("/login") on UNAUTHENTICATED
    │   ├── with-action.ts                     # withAction(schema, handler) for every Server Action
    │   └── index.ts
    ├── firebase/
    │   ├── client.ts
    │   ├── admin.ts
    │   └── session.ts                         # verifySessionCookie, requireUser
    ├── stores/ui-store.ts                     # Zustand: theme + mobile drawer + active modal
    ├── hooks/
    │   └── use-debounced-field-save.ts        # Generic debounced save with reconcile + state machine
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
        ├── EditableField.tsx                  # Debounced-save input/textarea w/ status indicator
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

**Built (most recent pass — interactive ThemeCard):**
- **`<Track>` primitive** rewritten with `onChange?: (delta: -1 | 1) => void` step semantics. Only the next-empty pip (+1) and last-filled pip (−1) are clickable; other pips are visually present but `pointer-events: none`. Read-only when `onChange` absent.
- **`shared/hooks/use-debounced-field-save.ts`** — generic state machine: `idle → pending → saving → saved → idle` (1.5s flash) or `→ error`. Reconciles with upstream when remote diverges from last-saved.
- **`shared/ui/EditableField.tsx`** — Client wrapper around the hook. `<input>` or `<textarea>` styled as parchment line + status indicator (dot/spinner/check/alert).
- **4 new Server Actions**: `updateTheme` (rename/retype/setQuest — `retype` atomically updates `type` AND `mightLevel`), `addPowerTag` (max 12, UUID id, `PowerTagSchema.parse` pre-push), `removePowerTag`, `mutateSpecialImprovements` (add/remove/edit, max 12).
- **`formatThemeType(type)`** helper in `schemas/theme.ts` — humanizes `origin:skill_trade` → `{ label: "Skill Trade", mightLabel: "Origin" }`.
- **`theme-card/` folder** — 8 subcomponents replacing `ThemeCardPlaceholder`: TypeSelector (DropdownMenu grouped by Might), WeaknessTagRow, PowerTagList + PowerTagAdder, TrackRow (3× Track + AdvancementBadge), AdvancementBadge (toast placeholder + fx-celebrate glow), SpecialImprovementsList, root index composing all.
- **`ThemeCard` root** — leather header w/ TypeSelector + might label; body sections: Name, Power tags, Weakness, Quest, Tracks, Special improvements. `canEdit` from `role === "owner" || "gm"`; when false all inputs/buttons disabled.
- **`ThemeCardPlaceholder.tsx` deleted**; barrel updated.
- **`globals.css`** — added `@keyframes fx-celebrate` + `.fx-celebrate` rule (color-mix glow). Reduced-motion override silences it.

**Built (prior pass — real reads + live listener):**
- **`shared/auth/get-session-user.ts`** — Server Component helper; redirects to `/login` on UNAUTHENTICATED (Server Actions still use `requireAuth` to surface structured errors).
- **`requireAuth` extended** to surface `displayName` + `photoURL` from session claims.
- **`features/character-sheet/lib/access.ts`** — moved from `actions/_shared.ts`. Signature returns `{ role, snap }`; supports both transactional and plain reads. All 5 action call sites updated.
- **`features/character-sheet/lib/queries.ts`** — Admin SDK reads: `getMyCharacters(uid)` (owns-only; composite index added to `firestore.indexes.json`) and `getCharacter(charId, uid)` (authorized via `requireCharacterAccess`, NOT_FOUND maps to `notFound()` at the layout).
- **`features/character-sheet/lib/serialize.ts`** rewritten SDK-agnostic via `SnapshotLike` duck-type. Used by both Admin (server) and Client (`onSnapshot`) paths.
- **`features/character-sheet/hooks/use-character-snapshot.ts`** — Client SDK `onSnapshot` listener. Always preserves last-known-good character on transient errors; surfaces error to UI for `<ConnectionBanner />`.
- **`CharacterProvider`** + **`useCharacter()`** hook — single listener mount point; sections consume via context (never directly).
- **`CharacterHeader`** + **`ConnectionBanner`** — Client Components reading from context.
- **All 5 section components converted to Client Components**, reading from `useCharacter()` and rendering real character fields (themes via `TagPill` + `Track`; story tags; statuses via `StatusTierBar`; companions table; etc.). Empty fields show `—` or italic placeholder; empty multi-line lists fall back to `<Skeleton>`.
- **Dashboard wired to real reads**: `getSessionUser` + `getMyCharacters`. Added `dashboard/loading.tsx` (8-card skeleton grid) + `dashboard/error.tsx` (Client, reset button).
- **Character layout wired**: `getSessionUser` + `getCharacter` (NOT_FOUND → `notFound()`, others → error boundary). Added `loading.tsx`, `error.tsx` (Client, detects "forbidden"), `not-found.tsx`.
- **`firestore.indexes.json`** — added composite index `characters: userId asc + updatedAt desc`.
- **Stubs deleted**: `lib/stubs.ts` gone; barrel cleaned; `grep -r "Stub" src/` returns empty across the feature.

**Built (prior pass — data model + actions):**
- **Authoritative character schemas** (`features/character-sheet/schemas/`) — branded IDs, full Theme/Tag/Status/Track/Identity/Progression/Backpack/Fellowship schemas with refinements.
- **5 Server Actions**: `createCharacter`, `updateTag`, `burnTag`, `applyStatus`, `markTrack`.
- **`buildBlankCharacter`** factory.
- **`CreateCharacterDialog`** wired to `createCharacter`.
- **`firestore.rules` patched** — `characters/{charId}` block uses `data.userId` and `data.campaignIds`.

**Not yet built:**
- **Tag-level interactions** on existing pills: scratch toggle, burn (power-tag pills are read-only with only × remove; click body is a no-op with `TODO(prompt-4)` comment).
- Status tier +/- controls in StatusesSection.
- Theme evolve / replace / improve-claim **actions** (AdvancementBadge fires "Coming soon" toast).
- Story-tag add/rename/burn.
- Active scene view (declared threats, scene tags, roll panel).
- GM Dashboard.
- Camp mode.

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
- **Every Server Action wrapped in `withAction(schema, handler)`** — auto-validates input via Zod + re-verifies cookie via `requireAuth` (`checkRevoked: true`) + uniform `ActionResult<T>` return envelope.
- **Character-touching writes** must go through `requireCharacterAccess(charId, uid, tx?)` inside the transaction. Authorizes owner (`data.userId === uid`) OR GM (`users/{uid}.gmCampaignIds` ∩ `data.campaignIds` non-empty).
- **Firestore Timestamps never leak past the action boundary.** Use `firestoreToCharacter(snap)` to serialize on every read.
- **Branded ID types** (`CharacterId`, `ThemeId`, `TagId`, `StatusId`, `CampaignId`, `FellowshipRelationshipId`) used everywhere — no raw `z.string()` for IDs.
- **Re-verify cookie inside every Server Action** with `requireUser()` or via `withAction` (which calls `requireAuth` internally).
- **No optimistic UI** on GM-pushed state changes.
- **No raw Tailwind palette** (`bg-yellow-500`, etc.) — design tokens only. Especially canonical tag colors flow through `tag-power-*` / `tag-weakness-*` exclusively.
- **Every colored class needs a `dark:` variant.**
- **`zustand` is for UI-only state.** Firestore data lives in `onSnapshot` listeners, never duplicated into stores.
- **No proprietary terms** in user-facing strings, metadata, or file names.
- **Shadcn/Radix primitives** live in `shared/ui/`. Project-specific composites live in `features/<feature>/components/`. Never re-implement what Radix covers.
- **Server Actions passed as props** when a Client Component (e.g., `UserMenu` in `shared/`) needs to invoke an action from a feature (`shared/` cannot import `features/`).
- **One `onSnapshot` per character.** The listener lives only in `<CharacterProvider>`; sections never call `useCharacterSnapshot` directly — consume via `useCharacter()`.
- **Server Components use Admin SDK; Client Components use Client SDK.** Crossing wires is forbidden (security + SSR bug).
- **`getSessionUser`** for Server Components (redirects); **`requireAuth`** for Server Actions (throws typed error via `withAction`).
- **Scrollbars**: OverlayScrollbars only — never use native scrollbars or Radix `ScrollArea`. Global body scrollbar mounted by `<BodyScrollbar />` in `<Providers>`. Inner scrollers use `<ScrollArea>` from `@/shared/ui`. Theme class `os-theme-codex` lives in `globals.css` (light + dark variants).
- **`argsIgnorePattern: "^_"` honored** — unused params prefixed with `_` are intentional stubs (Firestore swap-in points).
