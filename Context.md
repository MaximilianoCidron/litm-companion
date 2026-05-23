# LitM Companion — Project Context

> **Update rule:** Refresh after any change that alters stack, architecture, routes, data model, auth flow, or major features — **before** committing those changes. Canonical snapshot of "what this app is right now."

Last updated: 2026-05-22 (Challenges feature: GM-only `campaigns/{cid}/challenges/{id}` subcollection with full editor — identity, tags, statuses, limits, threats, notes — and atomic `deliverThreat` action that applies templated consequences to player characters; Camp/Rest flow: `endCampActivity` action + `<MakeCampDialog>` with rest/reflect/campAction; Roll History view at `/characters/[charId]/history`; vertical-text `BookTabNav` with 6 sections; `<CharacterHeader>` removed)

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
- Camp mode → atomic per-character via `endCampActivity` (single transaction).

Collections:
- `characters/{charId}` — owner + GM r/w. Sub: `rolls/{rollId}` server-written; reads gated to owner + GM.
- `campaigns/{campaignId}` — GM + member read; server-only write. Sub: `challenges/{challengeId}` GM-only read; server-only write.
- `users/{uid}` — self-only.
- `invitations/{invitationId}` — single-doc get for redemption flow; list gated to GM via `where(campaignId,==,X)`.

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
│   │   ├── dashboard/                         # Character grid (own characters)
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
│       │   ├── use-challenges.ts              # Live list onSnapshot (GM-gated by rules)
│       │   ├── use-challenge-snapshot.ts
│       │   └── use-roll-history.ts            # Live characters/{id}/rolls limit 30 desc
│       ├── lib/
│       │   ├── access.ts                      # requireCharacterAccess + requireCampaignGm + requireCampaignMembership
│       │   ├── queries.ts                     # getMyCharacters, getCharacter, getCampaign, getMyCampaigns, getCampaignWithRoster, getCharacterWithCampaign, getInvitation, listChallenges, getChallenge
│       │   ├── character-factory.ts           # buildBlankCharacter + buildBlankTheme
│       │   ├── campaign-factory.ts            # buildBlankFellowship + buildBlankChallenge
│       │   ├── power-calc.ts                  # computePower + resolveInvocations (shared); rejects scratched fellowship tags
│       │   ├── serialize.ts                   # firestoreTo{Character,Campaign,Invitation,RollRecord,Challenge}; exported toIso helper
│       │   └── __tests__/power-calc.test.ts   # node:test
│       ├── stores/
│       │   └── roll-builder.ts                # Zustand; resultDialogAnimate flag for live vs replay
│       ├── schemas/
│       │   ├── ids.ts                         # Branded IDs: Character/Theme/Tag/Status/Campaign/FellowshipRelationship/Roll/Invitation/Challenge/Threat/Limit
│       │   ├── tag.ts                         # PowerTag (refine burned⇒scratched), WeaknessTag, StoryTag (incl. preserved default false)
│       │   ├── theme.ts                       # MightLevel, 17 ThemeType, refinement type↔mightLevel
│       │   ├── status.ts / backpack.ts / progression.ts / identity.ts / fellowship.ts
│       │   ├── character.ts                   # CharacterSchema (4-theme tuple) + Summary
│       │   ├── campaign.ts                    # CampaignSchema + FellowshipThemeSchema + CampaignRosterEntry + Summary
│       │   ├── invitation.ts                  # InvitationSchema + InvitationStatusSchema
│       │   ├── roll.ts                        # TagLocation + ResolvedTagInvocation + RollRecord + RollTier
│       │   ├── challenge.ts                   # ChallengeRole (11) + CHALLENGE_ROLE_DESCRIPTIONS + ChallengeTag + ChallengeLimit + ConsequenceTemplate + ChallengeThreat + Challenge + Summary
│       │   ├── inputs.ts                      # ALL Server Action input schemas
│       │   └── index.ts
│       └── index.ts
└── shared/
    ├── auth/
    │   ├── errors.ts                          # ActionError (UNAUTHENTICATED|FORBIDDEN|NOT_FOUND|VALIDATION|INVALID_STATE|INTERNAL), ActionResult<T>
    │   ├── require-auth.ts                    # requireAuth() checkRevoked=true
    │   ├── get-session-user.ts                # Server Component helper; redirect("/login") on UNAUTHENTICATED
    │   ├── with-action.ts                     # withAction(schema, handler)
    │   └── index.ts
    ├── firebase/
    │   ├── client.ts / admin.ts / session.ts
    ├── stores/ui-store.ts
    ├── lib/
    │   ├── cn.ts
    │   ├── theme.ts
    │   ├── dice.ts                            # server-only secureRollD6() via node:crypto
    │   └── format.ts                          # formatRelativeTime (Intl.RelativeTimeFormat)
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

**Built (most recent pass — Challenges, GM-only):**
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
