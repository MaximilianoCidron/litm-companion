# LitM Companion — Project Context

> **Update rule:** Refresh after any change that alters stack, architecture, routes, data model, auth flow, or major features — **before** committing those changes. Canonical snapshot of "what this app is right now."

Last updated: 2026-05-25 (User settings + avatar uploads pass: `userSettings/{uid}` collection with live listener + `<UserSettingsProvider>` + `/settings` route; per-character avatar uploads via Firebase Storage + `storage.rules`; reCAPTCHA v3 **App Check** initialized in `client.ts` — enforcement gated at API edge only, **never** via `request.app` inside Firestore rules (silent permission-denied trap); `<AuthSyncGuard>` reconciles client SDK ↔ session cookie drift and detects revoked refresh tokens; theme cookie pre-paint; presence heartbeat loop; pending-threat reaction banner; campaign session log + bulk cleanup + pending allocations)

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

## 3. Database, Storage & Real-Time

**Firestore** (Firebase). Stack picked for native `onSnapshot` real-time, server-enforced GM/player visibility via Security Rules, and shared Firebase Auth project.

**Firebase Storage** for user-uploaded avatars. Gated by `storage.rules` (per-user owner path).

**App Check** (reCAPTCHA v3) initialized in `src/shared/firebase/client.ts` via `getFirebaseAppCheck()` → idempotent boot before any Auth/Firestore/Storage handle is returned. Dev uses `NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN` (UUID registered in Firebase Console → App Check → Apps → Manage debug tokens). **Enforcement is configured at the Firebase Console API edge — NEVER re-checked inside Firestore rules.** See §9 for the load-bearing rule.

Wiring:
- Client: `src/shared/firebase/client.ts` → `getFirebaseApp()`, `getFirebaseAuth()`, `getFirebaseDb()`, `getFirebaseStorage()`, `getFirebaseAppCheck()`. Each accessor calls `ensureAppCheckBooted()` so App Check is initialized before the underlying SDK handle is created.
- Admin (server-only): `src/shared/firebase/admin.ts` → `getAdminAuth()`, `getAdminDb()`, `getAdminStorage()`.

**Sync rules** (authoritative — see design system §10):
- All writes through **Next.js Server Actions**; never client-direct from a player. (Exception: avatar **uploads** go directly to Firebase Storage from the client SDK; the Firestore commit recording the URL still goes through `setCharacterAvatar` Server Action.)
- Every Server Action **re-verifies** the session cookie via `requireUser()` (defense-in-depth vs CVE-2025-29927).
- Persistent state → optimistic UI OK.
- Ephemeral state (statuses, scratched flags, declared threats) → no optimistic UI; wait for snapshot.
- Offline > 3s → disable mechanical actions, show banner.
- Camp mode → atomic per-character via `endCampActivity` (single transaction).

Firestore collections:
- `characters/{charId}` — owner + GM r/w. Sub: `rolls/{rollId}` server-written; reads gated to owner + GM. Includes structured `avatar?: { mainUrl, thumbUrl }` field populated by `setCharacterAvatar`.
- `campaigns/{campaignId}` — GM + member read; server-only write. Subs: `challenges/{challengeId}` GM-only read; `sessionLog/{entryId}` any-member read (server-written); `engagedChallenges/{challengeId}` denormalized player-visible mirror; `sessions/{sessionId}` session boundary docs; `pendingThreats/{ptId}` reaction state machine.
- `users/{uid}` — self-only.
- `userSettings/{uid}` — self-only read; server-only write (Admin SDK via `updateUserSettings`). Holds `themePreference`, `hidePresence`, `showInvitationToasts`, `showPendingThreatToasts`, `confirmBeforeRolling`, `showRetiredCharacters`. Live listener at `useUserSettingsListener`.
- `presence/{uid}` — heartbeat docs (server-written by `pingPresence`). Any signed-in user reads; never client-written. Listener-driven green-dot UI gated by `hidePresence` setting.
- `invitations/{invitationId}` — single-doc get for redemption flow; list gated to the **addressee** (`where(directedAtUid,==,uid)`) only. GM-side listing uses a Server Action with Admin SDK because OR-with-cross-doc-`get()` cannot ride list rules.
- `challenges/{challengeId}` (top-level, separate from campaign subcollection) — GM-only standalone challenges.

Storage paths:
- `users/{uid}/characters/{characterId}/avatar/main.{ext}` + `.../thumb.{ext}` — owner-only write; public read of own folder. Rules in `storage.rules`.

## 4. Authentication

- **Firebase Auth** (email/password + Google popup via `signInWithPopup`).
- Client signs in → `getIdToken(true)` → `POST /api/auth/session` exchanges for httpOnly session cookie (`__session`). The session POST also pre-populates the **theme cookie** from the user's saved `themePreference` so SSR doesn't flash on the next render (best-effort; non-auth-critical).
- **Client SDK session is kept alive** after the exchange — Firestore `onSnapshot` listeners run with the client SDK's ID token and rules check `request.auth`. The httpOnly cookie still gates Server Actions.
- Cookie max-age: 5 days default (`SESSION_COOKIE_MAX_AGE_SECONDS` env override).
- `(app)/layout.tsx` is the server-side gate via `verifySessionCookie`.
- `(app)/layout.tsx` also mounts **`<AuthSyncGuard serverUid={user.uid} />`** — reconciles three drift cases between the client SDK and the session cookie:
  1. **Client SDK has no user, cookie says signed in** → wait `NO_USER_GRACE_MS` (1500 ms) for IndexedDB hydration, then `forceSignOutToLogin()`.
  2. **Cached client user but refresh token revoked server-side** → `getIdToken(true)` throws → `forceSignOutToLogin()` (so listeners don't loop on `permission-denied`).
  3. **uid drift** (cookie vs client SDK currentUser) → `refreshSession()` re-mints the cookie from the live ID token; if that fails, `forceSignOutToLogin()`.
  `forceSignOutToLogin` always uses `window.location.assign("/login")` (hard nav) so in-flight Firestore listeners tear down before `/login` mounts.
- **`refreshSession()`** (`src/shared/auth/refresh-session.ts`) — force-refreshes the ID token, POSTs to `/api/auth/session` to re-mint the cookie. Caller follows with `router.refresh()` to pick up new claims (e.g., updated `displayName` after `updateDisplayName`).
- **`updateDisplayName`** Server Action updates `auth/users` via Admin SDK; client follows with `refreshSession()` + `router.refresh()` to surface new name in `<UserMenu>`/breadcrumbs without a re-login.
- Sign-out: Server Action `signOutAction` revokes refresh tokens + clears cookie + clears theme cookie + redirects to `/login`. Client component `<UserMenu>` also calls `firebaseSignOut(getFirebaseAuth())` **first** so client SDK listeners stop firing before the cookie is cleared.

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
│   │   ├── layout.tsx                         # verifySessionCookie + UserSettingsProvider + AuthSyncGuard + ThemeApplier + HeartbeatLoop + AppHeaderContainer
│   │   ├── dashboard/                         # Character grid (own characters) + IncomingInvitationsSection
│   │   ├── settings/                          # /settings page
│   │   │   ├── page.tsx                       # <SettingsView />
│   │   │   └── loading.tsx
│   │   ├── campaigns/
│   │   │   ├── page.tsx                       # getMyCampaigns list + Create dialog
│   │   │   ├── loading.tsx / error.tsx
│   │   │   └── [campaignId]/
│   │   │       ├── layout.tsx                 # getCampaignWithRoster + Campaign+RosterProvider
│   │   │       ├── page.tsx                   # <CampaignPageShell />
│   │   │       ├── loading.tsx / error.tsx / not-found.tsx
│   │   │       └── challenges/[challengeId]/  # GM-only challenge editor
│   │   │           ├── layout.tsx             # getChallenge + ChallengeProvider
│   │   │           ├── page.tsx               # <ChallengeEditor />
│   │   │           └── loading|error|not-found.tsx
│   │   ├── characters/[charId]/
│   │   │   ├── layout.tsx                     # getCharacterWithCampaign + Character+Campaign providers + tab navs + <RollPanel /> + <RollResultDialog />
│   │   │   ├── page.tsx                       # redirect → ./hero
│   │   │   ├── loading.tsx                    # thin sidebar (md:w-14) + 6-tab skeleton
│   │   │   ├── error.tsx / not-found.tsx
│   │   │   ├── hero/page.tsx                  # <HeroSection />
│   │   │   ├── themes/page.tsx
│   │   │   ├── backpack/page.tsx
│   │   │   ├── fellowship/page.tsx
│   │   │   ├── statuses/page.tsx
│   │   │   └── history/                       # roll history list
│   │   │       ├── page.tsx                   # <HistoryView />
│   │   │       └── loading.tsx
│   │   └── invite/[token]/                    # invitation redemption surface
│   │       ├── page.tsx
│   │       └── not-found.tsx
│   └── api/auth/session/route.ts              # POST/DELETE session cookie
├── features/
│   ├── auth/
│   │   ├── components/LoginForm.tsx
│   │   ├── actions/sign-out.ts
│   │   ├── lib/client-auth.ts
│   │   ├── schemas/login.ts
│   │   └── index.ts
│   └── character-sheet/
│       ├── components/
│       │   ├── DashboardHeader.tsx
│       │   ├── CharacterGrid.tsx / CharacterGridCard.tsx
│       │   ├── CreateCharacterCard.tsx / CreateCharacterDialog.tsx
│       │   ├── AuthSyncGuard.tsx                # Client SDK ↔ session cookie reconciliation (see §4)
│       │   ├── UserSettingsProvider.tsx         # useUserSettingsListener + useUserSettings() context
│       │   ├── ThemeApplier.tsx                 # Mirrors themePreference → <html>.dark + localStorage + matchMedia for "system"
│       │   ├── AppHeaderContainer.tsx           # Consumes useUserSettings() → AppHeader (decouples server data fetch from client settings reads)
│       │   ├── avatar/
│       │   │   ├── avatar-uploader.tsx          # File picker + processAvatar() + uploadAvatar() + setCharacterAvatar action; ConfirmDialog on remove
│       │   │   └── character-avatar.tsx         # Read-only avatar with fallback initials
│       │   ├── presence/heartbeat-loop.tsx      # Side-effect only; pingPresence every 30s; sleeps when settings.hidePresence
│       │   ├── settings/                        # SettingsView (sections below; mounted at /settings)
│       │   │   ├── settings-view.tsx
│       │   │   ├── setting-row.tsx              # Reusable label/control/help triplet
│       │   │   ├── account-section.tsx          # Display name (debounced inline edit + refreshSession) + sign-out
│       │   │   ├── appearance-section.tsx      # Theme radio (light/dark/system)
│       │   │   ├── defaults-section.tsx         # confirmBeforeRolling, showRetiredCharacters
│       │   │   ├── notifications-section.tsx    # showInvitationToasts, showPendingThreatToasts
│       │   │   └── privacy-section.tsx          # hidePresence
│       │   ├── invite/
│       │   │   ├── incoming-invitations-section.tsx  # Live listener for directed invitations; toast on arrival when showInvitationToasts
│       │   │   └── invitation-card.tsx
│       │   ├── pending-threat/
│       │   │   ├── banner.tsx                   # Above book-tab nav inside character layout; filters campaign.pendingThreats to current char; toast on first arrival when showPendingThreatToasts
│       │   │   ├── reaction-decision.tsx        # Player decides: react or absorb
│       │   │   └── reaction-allocation.tsx      # Allocate reaction roll spend (preserves pending-threat target on roll completion)
│       │   ├── BookTabNav.tsx                 # Thin md:w-14 vertical-text sidebar (6 tabs incl. History)
│       │   ├── BookTabBarMobile.tsx           # Horizontal scrollable tabs (< md)
│       │   ├── ConnectionBanner.tsx           # rust-soft strip when listener errors
│       │   ├── CharacterProvider.tsx          # useCharacterSnapshot + useCharacter()
│       │   ├── CampaignProvider.tsx           # Char-scoped OR fixed-campaign variant; useCampaign() returns {status, campaign, role, error}
│       │   ├── RosterProvider.tsx             # Server-fetched campaign roster; useRoster()
│       │   ├── challenge-provider.tsx         # useChallengeSnapshot + useChallenge() (mounted only on challenge detail route)
│       │   ├── moment-of-fulfillment-badge.tsx
│       │   ├── theme-card/                    # Interactive theme card (TypeSelector, tags, weakness, tracks, advancement dialogs, improvements)
│       │   ├── roll-builder/                  # Persistent roll panel (desktop sidebar + mobile bottom-sheet) + RollResultDialog (live + replay modes)
│       │   ├── statuses/                      # Player status CRUD (StatusManager + StatusEditor + AddStatusForm)
│       │   ├── backpack/add-story-tag-form.tsx
│       │   ├── fellowship/                    # FellowshipDisplay (canEdit branches GM) + RelationshipManager + add-relationship-form
│       │   ├── camp/                          # Make-camp dialog flow
│       │   │   ├── make-camp-button.tsx
│       │   │   ├── make-camp-dialog.tsx       # Activity picker + story-tag preservation + summary
│       │   │   ├── activity-picker.tsx        # rest | reflect | campAction
│       │   │   ├── reflect-theme-picker.tsx   # disables themes already at improve===3
│       │   │   ├── story-tag-preservation-list.tsx  # Two-column toggle
│       │   │   ├── camp-summary.tsx
│       │   │   └── helpers.ts                 # forecastCamp + buildCampSummaryToast
│       │   ├── history/                       # Roll history surface
│       │   │   ├── index.tsx                  # <HistoryView />
│       │   │   ├── filter-bar.tsx             # all / success / mixed / failure / reactions chips
│       │   │   ├── roll-list.tsx
│       │   │   ├── roll-list-row.tsx          # Row opens RollResultDialog in replay mode
│       │   │   └── empty-state.tsx
│       │   ├── campaign/                      # Campaign page surfaces
│       │   │   ├── campaign-page-shell.tsx
│       │   │   ├── campaign-badge.tsx
│       │   │   ├── roster-view.tsx
│       │   │   ├── invitations-panel.tsx / create-invitation-dialog.tsx
│       │   │   ├── settings-panel.tsx / transfer-gm-dialog.tsx
│       │   │   ├── create-campaign-dialog.tsx
│       │   │   ├── bulk-cleanup/dialog.tsx     # Preview + execute campaign cleanup (orphaned chars/invitations/etc.)
│       │   │   ├── pending-allocations/        # GM surface for unresolved player reactions
│       │   │   │   ├── index.tsx
│       │   │   │   ├── allocation-dialog.tsx
│       │   │   │   └── pending-allocation-row.tsx
│       │   │   ├── session-log/                # Auto-appended log of significant actions
│       │   │   │   ├── filter-bar.tsx
│       │   │   │   └── helpers.ts
│       │   │   └── challenges/                # ChallengesPanel mounted in CampaignPageShell GM-only
│       │   │       ├── index.tsx              # <ChallengesPanel />
│       │   │       ├── challenge-list.tsx / challenge-card.tsx
│       │   │       └── create-challenge-dialog.tsx
│       │   ├── challenge/                     # Full ChallengeEditor (GM-only route)
│       │   │   ├── index.tsx                  # <ChallengeEditor />
│       │   │   ├── identity-section.tsx       # Name + concept + RolePicker + MightPicker
│       │   │   ├── tags-section.tsx           # Challenge tags w/ ChallengeTagAdder (polarity-aware)
│       │   │   ├── statuses-section.tsx       # Challenge-specific status editor + add form
│       │   │   ├── limits-section.tsx         # Label + threshold + progress bar + +/-
│       │   │   ├── threats-section.tsx        # Threat rows w/ DeliverThreatDialog
│       │   │   ├── consequence-template-form.tsx  # Reusable applyStatus|markTrack|scratchTag|custom subform
│       │   │   ├── deliver-threat-dialog.tsx  # 3-step (pickTarget → configure → confirm)
│       │   │   ├── notes-section.tsx          # GM-private notes
│       │   │   ├── delete-section.tsx
│       │   │   ├── role-picker.tsx / might-picker.tsx
│       │   │   └── helpers.ts                 # formatConsequenceTemplate + buildDeliverySuccessMessage
│       │   ├── invite/redeem-invitation-view.tsx
│       │   └── sections/                      # All "use client", consume useCharacter()
│       │       ├── HeroSection.tsx            # Identity + Promise track + MakeCampButton + MoF badge
│       │       ├── ThemesSection.tsx
│       │       ├── BackpackSection.tsx        # Story tag CRUD w/ preserve flag wired
│       │       ├── FellowshipSection.tsx
│       │       └── StatusesSection.tsx
│       ├── actions/                           # All Server Actions (export from index.ts)
│       │   ├── create-character.ts
│       │   ├── set-character-avatar.ts        # Persists {mainUrl, thumbUrl}; validates URLs start with FIREBASE_STORAGE_PREFIX AND point at owner+character folder
│       │   ├── remove-character-avatar.ts     # Clears avatar field; Storage delete is owner-driven client-side (best-effort)
│       │   ├── update-user-settings.ts        # patch-based; per-key validation; Admin SDK
│       │   ├── update-display-name.ts         # Admin SDK auth.updateUser + caller follows with refreshSession()
│       │   ├── get-campaign-cleanup-preview.ts
│       │   ├── bulk-cleanup-campaign.ts       # Multi-doc batch; GM-only; respects pending-threat / pending-allocation guards
│       │   ├── ping-presence.ts               # Server-only write to presence/{uid}; pingPresence({campaignId, characterId})
│       │   ├── update-tag.ts                  # rename | scratch | setPreserved (backpack-only)
│       │   ├── burn-tag.ts
│       │   ├── apply-status.ts                # add | setTier | rename | clear
│       │   ├── mark-track.ts
│       │   ├── update-theme.ts                # rename | retype | setQuest
│       │   ├── add-power-tag.ts / remove-power-tag.ts
│       │   ├── add-story-tag.ts / remove-story-tag.ts
│       │   ├── update-backpack-notes.ts
│       │   ├── mutate-special-improvements.ts
│       │   ├── claim-improvement.ts / evolve-theme.ts / replace-theme.ts
│       │   ├── commit-roll.ts                 # Server 2d6 + Power; writes characters/{id}/rolls/{id}; scratches invoked fellowship tags
│       │   ├── end-camp-activity.ts           # rest|reflect|campAction; atomic per-character
│       │   ├── create-campaign.ts / rename-campaign.ts / transfer-gm.ts
│       │   ├── join-campaign.ts / leave-campaign.ts / kick-from-campaign.ts
│       │   ├── create-invitation.ts / revoke-invitation.ts / redeem-invitation.ts
│       │   ├── mutate-fellowship.ts           # setName | setQuest | tags | weakness | tracks | improvements | refreshTags
│       │   ├── mutate-relationships.ts
│       │   ├── create-challenge.ts / delete-challenge.ts
│       │   ├── mutate-challenge.ts            # Wide 21-op discriminator (identity/tags/statuses/limits/threats)
│       │   ├── deliver-threat.ts              # Atomic single-tx; applies templated consequence to target
│       │   └── index.ts
│       ├── hooks/
│       │   ├── use-character-snapshot.ts
│       │   ├── use-campaign-snapshot.ts
│       │   ├── use-campaign-invitations.ts
│       │   ├── use-incoming-invitations.ts    # Live `invitations where directedAtUid==uid AND status==open`; expired filtered at read time
│       │   ├── use-user-settings-listener.ts  # Live userSettings/{uid}; gated on Firebase Auth client SDK readiness (uid match) to dodge `permission-denied` races
│       │   ├── use-challenges.ts              # Live list onSnapshot (GM-gated by rules)
│       │   ├── use-challenge-snapshot.ts
│       │   └── use-roll-history.ts            # Live characters/{id}/rolls limit 30 desc
│       ├── lib/
│       │   ├── access.ts                      # requireCharacterAccess + requireCampaignGm + requireCampaignMembership
│       │   ├── queries.ts                     # getMyCharacters, getCharacter, getCampaign, getMyCampaigns, getCampaignWithRoster, getCharacterWithCampaign, getInvitation, listChallenges, getChallenge, getUserSettingsServerSide
│       │   ├── character-factory.ts           # buildBlankCharacter + buildBlankTheme
│       │   ├── campaign-factory.ts            # buildBlankFellowship + buildBlankChallenge
│       │   ├── power-calc.ts                  # computePower + resolveInvocations (shared); rejects scratched fellowship tags
│       │   ├── initials.ts                    # getInitials(name) — shared by avatars + UserMenu
│       │   ├── serialize.ts                   # firestoreTo{Character,Campaign,Invitation,RollRecord,Challenge,UserSettings,SessionLogEntry}; exported toIso helper
│       │   └── __tests__/power-calc.test.ts   # node:test
│       ├── stores/
│       │   └── roll-builder.ts                # Zustand; resultDialogAnimate flag for live vs replay
│       ├── schemas/
│       │   ├── ids.ts                         # Branded IDs: Character/Theme/Tag/Status/Campaign/FellowshipRelationship/Roll/Invitation/Challenge/Threat/Limit/PendingThreat/SessionLogEntry
│       │   ├── tag.ts                         # PowerTag (refine burned⇒scratched), WeaknessTag, StoryTag (incl. preserved default false)
│       │   ├── theme.ts                       # MightLevel, 17 ThemeType, refinement type↔mightLevel
│       │   ├── status.ts / backpack.ts / progression.ts / identity.ts / fellowship.ts
│       │   ├── character.ts                   # CharacterSchema (4-theme tuple, structured avatar) + Summary
│       │   ├── campaign.ts                    # CampaignSchema + FellowshipThemeSchema + CampaignRosterEntry + Summary + pendingThreats
│       │   ├── invitation.ts                  # InvitationSchema + InvitationStatusSchema
│       │   ├── roll.ts                        # TagLocation + ResolvedTagInvocation + RollRecord + RollTier
│       │   ├── challenge.ts                   # ChallengeRole (11) + CHALLENGE_ROLE_DESCRIPTIONS + ChallengeTag + ChallengeLimit + ConsequenceTemplate + ChallengeThreat + Challenge + Summary
│       │   ├── user-settings.ts               # UserSettingsSchema + defaultSettingsFor(uid)
│       │   ├── session-log.ts                 # SessionLogEntrySchema (kind discriminator)
│       │   ├── inputs.ts                      # ALL Server Action input schemas (incl. SetCharacterAvatar, UpdateUserSettings, UpdateDisplayName, PingPresence, BulkCleanupCampaign)
│       │   └── index.ts
│       └── index.ts
└── shared/
    ├── auth/
    │   ├── errors.ts                          # ActionError (UNAUTHENTICATED|FORBIDDEN|NOT_FOUND|VALIDATION|INVALID_STATE|INTERNAL), ActionResult<T>
    │   ├── require-auth.ts                    # requireAuth() checkRevoked=true
    │   ├── get-session-user.ts                # Server Component helper; redirect("/login") on UNAUTHENTICATED
    │   ├── with-action.ts                     # withAction(schema, handler)
    │   ├── refresh-session.ts                 # Force getIdToken(true) + re-mint cookie; caller follows with router.refresh()
    │   ├── theme-cookie.ts                    # set/clear theme cookie (read by RSC for pre-paint)
    │   └── index.ts
    ├── firebase/
    │   ├── client.ts                          # getFirebaseApp/Auth/Db/Storage/AppCheck; ensureAppCheckBooted on every accessor; debug token from NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN
    │   ├── admin.ts                           # getAdminAuth/Db/Storage
    │   └── session.ts
    ├── stores/ui-store.ts
    ├── lib/
    │   ├── cn.ts
    │   ├── theme.ts
    │   ├── dice.ts                            # server-only secureRollD6() via node:crypto
    │   ├── format.ts                          # formatRelativeTime (Intl.RelativeTimeFormat)
    │   ├── image-processing.ts                # processAvatar(file) → main + thumb blobs; AvatarProcessingError; resize/recompress to JPEG via canvas
    │   └── avatar-upload.ts                   # uploadAvatar(uid, characterId, processed) → Storage put + returns {mainUrl, thumbUrl}
    ├── hooks/
    │   ├── use-debounced-field-save.ts
    │   └── use-action-with-toast.ts
    ├── components/
    │   ├── ThemeScript.tsx / Providers.tsx / BodyScrollbar.tsx / AppHeader.tsx / UserMenu.tsx
    └── ui/                                    # Design-system primitives
        ├── button.tsx (primary|secondary|ghost|destructive · sm|md|lg|icon)
        ├── input.tsx / dialog.tsx / dropdown-menu.tsx / tabs.tsx
        ├── toast.tsx + toaster.tsx + use-toast.ts (no `info`; use `toast.show`)
        ├── tooltip.tsx / avatar.tsx / scroll-area.tsx / separator.tsx
        ├── card.tsx (default|inset|interactive variants)
        ├── track.tsx / status-tier-bar.tsx / skeleton.tsx
        ├── tag-pill.tsx                       # Read-only OR interactive; onTogglePreserve + Lock icon for preserved story tags
        ├── tag-pill-icons.tsx / gm-block.tsx
        ├── EditableField.tsx / ConfirmDialog.tsx
        └── index.ts
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

**Built (most recent pass — User settings, avatars, App Check, AuthSyncGuard):**
- **`userSettings/{uid}` collection** — per-user preferences doc. `UserSettingsSchema` in `schemas/user-settings.ts`. Keys: `themePreference` (`"light"|"dark"|"system"`), `hidePresence`, `showInvitationToasts`, `showPendingThreatToasts`, `confirmBeforeRolling`, `showRetiredCharacters`. `defaultSettingsFor(uid)` factory used as placeholder. Server reads via `getUserSettingsServerSide(uid)`; client reads via `useUserSettingsListener(uid)` gated on Firebase Auth client SDK readiness (uid match) — listener does **not** attach until `clientAuthReady` to avoid `permission-denied` race during SSR hydration.
- **`updateUserSettings({ patch })`** Server Action — Admin SDK writes; client rule denies all writes.
- **`<UserSettingsProvider>`** in `(app)/layout.tsx` exposes `useUserSettings()` to the whole app shell. Defaults during loading so consumers never see `null`. Consumers: `<ThemeApplier>`, `<AppHeaderContainer>`, `<HeartbeatLoop>`, `<IncomingInvitationsSection>`, `<PendingThreatBanner>`, `<RollButton>`, `<SettingsView>`.
- **`<ThemeApplier>`** — mirrors `themePreference` → `<html>.dark` + `localStorage` (read by pre-paint `<ThemeScript>` to avoid FOUC on next load) + subscribes to `(prefers-color-scheme: dark)` when preference is `"system"`. Replaces the older client-state-only theme toggle.
- **`/settings` route** (`(app)/settings/page.tsx` + `loading.tsx`) — full `<SettingsView>` with Account / Appearance / Defaults / Notifications / Privacy sections. Account section debounces display-name edits via `useDebouncedFieldSave` → `updateDisplayName` → `refreshSession()` → `router.refresh()` so name updates surface immediately in the header.
- **Avatar uploads** — per-character. `processAvatar(file)` in `shared/lib/image-processing.ts` resizes/recompresses to JPEG (main + thumb blobs); `uploadAvatar(uid, characterId, processed)` in `shared/lib/avatar-upload.ts` writes to Storage path `users/{uid}/characters/{cid}/avatar/`. `setCharacterAvatar({mainUrl, thumbUrl})` Server Action validates URLs (`FIREBASE_STORAGE_PREFIX` AND owner+character folder path) and commits to `characters/{cid}.avatar`. `removeCharacterAvatar({characterId})` clears the field.
- **`storage.rules`** — `users/{uid}/characters/{cid}/avatar/{filename}`: only the owner uid in the path can write; reads are public-for-owner (rules check path uid against `request.auth.uid`).
- **App Check (reCAPTCHA v3)** — initialized in `shared/firebase/client.ts` via `getFirebaseAppCheck()` (idempotent; browser-only). Booted by `ensureAppCheckBooted()` called from every public accessor (`getFirebaseAuth`/`Db`/`Storage`) so App Check init runs before the SDK creates the underlying handle. Dev uses `NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN` (UUID registered in Console). Enforcement is configured at the Firebase Console API edge; rules **never** check `request.app != null` — that would silently 403 every dev request whose token failed to attach (see §9 + the rule-change in this pass).
- **`firestore.rules` change (load-bearing):** `isSignedIn()` checks `request.auth != null` only. The previous `hasAppCheck()` helper that ANDed `request.app != null` was removed — it created a double-gate where both edge enforcement and rules had to agree, and any debug-token race silently denied every read across `userSettings`, `invitations`, `characters`, `presence`. App Check belongs at edge enforcement only.
- **`<AuthSyncGuard>`** — mounted in `(app)/layout.tsx`. Reconciles three drift cases between Firebase Auth client SDK and the httpOnly session cookie (see §4): SDK has no user (grace + force sign-out), cached user but revoked refresh token (`getIdToken(true)` throws → force sign-out), uid drift (refresh cookie or sign out). Always uses `window.location.assign("/login")` for sign-out so in-flight Firestore listeners tear down before `/login` mounts.
- **`<HeartbeatLoop>`** — side-effect-only client component mounted in `(app)/layout.tsx`. Pings `pingPresence` every 30s (and immediately on context change). Sleeps entirely when `settings.hidePresence` is true. Pulls current `campaignId` + `characterId` from `presence` Zustand store. Errors are best-effort (a missed beat means appearing offline ~75s sooner).
- **`presence/{uid}`** — server-written heartbeat docs. Rules: any signed-in user reads; client never writes. UI green-dot gated by viewer's own `hidePresence` (you can hide yourself but still see others).
- **`<IncomingInvitationsSection>`** on the dashboard — `useIncomingInvitations(uid)` live-filters directed invitations addressed to the viewer (rules-side restriction: `where(directedAtUid,==,uid) AND where(status,==,"open")`). Composite index added. Expired entries filtered at read time (no background cleanup job in v1). First snapshot seeds a `seenIds` ref without toasting; subsequent arrivals toast when `settings.showInvitationToasts`.
- **`<PendingThreatBanner>`** — above the book-tab nav inside character layout. Subscribes to `campaign.pendingThreats` and filters to `targetCharacterId == character.id`. Shows `<ReactionDecision>` (awaitingReaction) or `<ReactionAllocation>` (reactionRolled). Toast on first arrival when `settings.showPendingThreatToasts`. Reaction state machine extends Roll Builder via `reactingToPendingThreatId` + `reactingToCampaignId`.
- **`<RollButton>`** now branches on `settings.confirmBeforeRolling` — wraps the trigger in a `<ConfirmDialog>` with a `buildRollSummary` description when on. Also supports a `detailedAction` mode bound to a specific challenge.
- **Theme cookie** (`shared/auth/theme-cookie.ts`) — set during session POST from the user's saved `themePreference`; read by RSC layouts before paint to avoid FOUC. Cleared on sign-out alongside the session cookie.
- **`refresh-session.ts`** (`shared/auth/`) — forces `getIdToken(true)` and re-mints the session cookie. Caller follows with `router.refresh()`. Used by `<AuthSyncGuard>` on uid drift and by display-name edits.
- **Campaign session log + bulk cleanup + pending allocations** — server-written `sessionLog/{entryId}` subcollection on campaigns (any-member read), GM `bulkCleanupCampaign` + `getCampaignCleanupPreview` actions with a preview dialog, and GM `<PendingAllocationsPanel>` for unresolved player reactions.
- **`<AppHeader>` decomposition**: `<AppHeaderContainer>` (client, reads `useUserSettings()` + delivers `updateUserSettings` callback) → `<AppHeader>` (presentational) → `<UserMenu>` (sign-out + theme submenu + Settings link). UserMenu signs out the client SDK first (`firebaseSignOut`) **before** awaiting the server action so listeners stop firing against rules with the about-to-be-revoked token.

**Built (prior pass — Challenges, GM-only):**
- **Branded IDs**: `ChallengeId`, `ThreatId`, `LimitId` in `schemas/ids.ts`.
- **`schemas/challenge.ts`** — 11 `ChallengeRole`s with `CHALLENGE_ROLE_DESCRIPTIONS` paraphrases, `ChallengeTag` (polarity from player POV), `ChallengeLimit` (label + threshold + current), `ConsequenceTemplate` discriminator (`applyStatus | markTrack | scratchTag | custom`), `ChallengeThreat`, `ChallengeSchema`, `ChallengeSummarySchema`.
- **Inputs** in `schemas/inputs.ts`: `CreateChallengeInput`, `DeleteChallengeInput`, wide `MutateChallengeInput` (21 ops across identity/tags/statuses/limits/threats), `DeliverThreatInput` with optional `scratchTarget` and `markTrackTarget`.
- **Server Actions**: `create-challenge`, `delete-challenge`, `mutate-challenge` (single-tx wide switch; silent clamp on limit current; idempotent updateThreat), `deliver-threat` (atomic single-tx: reads challenge + character, validates `character.campaignIds.includes(campaignId)`, branches on consequence kind — applyStatus writes new status; markTrack increments theme.tracks[track] clamped [0,3]; scratchTag flips backpack/theme power tag idempotently; custom returns description in result. Intentionally duplicates apply logic from `applyStatus`/`markTrack`/`updateTag` to preserve single transaction).
- **`lib/queries.ts`**: `listChallenges(campaignId, uid)` (GM-gated, limit 50 desc) + `getChallenge(campaignId, challengeId, uid)`. `firestoreToChallenge` in `serialize.ts`.
- **Hooks**: `useChallenges` (live list onSnapshot) + `useChallengeSnapshot` (single doc).
- **`<ChallengeProvider>`** + `useChallenge()` — mounted only on challenge detail route.
- **Route**: `(app)/campaigns/[campaignId]/challenges/[challengeId]/{layout,page,loading,error,not-found}.tsx`. Layout calls `getChallenge`; NOT_FOUND/FORBIDDEN → `notFound()`.
- **`<ChallengesPanel>`** mounted GM-only in `<CampaignPageShell>` as a full-width row (`lg:col-span-2`).
- **`<ChallengeEditor>`** sections: identity (RolePicker dropdown w/ descriptions + MightPicker radio + EditableField name/concept), tags (challenge-specific adder with polarity toggle; reuses `<TagPill>` story-helpful/-hindering palettes), statuses (challenge-specific editor/adder — separate from player's StatusEditor to avoid coupling), limits (label + numeric current/threshold + progress bar; `+`/`-` clamped; Overcome state at threshold; threshold edit dialog), threats (description + consequence summary; `<DeliverThreatDialog>` + edit + delete), notes (GM-private), delete (danger zone w/ redirect on success).
- **`<DeliverThreatDialog>`** — 3-step state machine (`pickTarget` → `configure` → `confirm`) with `aria-live`. Skips `configure` for `applyStatus`/`custom`. `markTrack` configure picks theme (disables themes already at 3). `scratchTag` configure lists target's power tags grouped by theme + backpack story tags (disables scratched/burned). On success: `toast.success(buildDeliverySuccessMessage(result))` + extra `toast.show` for custom description.
- **`<ConsequenceTemplateForm>`** reusable across add + edit. Radio of kind + kind-specific subfields.
- **Firestore rules**: `match /campaigns/{campaignId}/challenges/{challengeId} { allow read: if GM via get(); allow write: if false; }`.

**Built (prior pass — Camp/Rest flow):**
- **Story tag schema** gains `preserved: z.boolean().default(false)`. Backwards-compatible via Zod default — legacy docs parse as `preserved: false`.
- **`UpdateTagInput.patch`** gains `setPreserved` kind. Action rejects on theme/fellowship locations with `INVALID_STATE`.
- **`MutateFellowshipInput.op`** gains `refreshTags` — unscratches all fellowship power tags. GM-driven; no auto-trigger.
- **New `EndCampActivityInput`** + `end-camp-activity.ts` action — single transaction: unscratches non-burned power tags across all themes (burned tags survive camp — explicit comment); drops non-preserved story tags and unscratches survivors; rest clears all hindering statuses; reflect increments target theme.tracks.improve (rejects when already at 3); campAction returns trimmed description for toast.
- **`commit-roll`** scratches each invoked fellowship power tag in the same transaction. `resolveInvocations` rejects scratched fellowship tags with explicit "exhausted — refresh the fellowship" message. Old `TODO(camp-rest-flow)` removed.
- **`<TagPill>`** gains `onTogglePreserve?` + `isPreserved?` props. New menu item "Preserve when camping" / "Discard at next camp" between Rename and Burn; `Lock` icon shown when preserved. `BackpackSection` wires `onTogglePreserve` on story tags.
- **`components/camp/`** — `<MakeCampButton>` (in HeroSection under Promise track, canEdit only), `<MakeCampDialog>` with `<ActivityPicker>`, `<ReflectThemePicker>` (disables themes already at improve===3), `<StoryTagPreservationList>` (two-column toggle), `<CampSummary>` (live forecast). Toast on success + secondary `toast.show` for campAction description.
- **`<FellowshipDisplay>`** gains GM-only "Refresh fellowship tags" `<ConfirmDialog>` next to the power-tags header; falls back to dimmed "All tags ready" when nothing's scratched.
- Tests: `power-calc.test.ts` adds 20a/20b for scratched-fellowship rejection + fresh acceptance.

**Built (prior pass — Roll History view):**
- **`hooks/use-roll-history.ts`** — live `onSnapshot` listener on `characters/{id}/rolls`, `orderBy("createdAt", "desc")` limit 30. Skips malformed docs with `console.warn` to keep the list resilient. The single client-side reader of rolls; no ad-hoc `getDocs` in components.
- **`firestoreToRollRecord`** added to `lib/serialize.ts` (`toIso` exported for reuse).
- **`shared/lib/format.ts`** — `formatRelativeTime(iso)` via `Intl.RelativeTimeFormat` (en). "just now" under 5s, seconds/minutes/hours/days, falls back to `toLocaleDateString` past a week.
- **`stores/roll-builder.ts`** — new `resultDialogAnimate: boolean` flag + `openResultDialog(rollId, animate=true)` signature. `closeResultDialog` resets to `true`. New `useResultDialogAnimate` selector.
- **`<RollResultDialog>`** branches on `animate`: live mode shows staggered dice reveal + `fx-celebrate`; replay mode shows final values immediately, no celebrate class, footer collapses to a single "Close" button (no `setExpanded(false)` side effect).
- **`components/history/`** — `<HistoryView>` (skeleton + error-with-cached-data panel), `<FilterBar>` (radiogroup chips: all/success/mixed/failure/reactions with disabled-when-zero), `<RollList>` + `<RollListRow>` (button row opens `openResultDialog(roll.id, false)`; dice/total span hidden below `sm`).
- **Route** `(app)/characters/[charId]/history/{page,loading}.tsx`. `HistoryView` exported from feature barrel.
- **`<BookTabNav>` redesigned**: width shrunk from `md:w-40` → `md:w-14` (56px); labels rotated via `[writing-mode:vertical-rl] rotate-180`; tabs grow with `flex-1 min-h-32` so vertical text fits. 6 sections now (Hero/Themes/Pack/Fellowship/Status/History). `<BookTabBarMobile>` gets a sixth "Rolls" chip with the `History` icon.
- **`[charId]/loading.tsx`** updated to match (6 tabs, thin sidebar, vertical label skeleton).
- **`<CharacterHeader>`** deleted — redundant with section-internal headings.

**Built (prior pass — Campaigns + Fellowships + Invitations):**
- **Campaign schemas**: `CampaignSchema` (id, name, gmUid, fellowship, roster, characterIds, playerUids, timestamps), `FellowshipThemeSchema`, `CampaignRosterEntry`, `Summary`. `Invitation` schema with `InvitationStatus`.
- **Server Actions**: `createCampaign`, `renameCampaign`, `transferGm`, `joinCampaign`, `leaveCampaign`, `kickFromCampaign`, `createInvitation`, `revokeInvitation`, `redeemInvitation`, `mutateFellowship` (wide discriminator), `mutateRelationships`.
- **Server queries**: `getMyCampaigns`, `getCampaign`, `getCampaignWithRoster`, `getInvitation`.
- **Hooks**: `useCampaignSnapshot`, `useCampaignInvitations`.
- **Providers**: `<CampaignProvider>` (character-scoped OR fixed-campaign) with `useCampaign()` returning `{status, campaign, role}`. `<RosterProvider>` for the campaign-page server-fetched roster.
- **Routes**: `(app)/campaigns/{page,loading,error}.tsx` (list); `(app)/campaigns/[campaignId]/{layout,page,loading,error,not-found}.tsx` (campaign page); `(app)/invite/[token]/{page,not-found}.tsx` (redemption).
- **Components**: `<CampaignPageShell>` (Fellowship + Roster + Invitations + Settings + Challenges panels), `<FellowshipDisplay>` (canEdit branches GM), `<RosterView>`, `<InvitationsPanel>` + `<CreateInvitationDialog>`, `<SettingsPanel>` + `<TransferGmDialog>`, `<RelationshipManager>` + `<AddRelationshipForm>`, `<RedeemInvitationView>`, `<CampaignBadge>`, `<CreateCampaignDialog>`.
- **Firestore rules**: `campaigns/{campaignId}` GM + member read; server-only write. `invitations/{id}` get for any signed-in user (redemption surface) + list gated to GM via `where(campaignId,==,X)`.

**Built (prior pass — Roll Builder):**
- **Roll schemas** in `schemas/roll.ts`. **Input schemas** in `schemas/inputs.ts` (`TagInvocationInputSchema`, `StatusInvocationInputSchema`, `CommitRollInput`).
- **`lib/power-calc.ts`** — `computePower` + `resolveInvocations`. Pure, no I/O, shared client+server. Status rule: highest tier per polarity contributes signed tier; others 0. Power tag +1, burned +3, weakness -1, story +1/-1.
- **`shared/lib/dice.ts`** — server-only `secureRollD6()` via `node:crypto`.
- **`commitRoll` action** — transactional. resolveInvocations + dice + computePower (must match client) + write `rolls/{rollId}` + atomic side effects (burn theme tags, mark Improve on self-invoked weaknesses, scratch single-use story tags, scratch fellowship tags). Tier: `≥10 success / ≥7 mixed / else failure`; reactions tier is `null`.
- **Firestore rules**: `rolls/{rollId}` subcollection server-only writes, owner/GM reads.
- **Zustand store** `roll-builder.ts` — Map for tags, Set for statuses, mightModifier, isReaction, expanded, resultDialogRollId, resultDialogAnimate.
- **Roll Panel UI** (`components/roll-builder/`): desktop sticky sidebar + mobile bottom-sheet via Dialog. `TagPicker` (theme + backpack + fellowship + relationship groups), `StatusPicker`, `MightSelector`, `ReactionToggle`, `PowerSummary`, `RollButton`, `RollResultDialog`.
- **Character layout** mounts `<RollPanel />` + `<RollResultDialog />` inside the provider tree.

**Built (prior pass — advancement flows):**
- `claimImprovement`, `evolveTheme`, `replaceTheme` actions. Server enforces respective track === 3.
- `nextMightLevel`, `formatMightLevel`, `themeTypesForMightLevel` helpers.
- `buildBlankTheme` factory shared by `buildBlankCharacter` + `replaceTheme`.
- `advancement-dialogs/` folder with shared `DialogFormShell` + `TypeOptionPicker`.
- `AdvancementBadge` dispatcher. `<MomentOfFulfillmentBadge />` at `progression.promise === 5 && canEdit`.

**Built (prior pass — interactive tags + Status manager + Backpack CRUD):**
- `UpdateTagInput` with location discriminator. `ApplyStatusInput` discriminator.
- `useActionWithToast` hook. `<ConfirmDialog>` wrapper.
- `<TagPill>` dual-mode (read-only + interactive). Story tag `addStoryTag` / `removeStoryTag` + editable backpack notes via `updateBackpackNotes`.
- `<StatusManager>` + `<StatusEditor>` + `<AddStatusForm>` (player-side).

**Built (prior pass — interactive ThemeCard + tracks + theme editor):**
- `<Track>` primitive w/ step-based `onChange`. `useDebouncedFieldSave` hook. `<EditableField>` wrapper.
- `updateTheme`, `addPowerTag`, `removePowerTag`, `mutateSpecialImprovements`.
- `theme-card/` folder w/ TypeSelector, WeaknessTagRow, PowerTagList + PowerTagAdder, TrackRow, AdvancementBadge, SpecialImprovementsList.

**Built (prior pass — real reads + live listener):**
- `getSessionUser`, `requireCharacterAccess`, `getMyCharacters`, `getCharacter`. `firestoreToCharacter` SDK-agnostic. `useCharacterSnapshot`. `CharacterProvider` + `useCharacter()`. `ConnectionBanner`. 5 section components as Client Components consuming context.
- Dashboard + character layout wired to real reads. `firestore.indexes.json` composite index added.

**Built (prior pass — data model + actions):**
- Authoritative schemas (branded IDs + refinements). 5 baseline Server Actions. `buildBlankCharacter`. `CreateCharacterDialog`. Initial `firestore.rules`.

**Not yet built:**
- Active scene view (declared threats, scene tags, GM-pushed roll panel during play).
- GM Dashboard (multi-character / multi-challenge overview).
- **Moment-of-Fulfillment options** (badge shows at Promise = 5; no action wiring yet — `TODO(prompt-future)`).
- Session log / "what happened" timeline (camp action descriptions are toast-only today).
- Fellowship advancement ritual (improve/milestone/abandon tracks exist but don't fire any flow at 3).

## 8. Environment Variables

Client (must be `NEXT_PUBLIC_*` — only `NEXT_PUBLIC_*` is baked into the browser bundle):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` (optional, Analytics)
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` — reCAPTCHA v3 site key registered in Firebase Console → App Check → Apps. Missing key logs `[app-check] NEXT_PUBLIC_RECAPTCHA_SITE_KEY missing — skipping App Check init.` and the app boots without App Check (dev convenience). For staging/prod this MUST be set.
- `NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN` (dev only) — UUID registered in Firebase Console → App Check → Apps → Manage debug tokens. When set, the SDK uses this stable token instead of generating a new one per page load. **Must use `NEXT_PUBLIC_` prefix** — Next won't ship a server-only env to the browser; a bare `FIREBASE_APPCHECK_DEBUG_TOKEN` is invisible to the bundle and the SDK auto-generates a fresh UUID every reload (forcing you to re-register).

Server (admin):
- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY` (escaped `\n` → real newlines at runtime)
- `SESSION_COOKIE_MAX_AGE_SECONDS` (optional, default 5 days)

## 9. Conventions

- **No client-side Firestore writes from players.** Server Actions only.
- **Every Server Action wrapped in `withAction(schema, handler)`** — auto-validates input via Zod + re-verifies cookie via `requireAuth` (`checkRevoked: true`) + uniform `ActionResult<T>` return envelope.
- **Character-touching writes** go through `requireCharacterAccess(charId, uid, tx?)` inside the transaction. Owner or GM authorized.
- **Campaign-touching writes** go through `requireCampaignGm(campaignId, uid, tx?)` (mutations) or `requireCampaignMembership` (reads where members and GM see the same data).
- **Challenges are GM-only**: enforced at action layer (`requireCampaignGm`) AND Firestore rules. Players never read or write the subcollection.
- **`deliverThreat` is atomic.** Single transaction reads challenge + target character, branches on consequence kind, writes back. Intentionally duplicates apply logic from `applyStatus`/`markTrack`/`updateTag` — do NOT call those actions from within `deliverThreat`. Keep the branches in sync if upstream changes write shape.
- **Camp (`endCampActivity`) is atomic per-character.** Does NOT touch the fellowship doc; fellowship refresh is GM-driven via `mutateFellowship({ kind: "refreshTags" })`.
- **Burned tags survive camp.** Camp unscratches non-burned scratched tags. Burning is more permanent than scratching.
- **Story tag preservation** (`preserved` flag) is backpack-only. `updateTag({ patch: { kind: "setPreserved" } })` rejects on theme/fellowship locations with `INVALID_STATE`.
- **Firestore Timestamps never leak past the action boundary.** Use the `firestoreTo*` helpers (`Character`, `Campaign`, `Invitation`, `RollRecord`, `Challenge`) on every read. `toIso` exported from `serialize.ts`.
- **Branded ID types** everywhere — no raw `z.string()` for IDs. New brands: `ChallengeId`, `ThreatId`, `LimitId`.
- **No optimistic UI** on GM-pushed state changes.
- **No raw Tailwind palette** (`bg-yellow-500`, etc.) — design tokens only.
- **Every colored class needs a `dark:` variant.**
- **`zustand` is for UI-only state.** Firestore data lives in `onSnapshot` listeners, never duplicated into stores.
- **No proprietary terms** in user-facing strings, metadata, or file names.
- **Shadcn/Radix primitives** live in `shared/ui/`. Project-specific composites live in `features/<feature>/components/`.
- **All Server Action calls from Client Components go through `useActionWithToast`** for uniform error feedback.
- **Destructive operations** always go through `<ConfirmDialog>`. Reversible single-click for non-destructive (clear status, scratch).
- **Dice are server-side only.** Never `Math.random()` for any game-affecting outcome.
- **`computePower` and `resolveInvocations`** colocated and shared between client (live preview) and server (`commitRoll`). Any formula change must be in one place.
- **One `onSnapshot` per character.** Listener lives in `<CharacterProvider>`; sections consume via `useCharacter()`.
- **One `onSnapshot` per challenge.** Listener lives in `<ChallengeProvider>`; mounted only on the detail route. Do not mount in the campaign page list — that uses `useChallenges` instead.
- **Roll history single reader.** Components must use `useRollHistory`; no ad-hoc `getDocs` against the rolls subcollection.
- **Server Components use Admin SDK; Client Components use Client SDK.** Crossing wires is forbidden.
- **`getSessionUser`** for Server Components (redirects); **`requireAuth`** for Server Actions (typed errors via `withAction`).
- **`<ChallengesPanel>` mounts GM-only** in `<CampaignPageShell>`. Players don't see it. Player roll picker has no "Challenges" group — players never invoke challenge tags from their rolls in v1.
- **Toast API**: `toast.success`, `toast.warning`, `toast.error`, `toast.show({ title, description })`. No `toast.info`.
- **Scrollbars**: OverlayScrollbars only — never native scrollbars or Radix `ScrollArea`. Global mounted by `<BodyScrollbar />`. Inner scrollers use `<ScrollArea>` from `@/shared/ui`.
- **`argsIgnorePattern: "^_"`** honored — unused params prefixed with `_` are intentional stubs.
- **App Check belongs at edge enforcement, NEVER in Firestore rules.** Do not add `request.app != null` to any rule. Any debug-token race or dev env without App Check then silently 403s every read. Edge enforcement (Firebase Console → App Check → Cloud Firestore → Enforce) is the right layer — it rejects unverified requests before rules evaluate, so the rules stay focused on auth/authorization. Same for Storage: edge enforcement only.
- **Listener attach must be gated on client SDK auth readiness.** Any `onSnapshot` whose rule checks `request.auth.uid` (i.e., all per-user listeners) MUST wait for `onAuthStateChanged` to report `user.uid === serverUid` before attaching, otherwise hydration race fires `permission-denied`. Pattern: `useUserSettingsListener` is the reference implementation (`clientAuthReady` gate).
- **Client SDK stays signed in.** Firestore listeners need `request.auth` populated — that only happens with a live client SDK session. The httpOnly cookie gates Server Actions; the client SDK gates listeners. Both must agree on uid; `<AuthSyncGuard>` is the reconciler.
- **Avatar uploads bypass Server Actions for the binary write only.** The actual JPEG goes client → Firebase Storage directly (gated by `storage.rules` owner-path check). The Firestore commit recording the URL still goes through `setCharacterAvatar`. Do NOT proxy avatar binaries through Server Actions — they're not built for large payloads.
- **`setCharacterAvatar` URL validation is defense-in-depth.** Storage rules already gate writes; the action additionally checks every URL starts with `FIREBASE_STORAGE_PREFIX` AND points at the owner+character folder. Prevents arbitrary URL injection at the Firestore layer if Storage rules ever loosen.
- **`pingPresence` is server-only.** Clients never write to `presence/{uid}` directly. The `<HeartbeatLoop>` fires the Server Action; sleeps entirely under `settings.hidePresence`.
- **`updateUserSettings` is patch-only.** Each key validated independently in `inputs.ts`. Never overwrite the whole doc — partial updates are the safe path.
- **`bulkCleanupCampaign` is GM-only and respects pending guards.** Don't bypass `getCampaignCleanupPreview` — it surfaces what will be deleted; the user confirms the preview before the destructive action runs.
- **Display-name changes round-trip through `refreshSession()`.** After `updateDisplayName`, the auth token's `name` claim is stale until the next refresh — `refreshSession()` forces it and re-mints the cookie. Caller follows with `router.refresh()` to re-render Server Components with new claims.
- **Theme cookie is a pre-paint optimization, not auth.** Safe to be wrong; the `<ThemeApplier>` will correct on hydration. Best-effort populate during session POST; clear on sign-out.
