---
name: litm-companion-design-system
description: Authoritative implementation rules for the Legend in the Mist (LitM) companion app design system. Covers the 8px grid, responsive typography tuned for table-side play, color and semantic tokens for a rustic-fantasy "mist" aesthetic, layout primitives (character sheet, theme cards, GM dashboard, scene view, camp mode), game-canonical Tag/Status/Track conventions, GM-vs-Player visibility patterns, real-time sync UI rules, WCAG AAA accessibility, dark mode, and shadcn/ui + Radix integration. Use this skill whenever building, modifying, or reviewing ANY UI in the LitM project — screens, character sheets, theme cards, tag and status chips, track widgets, GM dashboard, challenge editors, modals, navigation, forms, action/scene views — even when the user's request doesn't mention "design system" or "Tailwind" explicitly. The rules here are authoritative over any external primitive defaults (including shadcn copies in `components/ui/`).
---

# Legend in the Mist Companion — Design System Implementation Guide

Operational rules for building any screen in the *Legend in the Mist* (LitM) companion app. Assumes `globals.css` (Tailwind v4) is set up with the tokens described in §4, and that shadcn/ui has been initialized into `components/ui/` (see §14).

**Golden rule:** if you must choose between "looks evocative" and "is legible in a dim room around a physical table, operable with one hand while the other holds dice", always choose the second. Mood is wallpaper; tags, statuses, and rolls are the foreground.

## Scope note

The stack:
- **Next.js 16** (App Router) — Server Components for the dashboard and static data, Client Components for the live session view, Server Actions for mutations.
- **Tailwind v4** for styling, with project tokens defined in `globals.css`.
- **shadcn/ui + Radix** for primitives (Dialog, DropdownMenu, Popover, Toggle, Tabs, Sheet, etc.) — see §14.
- **Firebase Firestore + Auth** for real-time persistence — every "ephemeral" UI state has a sync story (§10).
- Project-specific components (Theme Card, Tag Chip, Status Chip, Track Ticks, Backpack, Camp Mode, GM panels, Challenge cards) are built in-house on top of those primitives.

Two user roles, two device defaults:
- **Players** → primary on **mobile** (phone at the physical table). Tablet/laptop is supported, but the design target is the phone.
- **Narrator (GM)** → primary on **tablet or laptop**, where the GM Dashboard, Challenge editor, and broadcast controls live. Phone is supported but secondary.

The rules below are authoritative for both in-house components and any shadcn copy living in `components/ui/`. Whoever implements the component must honor these tokens, spacing, typography, responsive behavior, accessibility, real-time sync conventions, and dark-mode rules.

---

## 0. Quick reference

| You need to… | Go to… |
|---|---|
| Space something | §2 (8px grid) |
| Pick a font size | §3 (typography) |
| Pick a color | §4 (color tokens) |
| Decide mobile behavior | §1 (breakpoints) |
| Lay out a screen | §5 (layout primitives) |
| Build a tag, status, or track | §6 |
| Decide what a player sees vs the GM | §7 (visibility) |
| Wire a real-time component | §10 (sync rules) |
| Verify before merging | §11 (checklist) |
| Avoid common mistakes | §12 (anti-patterns) |
| Use a shadcn/Radix primitive | §14 |

---

## 1. Mobile-first responsive

**Always mobile-first.** Unprefixed classes apply from 0px up; `md:` / `lg:` are upward-scaling only.

### Breakpoints

| Prefix | Min-width | Target device |
|---|---|---|
| _(none)_ | 0px | **Player phone at the table** (primary target) |
| `sm:` | 640px | Phone landscape, phablets |
| `md:` | 768px | **GM tablet** — primary GM device |
| `lg:` | 1024px | GM laptop |
| `xl:` | 1280px | Wide desktop — long campaign sessions |
| `2xl:` | 1536px | Large screens (rare) |

**Critical:** unlike a POS where tablet wins, **mobile is the LitM primary target**. If a player view does not work perfectly on a 375×667 phone in portrait, it does not ship. Always test mobile first, then `md:` (GM tablet), then desktop.

### Canonical responsive pattern

```
text-base md:text-lg lg:text-xl
p-4 md:p-6 lg:p-8
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

Never use `max-` (max-width breakpoints) except in extreme cases — they break the mobile-first mental model.

### Orientation reality

Players hold phones in **portrait**, often one-handed. Anything important — invoke buttons, status increment/decrement, roll button — must sit within thumb reach (lower 60% of the screen) on mobile. Treat top areas as "informational only."

---

## 2. 8px grid — spacing system

**Every visible dimension (padding, margin, gap, fixed width/height) must be a multiple of 8px.** Exceptions: borders (1px / 2px) and small radii. Applies to chip heights, gaps, internal padding — everything.

### Authorized scale

Tailwind uses `0.25rem = 4px`. Multiples of 8 we use:

| Tailwind token | Pixels | Typical use |
|---|---|---|
| `0` | 0px | Reset |
| `1` | 4px | **Borders only** or very tight icon-text gaps |
| `2` | **8px** | Gap between label and input, chip internal padding |
| `3` | 12px | Exception allowed only for compact chips/buttons |
| `4` | **16px** | Base card padding, gap between related elements |
| `5` | 20px | **Do not use** |
| `6` | **24px** | Comfortable padding, gap between element groups |
| `8` | **32px** | Generous padding, section separation |
| `10` | **40px** | Hero padding, separation between major blocks |
| `12` | **48px** | Margin between main sections |
| `16` | **64px** | Mobile hero, screen separators |
| `20` | **80px** | Tablet+ hero |
| `24` | **96px** | Desktop hero |

**Forbidden without senior approval:** `p-5`, `p-7`, `p-9`, `gap-5`, `gap-7`, `gap-9`, etc. If you need an intermediate value, raise your hand.

### Minimum touch targets

**44px minimum** for any tappable element. Especially critical for tag invocation and status tier controls — players tap these mid-roll, fast, often without looking carefully.

- Mobile tag chip: `h-11` (44px) or `h-12` (48px) — prefer 48.
- Status tier +/- controls: `h-11 w-11` minimum each.
- Desktop tag chip: `h-10` (40px) acceptable on GM dashboard only.
- Icon hit area: if the icon is 20px, the container must be 44px+ (padding around).

### Border radius (also scaled)

- `rounded` (4px) — inputs, badges, dense chips
- `rounded-md` (6px) — exceptional
- `rounded-lg` (8px) — **default for buttons, cards, modals**
- `rounded-xl` (12px) — theme cards, hero
- `rounded-2xl` (16px) — bottom-sheets, large modals, camp mode panels
- `rounded-full` — avatars, status tier badges, pill chips

---

## 3. Typography hierarchy

A three-font system carries the rustic-fantasy mood without sabotaging legibility at the table:

- **Cinzel** (`font-display`) — visual hierarchy, theme titles, screen headers, CTAs. Capital-heavy serif, evocative.
- **Spectral** (`font-serif`) — long-form narrative prose: theme descriptions, quests, rule snippets, GM notes. Warm screen serif.
- **Inter** (`font-sans`, default) — UI, forms, data, numeric (with `tabular-nums`). Workhorse.

`globals.css` assigns: `h1–h4` → Cinzel; `p` inside `.prose` → Spectral; everything else → Inter. **Do not override this with `font-sans`, `font-serif`, or `font-display` except in the cases below.**

### Display scale (Cinzel)

| Token | Mobile | Tablet (`md:`) | Desktop (`lg:`) | Use |
|---|---|---|---|---|
| Display | `text-4xl` 36px | `text-5xl` 48px | `text-6xl` 60px | Splash, fulfillment moment screens (rare) |
| **H1** | `text-3xl` 30px | `text-4xl` 36px | `text-5xl` 48px | Main screen title (character name, campaign name) |
| **H2** | `text-2xl` 24px | `text-3xl` 30px | `text-4xl` 36px | Theme title, scene title |
| **H3** | `text-xl` 20px | `text-2xl` 24px | `text-3xl` 30px | Sub-sections, modal titles |
| **H4** | `text-lg` 18px | `text-xl` 20px | `text-2xl` 24px | Card titles |

```html
<h1 class="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
<h2 class="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight">
<h3 class="text-xl md:text-2xl lg:text-3xl font-semibold">
```

Cinzel is heavier visually than a sans — use `font-semibold` (600) for H2-H4 instead of `font-bold` to avoid feeling crowded.

### Prose scale (Spectral) — narrative content only

Use Spectral **only** for narrative or rules text wrapped in a `.prose` container:
- Theme descriptions
- Quest text
- GM scene narration / "Establish" text
- Rule references / compendium pages
- Camping reflection / journaling fields

| Token | Mobile | Tablet+ | Use |
|---|---|---|---|
| **prose-lg** | `text-lg` 18px | `text-xl` 20px | Featured narrative blocks |
| **prose** | `text-base` 16px | _(same)_ | Default prose body |
| **prose-sm** | `text-sm` 14px | _(same)_ | Footnotes, citations |

Spectral should never be used for UI labels, form labels, button text, table headers, or tag/status text.

### UI scale (Inter)

| Token | Mobile | Tablet+ | Use |
|---|---|---|---|
| **ui-lg** | `text-lg` 18px | `text-xl` 20px | Section headers in panels |
| **ui** ⭐ | `text-base` 16px | _(same)_ | **Default UI text — DO NOT go smaller for primary controls** |
| **ui-sm** | `text-sm` 14px | _(same)_ | Tag labels, secondary controls, helpers |
| **caption** | `text-xs` 12px | _(same)_ | Timestamps, auxiliary IDs only |

**Hard rule:** critical mechanical info (tag names, status names, status tiers, Power values, track marks counts, roll results, button labels) **must never** be smaller than `text-sm` (14px). 12px is reserved for purely informational metadata.

### Numeric data scale (Inter + tabular)

For status tiers, Power, roll results, mark counts — always use the `.numeric` utility or `data-numeric` attribute to enable `tabular-nums slashed-zero`:

| Token | Size | Use |
|---|---|---|
| **roll-result** | `text-4xl md:text-5xl font-bold` | Final 2d6 + Power result, center of action view |
| **power-display** | `text-2xl md:text-3xl font-bold` | Computed Power readout on the action panel |
| **tier-badge** | `text-sm font-bold` | The "3" inside a status tier badge |
| **mark-count** | `text-base font-medium` | Track readout (e.g., "2/3") |
| **stat-inline** | `text-sm font-medium` | Inline stats in lists |

Example:
```html
<span class="power-display numeric">+4</span>
<span class="tier-badge numeric">3</span>
```

### Line-height

- Headings (h1-h3): `leading-tight` (1.25)
- H4 / small headings: `leading-snug` (1.375)
- Prose (Spectral): `leading-relaxed` (1.625) — narrative wants air
- UI / lists / dense data: `leading-normal` (1.5) or `leading-tight` for tables
- Tag/status chips: `leading-none` — chips are single-line by definition

---

## 4. Color & semantic tokens

The palette is built around a rustic-fantasy "mist + hearth" mood: cool grays and parchment for surfaces, warm ember for brand, plus **the canonical Tag colors locked by the game rules**.

> ⚠️ **Canonical, non-negotiable:** Power Tags (and helpful Story Tags) are **yellow**; Weakness Tags (and hindering Story Tags) are **orange**. These come from the rulebook and must remain identifiable in both light and dark mode. The design system reserves `tag-power-*` and `tag-weakness-*` tokens for this — do not repurpose them for unrelated UI.

### Token families

| Token family | Purpose |
|---|---|
| `bg-parchment`, `bg-parchment-soft`, `bg-parchment-elevated` | Light-mode surfaces (warm off-white through cream) |
| `bg-ink`, `bg-ink-soft`, `bg-ink-elevated` | Dark-mode surfaces (deep blue-black through dim) |
| `text-ink-base`, `text-ink-muted`, `text-ink-subtle` | Light-mode text (3 levels) |
| `text-parchment-base`, `text-parchment-muted`, `text-parchment-subtle` | Dark-mode text |
| `border-mist-light`, `border-mist-dark` | Dividers and outlines |
| `bg-ember`, `bg-ember-hover`, `bg-ember-active` | **Brand / primary CTA** (warm amber — same hex in both modes) |
| `text-ember-light`, `text-ember-dark` | Brand text variants (different per mode for contrast) |
| `bg-moss-*`, `text-moss-*` | Success / positive narrative / quest-aligned |
| `bg-rust-*`, `text-rust-*` | Warning / negative narrative |
| `bg-crimson-*`, `text-crimson-*` | Danger / "burn" / failure |
| `bg-mist-*`, `text-mist-*` | Info / neutral mechanical states |
| `bg-tag-power-soft`, `border-tag-power-base`, `text-tag-power-text` | **Power Tag chips (yellow)** |
| `bg-tag-weakness-soft`, `border-tag-weakness-base`, `text-tag-weakness-text` | **Weakness Tag chips (orange)** |
| `bg-gm-veil`, `border-gm-veil` | GM-only block visual marker (see §7) |

### Starting hex values (subject to a WCAG AAA pass)

The values below are sensible starting points for a Cinzel/Spectral/Inter rustic palette. Run a contrast pass before locking them in `globals.css`.

**Light mode surfaces:**
- `parchment` `#F5EFE2` — base background, warm off-white
- `parchment-soft` `#EDE5D2`
- `parchment-elevated` `#FFFDF6` — cards, modals
- `ink-base` `#1C1814` — primary text
- `ink-muted` `#534B40`
- `ink-subtle` `#8A8170`
- `mist-light` `#D6CDB8` — borders

**Dark mode surfaces (recommended session mode — see §9):**
- `ink` `#15171C` — base background
- `ink-soft` `#1D202A`
- `ink-elevated` `#262A36` — cards, modals
- `parchment-base` `#EAE3D2`
- `parchment-muted` `#A89F8A`
- `parchment-subtle` `#6F6856`
- `mist-dark` `#3A3F4D`

**Brand & semantic:**
- `ember` `#C2640C` (same in both modes; warm amber, never used as small body text)
- `ember-text-light` `#A14F00` (used on parchment surfaces)
- `ember-text-dark` `#F0A050` (used on ink surfaces)
- `moss` `#3F7A4A` / `moss-dark` `#7CC68A`
- `rust` `#A5421A` / `rust-dark` `#E08055`
- `crimson` `#9B1B1B` / `crimson-dark` `#E55C5C`
- `mist` `#5D7280` / `mist-mid` `#94A4B0`

**Canonical Tag colors (locked):**
- Power (yellow): `tag-power-soft #FBE9A8` (light bg) / `#5A4310` (dark bg), `tag-power-base #C99410`, `tag-power-text` `#5C3F00` (light) / `#FAD96A` (dark)
- Weakness (orange): `tag-weakness-soft #F4C99A` (light bg) / `#5C2810` (dark bg), `tag-weakness-base #C5511A`, `tag-weakness-text` `#682800` (light) / `#F6A36E` (dark)

**Forbidden everywhere:** raw Tailwind palette (`bg-yellow-400`, `text-orange-500`, `bg-amber-100`, `text-stone-600`, etc.) — those bleed into the canonical tag colors and break the system. Always use the project tokens.

---

## 5. Layout primitives

These are layout patterns, not component implementations. They define how the app shell and the principal LitM views behave responsively.

### Main app container

```html
<div class="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8">
  <!-- content -->
</div>
```

`max-w-7xl` (1280px) is the usable width for GM views. Player views often render edge-to-edge on mobile — use `px-4` and skip the max-width on session screens.

### Session shell (sticky top bar + content + bottom action bar on mobile)

```html
<div class="flex min-h-dvh flex-col">
  <header class="sticky top-0 z-40 flex h-14 items-center justify-between
                 border-b border-mist-light bg-parchment-elevated px-4
                 md:h-16 md:px-6
                 dark:border-mist-dark dark:bg-ink-elevated">
    <!-- left: scene state, right: actions -->
  </header>

  <main class="flex-1 overflow-y-auto pb-24 md:pb-6">
    <!-- screen content; pb-24 leaves room for mobile action bar -->
  </main>

  <!-- Mobile only: sticky action bar with Roll / Invoke -->
  <nav class="fixed bottom-0 inset-x-0 z-30 h-20 border-t border-mist-light
              bg-parchment-elevated px-4 md:hidden
              dark:border-mist-dark dark:bg-ink-elevated">
    <!-- Roll button, Invoke selection summary -->
  </nav>
</div>
```

Heights: `h-14` (56px) mobile, `h-16` (64px) tablet+. Mobile action bar `h-20` (80px) — large because the roll button lives there. Use `min-h-dvh` (dynamic viewport) so iOS Safari's bottom chrome doesn't eat the action bar.

### Player view: two-pane "Sheet + Active Scene"

Mobile stacks the panes via tabs; tablet+ splits horizontally.

```html
<div class="flex h-full flex-col md:flex-row">
  <!-- Mobile: tabs switch panes. Tablet+: both visible. -->
  <section class="flex-1 overflow-y-auto p-4 md:p-6
                  md:border-r md:border-mist-light dark:md:border-mist-dark">
    <!-- Character sheet (themes, statuses, backpack) -->
  </section>

  <aside class="hidden md:flex md:w-96 md:flex-col md:overflow-y-auto md:p-6
                lg:w-[28rem]
                bg-parchment-soft dark:bg-ink-soft">
    <!-- Active scene: declared threats, scene tags, action panel -->
  </aside>
</div>
```

### Theme cards grid

A character has **exactly four themes** plus a shared Fellowship theme. The grid is fixed-count, not catalog-style.

```html
<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
  <!-- 4 ThemeCard components -->
</div>

<!-- Fellowship is rendered separately, full-width, with a distinct treatment -->
<div class="mt-6 rounded-xl border border-mist-light bg-parchment-soft p-4
            md:p-6
            dark:border-mist-dark dark:bg-ink-soft">
  <!-- FellowshipThemeCard -->
</div>
```

Never render a "5-theme grid" with Fellowship folded in — it's mechanically shared across the party and visually distinct (see §7).

### Theme card structure

```
┌─────────────────────────────────────┐
│  H3 Theme Name        [Might pill]  │   ← Cinzel H3 + Might badge
│  Themebook · Origin                 │   ← Inter ui-sm, muted
├─────────────────────────────────────┤
│  Quest: <Spectral italic>           │
├─────────────────────────────────────┤
│  ◇ Power tag           ◇ Power tag  │   ← Tag chips, yellow
│  ◆ Weakness tag                     │   ← Tag chip, orange
├─────────────────────────────────────┤
│  Improve ● ● ○   Milestone ● ○ ○    │   ← Track ticks
│  Abandon ○ ○ ○                      │
└─────────────────────────────────────┘
```

Padding: `p-4` mobile, `p-6` tablet+. Internal section gaps: `gap-3` (12px exception allowed here for density).

### GM Dashboard (tablet/laptop primary)

```html
<div class="grid h-full grid-cols-1 gap-4 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px]">
  <main class="overflow-y-auto p-6 lg:p-8">
    <!-- Active scene composer: challenges, threats, broadcasts -->
  </main>

  <aside class="border-t border-mist-light bg-parchment-soft p-6
                lg:border-l lg:border-t-0
                dark:border-mist-dark dark:bg-ink-soft">
    <!-- Party roster snapshot: each PC's status row, fellowship marks -->
  </aside>
</div>
```

### Camp mode

A dedicated overlay/screen, not a regular modal — it's a multi-step procedural flow. Use a Radix Dialog on desktop and a full-screen route on mobile. See §10 for sync rules during camp.

### Forms

```html
<div class="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
  <!-- inputs span 1 col on mobile, 2 on tablet+ -->
</div>
```

Single column on mobile, two columns on tablet+. Inputs always full-width within their cell.

### Vertical lists

```html
<ul class="divide-y divide-mist-light dark:divide-mist-dark">
  <li class="flex items-center gap-3 py-3 md:py-4"> ... </li>
</ul>
```

Use `divide-*` rather than per-item borders.

---

## 6. Tag, Status & Track primitives

These three concepts are the spine of the game. Their components are project-built; they must obey these rules.

### Tag chip

A tag has a **type** (power / weakness / story) and a **state** (idle, scratched, burned, selected-for-invocation).

| State | Visual treatment |
|---|---|
| Idle | Full color fill, full text contrast |
| Scratched | Strikethrough on text, fill at 50% opacity, an `aria-disabled="true"` |
| Burned | Strikethrough + a small flame icon, fill desaturated and replaced with a hatched pattern or `border-dashed`. Burned tags are gone for the scene; UI must not allow re-invocation. |
| Selected (about to invoke) | A 2px `outline-2 outline-offset-2 outline-ember` ring; never replace the canonical fill color. |

```html
<!-- Power tag, idle -->
<button type="button"
        class="inline-flex h-11 items-center gap-2 rounded-lg
               bg-tag-power-soft border border-tag-power-base px-3
               text-sm font-medium text-tag-power-text
               focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember
               disabled:opacity-50">
  <TagIcon class="h-4 w-4" aria-hidden="true" />
  <span>sharp-eyed</span>
</button>

<!-- Weakness tag -->
<button class="... bg-tag-weakness-soft border-tag-weakness-base text-tag-weakness-text">
  <WeaknessIcon class="h-4 w-4" aria-hidden="true" />
  <span>haunted by the past</span>
</button>
```

**Crucial accessibility rule (§8):** never rely on the yellow vs orange hue alone to communicate Power vs Weakness — always pair with a different icon (e.g., a leaf vs a thorn, or a small "+" vs "−" glyph) and an `aria-label` that includes "power tag" or "weakness tag".

Invocation is **one tap**. Tapping a tag toggles it into the current roll's invocation set. A second tap removes it. No long-press, no submenu, no confirmation dialog for the basic case. Burning a tag is a secondary action under a popover.

### Status chip

A status has a **name**, a **tier** (1–6), and a **polarity** (helpful / hindering from the current character's perspective).

```html
<!-- Helpful status, tier 3 -->
<div class="inline-flex h-11 items-center gap-2 rounded-full
            bg-moss-soft border border-moss px-3
            text-sm font-medium text-moss-text
            dark:bg-moss-soft-dark dark:border-moss-dark dark:text-moss-text-dark">
  <span>inspired</span>
  <span class="tier-badge numeric inline-flex h-6 w-6 items-center justify-center
               rounded-full bg-moss text-parchment-base">3</span>
</div>

<!-- Hindering status, tier 2 -->
<div class="... bg-rust-soft border-rust text-rust-text ...">
  <span>wounded</span>
  <span class="tier-badge numeric ... bg-rust">2</span>
</div>
```

Tier badge is a circle, fixed `h-6 w-6` (24px). The increment/decrement controls live in a Radix Popover on tap and must each be at least `h-11 w-11` (44px).

**Polar status cancellation** (e.g., `confident-2` vs `scared-3` → only `scared-1` remains) is computed in the data layer; the UI just shows the remaining status. When polarity cancellation changes the displayed tier, animate the tier change with a 200ms fade — long enough to notice, short enough not to slow play.

### Track ticks

Three track types: **Improve** (3 marks), **Abandon** (3 marks), **Milestone** (3 marks) per theme, and **Promise** (5 marks) per character.

```html
<!-- 3-mark track -->
<div class="flex items-center gap-2" role="group" aria-label="Improve track, 2 of 3 marked">
  <span class="ui-sm text-ink-muted dark:text-parchment-muted">Improve</span>
  <div class="flex gap-1">
    <span class="h-3 w-3 rounded-full bg-ember" aria-hidden="true"></span>
    <span class="h-3 w-3 rounded-full bg-ember" aria-hidden="true"></span>
    <span class="h-3 w-3 rounded-full border border-mist-light dark:border-mist-dark" aria-hidden="true"></span>
  </div>
</div>
```

The 5-mark Promise track uses the same dot pattern, slightly larger (`h-4 w-4`), and lives near the character's identity block (not buried inside a theme).

**Mark transitions are climactic moments** — when a track fills (Improve clears, theme Evolves, theme is Replaced, Moment of Fulfillment fires), do not just silently increment. Show a short modal or toast describing what just happened and what the player needs to choose next. These are once-per-many-sessions events; over-celebrate rather than under-celebrate, but never auto-dismiss faster than 5 seconds.

---

## 7. GM vs Player visibility

The rulebook enforces strict asymmetry between Narrator and Players. **The UI is the last line of defense, not the first.** Visibility must be enforced at the Firestore Security Rules level and the server-side data fetch — never trust the client. UI visibility rules below are additive.

### Player-facing data (rendered to player clients)
- Full own character sheet (themes, tags, quests, tracks, backpack, statuses).
- The Fellowship theme and all relationship tags.
- Environmental statuses, scene tags, and stakes established during "Establish".
- **Declared, telegraphed** threats only (e.g., "the beast lunges").

### GM-only data (NEVER fetched by player clients)
- Challenge profiles: tags, statuses, **Limits**, **Role**.
- Hidden/scripted threats and their precise consequences.
- GM private session notes.
- Any "upcoming" content not yet established in the fiction.

### Visual conventions inside GM-only views

When a GM is looking at a screen that mixes GM-only data with shared data, mark the GM-only blocks distinctly so the GM doesn't accidentally screen-share something forbidden:

```html
<div class="rounded-lg border-2 border-dashed border-gm-veil bg-gm-veil/10 p-4">
  <div class="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-gm-veil">
    <EyeOffIcon class="h-4 w-4" aria-hidden="true" />
    <span>GM only — Limits & Role</span>
  </div>
  <!-- private content -->
</div>
```

The `gm-veil` token is a desaturated indigo/slate that reads "private" without being alarming. Every GM-only block gets the badge — no exceptions, even on tiny inline fields.

### Mixed-visibility surfaces

For entities like Challenges where the players see *some* fields (visible tags, telegraphed threats) and the GM sees more, **never use the same component for both audiences**. Build a `ChallengeCardPlayer` and `ChallengeCardGM` that consume the same upstream entity but render disjoint field sets. A single conditional `{isGM && <Limits />}` inside a shared component is forbidden — it's an injection point for bugs and screen-share leaks.

---

## 8. Accessibility rules (non-negotiable)

1. **Color is never the only signal.** Critical for LitM: yellow Power vs orange Weakness sit close on the red-green axis. Always pair the canonical tag color with (a) a distinct icon and (b) an `aria-label` containing "power tag" or "weakness tag". Same for helpful vs hindering statuses (moss vs rust).
2. **Focus must be visible.** Every interactive element carries `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember`. **Forbidden** to use `outline-none` without a replacement.
3. **Labels associated with inputs.** Every `<input>` has a `<label for="">` or `aria-label`. No exceptions.
4. **Touch targets 44px+.** See §2.
5. **Minimum 14px text** for any mechanical info; 12px only for metadata (timestamps, IDs).
6. **`role="status"` or `role="alert"`** on dynamic real-time changes pushed from the GM (status applied, tag scratched by GM, threat delivered). Use polite announcements for routine state, assertive for incoming consequences. Without live-region wiring, screen-reader users miss every GM-initiated event.
7. **`aria-hidden="true"`** on decorative icons that have adjacent text.
8. **`prefers-reduced-motion`** must disable the track-fill celebration animation, the polar-status fade, and any dice-rolling animation. Always provide an instant-result fallback.
9. **Descriptive `alt`** on character/NPC portraits (name + concept). Decorative: `alt=""`.
10. **Contrast is solved by tokens** — do not invent colors outside the palette. Run the WCAG AAA pass when first locking §4 hex values.

---

## 9. Dark mode

Activation: add/remove `dark` on `<html>`. Every component must carry `dark:` variants.

**Dark mode is the recommended default for live sessions** (dim ambient lighting at the table, reduced eye strain after hours of play). The app should detect first launch in evening hours and suggest dark; user preference persists.

**Mandatory pattern in every component:**
```
[light classes]  dark:[dark classes]
```

**Canonical pairs:**

| Light | Dark |
|---|---|
| `bg-parchment` | `dark:bg-ink` |
| `bg-parchment-soft` | `dark:bg-ink-soft` |
| `bg-parchment-elevated` | `dark:bg-ink-elevated` |
| `text-ink-base` | `dark:text-parchment-base` |
| `text-ink-muted` | `dark:text-parchment-muted` |
| `border-mist-light` | `dark:border-mist-dark` |
| `bg-moss-soft` | `dark:bg-moss-soft-dark` |
| `text-moss-text` | `dark:text-moss-text-dark` |
| `text-ember-text-light` | `dark:text-ember-text-dark` |
| `bg-tag-power-soft` | `dark:bg-tag-power-soft-dark` |
| `bg-tag-weakness-soft` | `dark:bg-tag-weakness-soft-dark` |

**Brand background (`bg-ember`, `bg-ember-hover`, `bg-ember-active`) is the same in both modes** — only the surrounding context changes.

**Canonical tag identity must survive mode-switching.** A power tag must still read yellow-ish and a weakness tag still read orange-ish in dark mode, just shifted toward darker, more saturated tones with light text inside. Never collapse them to a single accent color.

---

## 10. Real-time sync UI rules

The session view is wired with Firestore `onSnapshot`. The UI must coexist with state arriving from the GM (or another party member) at any moment.

1. **Ephemeral vs persistent.** Persistent state (themes, weakness tags, quests, track integers) only mutates on explicit user action — show normal optimistic UI. Ephemeral state (scratched booleans, statuses, story tags, fellowship relationship tags, declared threats) can change at any time from another client — never optimistically lock it.
2. **No optimistic UI on GM-initiated state.** If the GM applies `wounded-2`, the player client must show it only after the snapshot resolves. A client cannot decide "the GM probably applied this" — they didn't, and rolling back is worse than a 200ms delay.
3. **Conflict markers.** If a local mutation is in flight and an inbound snapshot supersedes it, briefly highlight the changed field with a 600ms outline animation so the user sees the value moved without their input. Use the `mist` token, not red — this isn't an error.
4. **Connection state.** A persistent "offline / reconnecting" banner appears in the top bar (sticky header) when the snapshot stream stalls beyond 3 seconds. Mechanical actions (rolling, invoking, scratching) are disabled while offline — better to wait than to desync.
5. **Camp mode is the one place batch writes are OK.** Tag expiration, Rest clearing statuses, and unscratching exhausted tags should batch into a single Firestore commit per character, with a confirm step. Camp procedures are slow narrative beats anyway — a 1-second commit feels right.
6. **Server actions for mutations.** All writes go through Next.js Server Actions, never client-side direct Firestore writes from a player. Re-verify the session cookie inside every Server Action (CVE-2025-29927 defense-in-depth: don't rely on middleware/proxy.ts alone).

---

## 11. Pre-merge checklist

Paste this into the PR template:

- [ ] All dimensions are multiples of 8px (except 1px borders and small radii)
- [ ] Touch targets ≥ 44px (especially tag chips and tier controls)
- [ ] Critical text ≥ 14px
- [ ] Typography: headings use `font-display` (Cinzel), prose uses `.prose` (Spectral), UI/data uses `font-sans` (Inter) + `numeric` where appropriate
- [ ] Responsive verified on mobile (375px portrait), GM tablet (768px), GM laptop (1280px)
- [ ] Dark mode implemented on ALL colored elements; canonical tag yellow/orange remains identifiable in dark
- [ ] Focus visible on all interactive elements
- [ ] Power tags and Weakness tags use distinct icons in addition to color
- [ ] Helpful and hindering statuses use distinct icons in addition to color
- [ ] All inputs have associated `<label>` or `aria-label`
- [ ] Live-region (`role="status"` / `role="alert"`) wired for GM-pushed state changes
- [ ] `prefers-reduced-motion` disables track-fill, status-fade, dice-roll animations
- [ ] No hardcoded hex values — everything from §4 tokens
- [ ] No raw Tailwind palette classes (`text-yellow-500`, `bg-orange-100`, etc.)
- [ ] GM-only fields fetched server-side under GM auth only; never client-conditioned
- [ ] GM-only UI blocks use the `gm-veil` treatment
- [ ] Ephemeral state changes via `onSnapshot`, not optimistic UI
- [ ] Mutations go through Server Actions with cookie re-validation
- [ ] No shadcn primitive imported without dark-mode classes and design-token alignment (§14)

---

## 12. Anti-patterns (do not do)

- ❌ `style="color: #..."` or `style="font-size: ..."` — everything goes through classes.
- ❌ `text-[13px]`, `p-[15px]`, `gap-[18px]` — use the scale, not arbitrary values.
- ❌ `text-yellow-500`, `bg-orange-100`, `text-amber-700`, `text-stone-600` — generic Tailwind palette. Only design system tokens. **Especially** for tag colors: the yellow/orange canonical tag identity must flow through `tag-power-*` and `tag-weakness-*` exclusively.
- ❌ Power tag and Weakness tag distinguished by color alone (no icon, no aria-label).
- ❌ Status helpful/hindering distinguished by color alone.
- ❌ A single component conditionally rendering both player and GM views of the same entity (e.g., `{isGM && <Limits />}` inside `<ChallengeCard>`). Build separate components.
- ❌ Optimistic UI on ephemeral state pushed by the GM (status applied, tag scratched by GM, threat declared).
- ❌ Multi-tap or confirmation dialogs for basic tag invocation. One tap, period.
- ❌ Burying the Promise track inside a single theme — it's character-wide and must live near the identity block.
- ❌ Folding the Fellowship theme into the 4-theme grid as a "5th card".
- ❌ Animations over 300ms during an action roll or its consequences (slows play).
- ❌ Auto-dismissing the track-fill / Evolve / Replace / Moment-of-Fulfillment modal in under 5 seconds.
- ❌ Direct client-side Firestore writes from a player session. Server Actions only.
- ❌ Trusting the client to gate GM-only fields. Filter at Firestore rules + server fetch.
- ❌ Using a shadcn primitive as-shipped without dark-mode classes and token alignment.

---

## 13. Mental order for building a new screen or component

1. **Who is the audience?** Player on mobile, GM on tablet/laptop, or both (rare — usually separate components).
2. **Is this persistent or ephemeral data?** Persistent = standard form patterns; ephemeral = real-time, no optimistic UI for inbound changes.
3. **Does this already exist?** Check `components/` first; many primitives are already built (TagChip, StatusChip, TrackTicks, ThemeCard).
4. **Base layout:** which container and shell from §5?
5. **Game primitives needed:** tags, statuses, tracks — reuse from §6, never re-implement.
6. **Typography hierarchy:** what's the H1 of this screen? What is prose (Spectral) vs data (Inter)?
7. **Visibility:** does any field need GM-only treatment? If yes, server-fetch separately and use the GM-veil block.
8. **Semantic states:** what can go wrong — connection loss, conflicting snapshot, failed mutation? Wire connection state + live regions.
9. **Dark mode:** review ALL color classes.
10. **Run the checklist in §11.**

---

## 14. shadcn/ui + Radix integration

shadcn copies primitive code into `components/ui/`. That means we *own* the source and must edit it on adoption — not at every call site.

**Adoption ritual** for every new shadcn primitive:

1. Install with `npx shadcn@latest add <primitive>`.
2. Immediately open the generated file in `components/ui/` and:
   - Replace any raw Tailwind palette classes (`bg-slate-50`, `text-zinc-900`, etc.) with project tokens from §4.
   - Add `dark:` variants for every color class. shadcn ships some, but the coverage is uneven — verify each one.
   - Replace any non-8px dimension (look for `h-9`, `p-2.5`, `gap-1.5`) with §2-authorized values. `h-9` (36px) → `h-10` (40px) on desktop, `h-11` (44px) on touch surfaces.
   - Confirm the focus ring uses `outline-ember` (or the equivalent `ring-ember`) and meets §8.
   - Confirm any internal typography matches §3 (default to Inter; never let a primitive force a different font-family).
3. **Document the adoption** in a one-line comment at the top: `// LitM-aligned shadcn primitive — do not regenerate without re-applying tokens.`
4. Add to the in-repo "primitives audit" — a short doc listing which shadcn primitives have been brought into line.

**Wrapping** — when a shadcn primitive needs LitM-specific additions (e.g., a `Dialog` that's full-screen on mobile and centered on tablet+, or a `Popover` that always uses `bg-parchment-elevated`):
- Wrap it in a project-specific component in `components/<feature>/`, never in `components/ui/` (keep `ui/` as the primitive layer).
- The wrapper applies the LitM tokens and behavior on top of the primitive.
- Project components consume the wrapper, not the raw shadcn primitive.

**Radix primitives** that ship as headless (e.g., `@radix-ui/react-toggle-group`, `@radix-ui/react-tooltip` not yet wrapped by shadcn) must be styled exclusively with §2–§9 tokens from first use — they have no defaults to override, only your tokens to apply.

**Don't re-implement what shadcn covers.** If you need a Dialog, Popover, DropdownMenu, Sheet, Toggle, Tabs, ToggleGroup, Tooltip, ScrollArea, or Combobox — adopt the shadcn primitive and align it. Hand-rolled versions skip focus management, escape-key handling, and ARIA wiring that Radix gives for free.

For project-specific components (Theme Card, Tag Chip, Status Chip, Track Ticks, Backpack, Camp Mode, Challenge cards, GM Dashboard panels) built in-house, every rule in this document is mandatory from day one.
