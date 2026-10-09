---
phase: 01
slug: foundation-contracts-and-auth
status: draft
shadcn_initialized: false
preset: none
created: 2026-10-09
tool: none
component_library: none
icon_library: inline-svg
fonts: system-first (no external font loading)
supersedes: none
---

# Phase 01 — UI Design Contract

> Visual and interaction contract for the Waynora foundation phase.
> Written against `01-CONTEXT.md` (locked decisions D-01…D-14) and `01-01/02/03-PLAN.md`.
> **Mandatory skills:** `design-taste-frontend` and `high-end-visual-design` — applied here, not merely cited (D-12).

---

## Design System

| Property | Value |
|----------|-------|
| Tool | Tailwind CSS (utility-first, tokens in `src/styles/tokens.css`) |
| Preset | none |
| Component library | **none** — hand-built primitives in `src/components/ui/` (D-02, minimal dependencies) |
| Icon library | inline SVG only, 16/20/24px, `stroke="currentColor"`, `stroke-width={1.5}`, `aria-hidden="true"` |
| Font | system-first serif display + system UI sans body; **no external font loading** |
| Routing | React Router (`createBrowserRouter`), lazy routes |
| Markdown | `react-markdown` + `remark-gfm`, no `rehype-raw` (D-07) |

**Why no component library:** adding Radix/shadcn to a phase whose explicit goal is "minimal purposeful dependencies" (D-02) contradicts the locked decision, and the primitive set Phase 1 needs is eight components.

**Why system fonts:** no network dependency, no privacy-relevant third-party request, no FOUT on a phase whose consumer flips between landing/auth/chat within seconds. The editorial voice comes from the *serif display* pairing, not from a paid typeface.

---

## Color

| Role | Token | Value | Usage |
|------|-------|-------|-------|
| Canvas (60%) | `--color-canvas` | `#F7F4EE` | Page background, all surfaces default here |
| Surface (secondary) | `--color-surface` | `#FDFBF7` | Cards, auth card, chat placeholder panel |
| Surface raised | `--color-surface-raised` | `#FFFFFF` | Inputs, popovers, focus target fill |
| Ink (primary text) | `--color-ink` | `#1C1917` | Headings, body, labels |
| Ink muted (secondary text) | `--color-ink-muted` | `#55504A` | Ledger paragraphs, hints, captions |
| Line / border | `--color-line` | `#E0DAD0` | Inputs, card borders, nav divider |
| Accent | `--color-accent` | `#0F5C56` | Primary buttons, links, active nav, eyebrow text |
| Accent ink (on accent) | `--color-accent-ink` | `#FFFFFF` | Text/icons on accent fills |
| Accent soft (tint) | `--color-accent-soft` | `#E6EFED` | Selected nav background, callout wash |
| Focus | `--color-focus` | `#C2410C` | Focus rings, selection highlight |
| Destructive | `--color-danger` | `#9F1239` | Form errors, destructive confirm text |
| Success | `--color-success` | `#166534` | Inline success status only |

**Contrast (measured against `--color-canvas` `#F7F4EE`):**

| Pair | Ratio | Requirement | Verdict |
|------|-------|-------------|---------|
| `#1C1917` on `#F7F4EE` | 15.4:1 | 4.5:1 body | ✓ |
| `#55504A` on `#F7F4EE` | 5.9:1 | 4.5:1 body | ✓ |
| `#0F5C56` on `#F7F4EE` | 6.2:1 | 4.5:1 body | ✓ |
| `#FFFFFF` on `#0F5C56` | 6.2:1 | 4.5:1 body | ✓ |
| `#9F1239` on `#F7F4EE` | 7.1:1 | 4.5:1 body | ✓ |
| `#C2410C` on `#F7F4EE` | 4.4:1 | 3:1 non-text | ✓ (focus ring) |
| `#166534` on `#F7F4EE` | 5.8:1 | 4.5:1 body | ✓ |

**Accent reserved for — ONLY these:**
1. Primary button (`Button variant="primary"`) fill and its text
2. Text links and inline links inside Markdown
3. `PageHeader` eyebrow text
4. The active nav item's left rule + text
5. Focus, via `--color-focus`

**Never accent:** body text, all text on `--color-canvas` that is not a link/eyebrow, secondary/ghost button fills, borders, dividers, backgrounds larger than a card, chart fill, 404 copy. Accent stays at ~10% of any screen.

**Hard bans (D-12):** no `linear-gradient`/`radial-gradient` on any primary surface; no `backdrop-filter` blur; no decorative blob/circle SVG; no "AI purple" gradient; no `box-shadow` beyond the three declared tokens; no emoji as iconography.

---

## Typography

| Role | Token | Value | Weight | Line height |
|------|-------|-------|--------|-------------|
| Display | `--font-display` | serif, `clamp(2.75rem, 1.6rem + 4.2vw, 4.25rem)` | 600 | 1.05 |
| H1 | `--font-display` | serif, `clamp(2rem, 1.4rem + 2.2vw, 3rem)` | 600 | 1.1 |
| H2 | `--font-display` | serif, `clamp(1.5rem, 1.2rem + 1.2vw, 2rem)` | 600 | 1.2 |
| H3 | `--font-sans` | sans, `1.375rem` (22px) | 600 | 1.3 |
| Body | `--font-sans` | sans, `1.0625rem` (17px) | 400 | 1.65 |
| Lead | `--font-sans` | sans, `1.25rem` (20px) | 400 | 1.55 |
| Small | `--font-sans` | sans, `0.9375rem` (15px) | 400 | 1.5 |
| Caption | `--font-sans` | sans, `0.8125rem` (13px) | 400 | 1.45 |
| Overline | `--font-sans` | sans, `0.75rem` (12px) | 600, uppercase, `letter-spacing: 0.12em` | 1.4 |
| Mono | `--font-mono` | `ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace`, `0.9375rem` | 400 | 1.5 |

**Font stacks (exact, in `tokens.css`):**
```css
--font-display: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, ui-serif, serif;
--font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace;
```

**Rules:**
- Headings H1/H2/Display use `--font-display` (serif → editorial travel voice). H3 and below use `--font-sans`. Mixing within one heading is banned.
- Body measure is capped at `65ch` (`--measure-prose`); lead at `58ch`. No 6-line wraps on desktop.
- `text-wrap: balance` on H1–H3; `text-wrap: pretty` on body paragraphs ≥ 3 lines.
- Minimum rendered body size anywhere in the app is 15px. Nothing below 13px except the overline label.
- Numeric alignment: use `font-variant-numeric: tabular-nums` on any time/count/percentage display (Phase 3 waiting UI inherits this).

---

## Spacing Scale

All values are multiples of 4. Tailwind maps each to `--space-*`.

| Token | Value | Usage |
|-------|-------|-------|
| `3xs` | 2px | Icon nudges, hairline gaps |
| `2xs` | 4px | Icon-to-label gaps, tight inline padding |
| `xs` | 8px | Input internal vertical rhythm, stack of related controls |
| `sm` | 12px | Form field spacing, nav item padding |
| `md` | 16px | Default element spacing, card padding, form gap |
| `lg` | 24px | Section padding, card grid gap |
| `xl` | 32px | Layout gaps, page block separation |
| `2xl` | 48px | Major section breaks |
| `3xl` | 64px | Page-level spacing, auth page vertical padding |
| `4xl` | 96px | Reserved for Phase 5 landing rhythm |

**Exceptions:** none. Any executor needing a value outside this scale must add it to `tokens.css` and record the reason in the plan summary.

**Layout containers:** `--container-sm: 40rem` (640), `--container-md: 48rem` (768), `--container-lg: 64rem` (1024), `--container-xl: 75rem` (1200 — max page width), `--measure-prose: 65ch`.

**Breakpoints (Tailwind):** `sm 640 / md 768 / lg 1024 / xl 1280`. Mobile-first. Horizontal overflow is banned at 320px.

**Radius:** `--radius-sm: 2px`, `--radius-md: 4px`, `--radius-lg: 8px`, `--radius-full: 9999px`. Buttons/inputs use `md`; cards use `lg`; avatars/pills use `full`.

**Shadow:** `--shadow-sm: 0 1px 2px rgb(28 25 23 / 0.06)`, `--shadow-md: 0 2px 8px rgb(28 25 23 / 0.08)`, `--shadow-lg: 0 8px 24px rgb(28 25 23 / 0.10)`. Cards sit at `sm`, raised overlays at `md`, dialogs at `lg`.

---

## Accessibility & Focus Contract (D-14)

**Non-negotiable in Phase 1, inherited by every later phase.**

1. **Landmarks** — exactly one `<header>`, one `<main id="main">`, one `<footer>` per route. `<main>` carries `tabIndex={-1}` so the skip link can move focus.
2. **Skip link** — `<SkipLink />` is the **first focusable element** in `RootLayout`, text exactly `Skip to content`, visually hidden until `:focus-visible`. Activating it moves focus to `#main`.
3. **Focus ring** — `:focus-visible` only: `outline: 2px solid var(--color-focus); outline-offset: 2px;`. Applied globally to `a, button, input, textarea, select, [tabindex]`. **`outline: none` is banned.** Default focus never suppressed on any interactive element.
4. **Focus order** — DOM order == visual order. No positive `tabindex` (`tabIndex > 0`) anywhere in the codebase.
5. **Touch targets** — minimum `44 × 44px` hit area for every interactive control, including icon-only buttons (use padding, not visual size).
6. **Forms** — every input has a **visible** `<label>` (placeholder-only labels are banned). Errors: `aria-invalid="true"` + `aria-describedby` pointing at the error id + error node `role="alert"`. Hints use the same `aria-describedby` list. Submit disabled while submitting, with `aria-busy`.
7. **Password field** — show/hide toggle, `aria-pressed` on the button, `aria-label` flipping `Show password` ↔ `Hide password`. `autoComplete` = `email` / `current-password` / `new-password`.
8. **Loading** — `role="status"` + `aria-label="Loading"` on `Spinner`; async status regions are `aria-live="polite"`.
9. **Color** — all text pairs meet the ratios in the Color table. Color is never the sole signal (errors always pair color with an icon or text).
10. **Keyboard** — every interaction reachable and operable by Tab / Shift+Tab / Enter / Space / arrow keys where applicable. Escape closes any overlay.
11. **Contrast on `--color-focus`** — the ring is legible on both `--color-canvas` and `--color-surface-raised`.

---

## Reduced Motion Contract

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- **`Spinner`** must detect `prefers-reduced-motion` and render three static dots instead of a rotation.
- Motion is used only for state transitions (`opacity`, `transform` ≤ 200ms `ease-out`) — never for entrance spectacle. Phase 5 motion polish is explicitly out of scope here.
- `prefers-reduced-motion` is asserted in `src/test/a11y.test.tsx` via a `matchMedia` mock.

---

## Copywriting Contract

Exact strings. Phase 3/4/5 may extend, but may not reword these.

| Element | Copy |
|---------|------|
| Product wordmark | `Waynora` |
| Landing eyebrow (Phase 1 placeholder) | `AI trip planning` |
| Landing heading | `Plan a trip worth the wait.` |
| Landing lead | `Tell us where you want to go. A real agent builds your itinerary — usually in 5 to 15 minutes.` |
| Primary CTA | `Create your free account` |
| Secondary CTA | `Sign in` |
| Sign-in page heading | `Welcome back` |
| Sign-in submit | `Sign in` |
| Sign-in switch link | `Create an account` |
| Sign-up page heading | `Create your account` |
| Sign-up submit | `Create account` |
| Sign-up switch link | `Sign in` |
| Sign-up password hint | `At least 8 characters.` |
| Email field label | `Email address` |
| Password field label | `Password` |
| Confirm password label | `Confirm password` |
| Empty email error | `Enter your email address.` |
| Invalid email error | `Enter a valid email address.` |
| Empty password error | `Enter your password.` |
| Short password error | `Use at least 8 characters.` |
| Mismatched password error | `Passwords do not match.` |
| **Auth failure (generic, TM-04)** | `We couldn't sign you in. Check your email and password and try again.` |
| **Auth failure (signup, generic)** | `We couldn't create your account. Try a different email address, or sign in if you already have one.` |
| Auth loading status | `Checking your session…` |
| Protected route notice | `Sign in to continue to chat` |
| Chat placeholder heading | `Your trip goes here` |
| Chat placeholder body | `Chat and your generated travel plans arrive in Phase 3. Nothing to show yet.` |
| Chat placeholder action | `Sign out` |
| 404 heading | `Page not found` |
| 404 body | `We couldn't find that page. Head back home to start a trip.` |
| 404 action | `Back to home` |
| Skip link | `Skip to content` |

**Copy rules:**
- Sentence case everywhere except the overline label and the wordmark.
- No exclamation marks. No "Awesome", "Amazing", "Supercharge", "effortless".
- **Truthfulness (project constraint):** no percentage-progress claims, no invented agent names or specialist status, no timing claims other than the honest 5–15 minutes. Errors say what happened and the next step; they never expose raw diagnostics, status codes, or stack traces.
- Destructive confirmations state the action and the consequence: `Delete this chat? This can't be undone.` (Phase 4 slot).

---

## Surface Inventory

Each surface lists its states. States are the contract; the executor may not invent additional states without updating this table.

| Surface | Route | States |
|---------|-------|--------|
| Landing placeholder | `/` | default · focus (skip link visible) · loading (lazy route) |
| Sign in | `/signin` | default · invalid field · submitting · generic failure · success → `/chat` |
| Sign up | `/signup` | default · invalid field · submitting · generic failure · success → `/chat` |
| Chat placeholder (protected) | `/chat` | `isLoading` (neutral "Checking your session…") · unauthenticated (redirect, never renders content) · authenticated (empty state) |
| 404 | `*` | default |
| Shell header | all | unauthenticated nav (`Waynora`, `Sign in`, `Create account`) · authenticated nav (`Waynora`, `Chat`, `Sign out`) |
| Assistant Markdown | Phase 3 slot | rendering · empty |
| Auth card wrapper | `/signin`, `/signup` | default · focus-within ring |
| Query/config error | all | `envError` → readable, non-crashing config-failure panel |

**Landing placeholder is deliberately minimal** — eyebrow, one heading, one lead, two CTAs (D-13 reserves full composition, imagery, and the three-specialist-agent storytelling for Phase 5). No hero image, no section grid, no testimonial, no pricing.

---

## Shared Primitive Contract (D-04)

All in `src/components/ui/`, exported from `index.ts`, all `forwardRef`, all props extend the native element props, all styling via declared tokens only.

| Primitive | Props | States | Notes |
|-----------|-------|--------|-------|
| `Button` | `variant: primary \| secondary \| ghost`, `size: sm \| md \| lg`, `isSubmitting?`, `asChild?` | default · hover · active · focus-visible · disabled · loading | Primary = accent fill + accent-ink text. Secondary = `--color-line` border, transparent fill. Ghost = text only. Loading shows `Spinner` + `aria-busy`. |
| `TextField` | `label`, `hint?`, `error?`, `type`, native input props | default · focus · invalid · disabled | `useId()` for id wiring; `aria-describedby` = hint id + error id; error icon + `role="alert"`. |
| `ErrorText` | `children` | static | `role="alert"`, `--color-danger`, 15px. |
| `Spinner` | `size?: sm \| md \| lg` | animating · reduced-motion (3 static dots) | `role="status"`, `aria-label="Loading"`. |
| `EmptyState` | `title`, `body`, `action?` | default | H3 title, muted body, optional action node. |
| `VisuallyHidden` | `children` | n/a | sr-only clip pattern. |
| `SkipLink` | `href="#main"` | hidden · focus-visible | Text exactly `Skip to content`. |
| `PageHeader` | `eyebrow?`, `title`, `lede?`, `actions?` | default | Renders the route `<h1>`; overline uses accent; lede capped at `58ch`. |
| `Markdown` | `content: string` | rendering · empty | `react-markdown` + `remark-gfm`, **no `rehype-raw`**; URL transform allowlist `http:`/`https:`/`mailto:` + relative/`#`; external links get `target="_blank"` + `rel="noopener noreferrer"`; container `aria-live="polite"`; `allowedElements` excludes `script`, `style`, `iframe`, `object`, `embed`, `form`. |

**Markdown typography contract (the primary chat text surface — Phase 3 inherits it):**
- Wrapper: `--font-sans`, 17px/1.65, measure `65ch`, `--color-ink`.
- Paragraphs: `margin-block: 0 var(--space-md)`.
- Headings: serif, sizes from the scale above; `h1` once per answer block only.
- Lists: `padding-inline-start: var(--space-lg)`, `margin-block: var(--space-md)`, `list-style-position: outside`.
- `code` inline: `--font-mono`, 15px, `--color-surface-raised` fill, `--radius-sm`, `2px 4px` padding.
- Pre: `--font-mono`, 15px, `--color-ink` on `--color-surface`, `--radius-md`, `var(--space-md)` padding, `overflow-x: auto`.
- Blockquote: `border-inline-start: 3px solid var(--color-accent)`, `padding-inline-start: var(--space-md)`, `--color-ink-muted`.
- Tables (remark-gfm): `border-collapse: collapse`, full width, `th` 15px/600 uppercase tracking `0.06em`, cells `var(--space-sm) var(--space-md)`, row separators `--color-line`, `--radius-sm` on the wrapper with `overflow-x: auto` on mobile.
- Links: `--color-accent`, `text-decoration: underline`, `text-underline-offset: 2px`; hover `--color-ink`.
- Images: `--radius-md`, `--shadow-sm`.
- Never render raw HTML. Never set inner HTML.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none — `shadcn_initialized: false` | not required |
| radix / base-ui | none — hand-built primitives only (D-02) | not required |
| Third-party | none | not required |

**No registry blocks are used in Phase 1.** Any later phase that adds one must run the safety gate (view + diff before merge) and record it here.

---

## Deferred to Later Phases (explicit, non-negotiable)

| Phase | Deferred UI scope |
|-------|-------------------|
| 2 | None visual — persistence is behavioral. Surfaces inherit this contract unchanged. |
| 3 | Chat message bubbles, composer, elapsed-time waiting shell, honest time-banded waiting copy. Inherits tokens, Markdown contract, and `aria-live` patterns. |
| 4 | Chat sidebar, 2048 board and controls, mobile layouts, focus/reduced-motion integration for the game. |
| 5 | Editorial landing composition, imagery, motion, agent storytelling, the three specialist agents, "Made by YADAV NITESH" GitHub attribution. |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
