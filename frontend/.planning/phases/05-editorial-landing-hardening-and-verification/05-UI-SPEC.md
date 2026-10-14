---
phase: 05
slug: editorial-landing-hardening-and-verification
status: approved
shadcn_initialized: false
preset: none
created: 2026-10-14
tool: none
component_library: none
icon_library: inline-svg
fonts: curated-display-serif + system-sans (see D-04)
supersedes: none
redesign_scope: full-frontend
---

# Phase 05 — UI Design Contract

> Full-frontend visual redesign + editorial landing page + security hardening + release verification.
> Written against `05-CONTEXT.md` (decisions D-01…D-12) and ROADMAP.md Phase 5 goals.
> **Mandatory skills:** `design-taste-frontend` and `high-end-visual-design` — every UI task must reference these explicitly.
> **Hard boundary:** No changes to business logic, API calls, state machines, auth flow, cookie behaviour, routes, or backend config.

---

## Design System — Redesigned

### Palette Override

The executor MUST choose a curated, harmonious palette. The following is the DECISION-SPEC: requirements, not a fixed color map. The executor fills in the exact hex/hsl values.

| Role | Token | Executor fills | Constraint |
|------|-------|----------------|------------|
| Canvas (primary bg) | `--color-canvas` | _Executor chooses_ | NOT pure white or neutral-50. Warm, earthy, or deeply saturated. |
| Surface (card/panel) | `--color-surface` | _Executor chooses_ | Lighter or subtly different from canvas. |
| Surface raised | `--color-surface-raised` | _Executor chooses_ | For inputs, floating panels. |
| Ink (primary text) | `--color-ink` | _Executor chooses_ | >= 14:1 contrast on canvas. |
| Ink muted (secondary) | `--color-ink-muted` | _Executor chooses_ | >= 5.5:1 contrast on canvas. |
| Line / border | `--color-line` | _Executor chooses_ | Subtle, not harsh. |
| Accent (brand) | `--color-accent` | _Executor chooses_ | The ONE brand color. Rich, distinctive. NOT generic blue/purple. >= 6:1 on canvas. |
| Accent ink (on accent) | `--color-accent-ink` | _Executor chooses_ | >= 4.5:1 on accent fill. |
| Accent soft (tint) | `--color-accent-soft` | _Executor chooses_ | Light tint of accent, for selected states. |
| Focus | `--color-focus` | _Executor chooses_ | >= 3:1 as non-text indicator. |
| Danger | `--color-danger` | _Executor chooses_ | Red-family. >= 4.5:1 on canvas. |
| Success | `--color-success` | _Executor chooses_ | Green-family. >= 4.5:1 on canvas. |
| Ink inverse (NEW) | `--color-ink-inverse` | _New token_ | Text on dark-section backgrounds. |
| Surface dark (NEW) | `--color-surface-dark` | _New token_ | For dark-themed sections (hero strip, footer). |
| Surface dark raised (NEW) | `--color-surface-dark-raised` | _New token_ | Cards/panels on dark sections. |

**Design direction candidates — executor picks ONE:**

- **Ink & Paper:** Deep charcoal ink (`#1a1208`) on warm cream (`#f5f0e8`), amber-gold accent (`#b8860b`). Old National Geographic cartographic feel.
- **Verdigris & Linen:** Off-white linen (`#faf7f2`) with deep verdigris accent (`#2d6a4f`), charcoal ink, terracotta focus ring. Travel editorial.
- **Midnight Atlas:** Very dark navy (`#0d1117`) for dark sections, warm off-white type, copper/brass accent. Premium dark-hero editorial.
- **Aegean Blue:** Warm white (`#fefcf8`), deep aegean blue accent (`#1b4f72`), slate ink, warm amber focus. Mediterranean.

**Hard bans (locked from Phase 1, unchanged):**
- No `linear-gradient`/`radial-gradient` on primary surfaces
- No `backdrop-filter: blur`
- No decorative blob/circle SVGs
- No "AI purple" gradient (#7c3aed → #6366f1 etc.)
- No `box-shadow` beyond the three declared tokens
- No emoji as iconography (exception: 2048 win overlay only)

---

### Typography — Redesigned

**Font loading (index.html):**

Executor chooses ONE display serif from this shortlist and adds to `index.html`:

```html
<!-- Option A: Fraunces — variable, optical, high personality (RECOMMENDED) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&display=swap" rel="stylesheet">

<!-- Option B: Playfair Display — classical editorial serif -->
<!-- Option C: DM Serif Display — refined, contemporary -->
```

Update `--font-display` in `tokens.css`:
```css
/* Example for Fraunces: */
--font-display: "Fraunces", "Iowan Old Style", Georgia, ui-serif, serif;
```

**Rules (locked):**
- Headings H1/H2/Display use `--font-display` (loaded serif). H3 and below use `--font-sans`.
- Body uses `--font-sans`.
- Max 2 font families total.
- `font-display: swap` on Google Fonts import — no invisible text during load.
- Preconnect in `<head>` before the stylesheet link.
- `font-variant-numeric: tabular-nums` on all time/count displays.

**Type scale (locked sizes — do not change):**

| Role | Token | Size | Weight | Line height |
|------|-------|------|--------|-------------|
| Display | `--text-display` | `clamp(3rem, 2rem + 5vw, 5.5rem)` | 600 | 1.0 |
| H1 | `--text-h1` | `clamp(2rem, 1.4rem + 2.2vw, 3rem)` | 600 | 1.1 |
| H2 | `--text-h2` | `clamp(1.5rem, 1.2rem + 1.2vw, 2rem)` | 600 | 1.2 |
| H3 | `--text-h3` | `1.375rem` | 600 | 1.3 |
| Body | `--text-body` | `1.0625rem` | 400 | 1.65 |
| Lead | `--text-lead` | `1.25rem` | 400 | 1.55 |
| Small | `--text-small` | `0.9375rem` | 400 | 1.5 |
| Caption | `--text-caption` | `0.8125rem` | 400 | 1.45 |
| Overline | `--text-overline` | `0.75rem` | 600 uppercase `letter-spacing:0.12em` | 1.4 |

Note: `--text-display` max expanded to 5.5rem (was 4.25rem) for landing hero impact.

---

### Motion Tokens (NEW in Phase 5)

Add to `tokens.css`:
```css
/* Motion — Phase 5 */
--duration-fast: 120ms;
--duration-base: 200ms;
--duration-slow: 400ms;
--duration-reveal: 600ms;
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

**Animation library:** Install `framer-motion` (RECOMMENDED) OR use CSS keyframes + IntersectionObserver. Choose ONCE. Do not mix both.

---

## Animation Contract

### Entry Animations

| Trigger | Pattern | Duration | Easing |
|---------|---------|----------|--------|
| Route mount (landing) | Hero children stagger: y: 20px→0 + opacity: 0→1 | 600ms stagger | ease-out |
| Route mount (auth) | Card: scale 0.97→1 + opacity: 0→1 | 200ms | ease-out |
| Route mount (chat) | Fade in | 200ms | ease-out |
| Section enters viewport | Children: y: 30px→0 + opacity: 0→1, 80ms stagger | 400ms | ease-out |
| Message appended | Slide down + fade in | 150ms | ease-out |

### Hover / Press Micro-interactions

| Element | Hover | Active / Press |
|---------|-------|----------------|
| Primary button | bg lightens 8%, translateY(-1px) | translateY(0), bg original |
| Secondary button | Border → ink-muted | translateY(1px) |
| Ghost button | bg: ink/5 | bg: ink/10 |
| Nav item | Underline slides in from left | — |
| Conversation item | Subtle bg shift | — |
| Landing CTA | Accent deepens, scale: 1.02 | scale: 1.0 |
| Footer attribution link | Underline + accent | — |

### Scroll Animations (Landing only)

IntersectionObserver `threshold: 0.15` or Framer Motion `whileInView`. On visible: opacity 0→1, y: 40px→0, 500ms. Children stagger 80ms.

### Route Transitions

`AnimatePresence` on React Router location key. Pattern: opacity 0→1, 200ms. No slide.

### Loading / Skeleton

Replace bare spinners with content-aware skeletons:
- Auth loading: skeleton card (2 field outlines + button outline)
- Chat loading: 3 skeleton message rows
- Sidebar loading: 4 skeleton conversation rows

Skeleton: `--color-line` fill + `@keyframes shimmer` shine animation.

### Reduced Motion

ALL animations wrapped with `prefers-reduced-motion` media query (CSS) or `useReducedMotion()` hook (Framer Motion). Framer Motion animations must check the hook — the global CSS override in `globals.css` does NOT disable Framer Motion animations.

---

## Surface Inventory — All Screens

### Surface 1: Shell — `RootLayout.tsx`

**Phase 5 redesign:**

| Part | Design |
|------|--------|
| Header bg | `--color-surface`, subtle bottom divider |
| Header height | `min-h-[56px]` |
| Wordmark | `--font-display`, italic or small-caps, ~20px |
| Nav items | Text-only + hover underline animation (remove left-border-rule) |
| Unauthenticated nav | "Sign in" (text link) + "Start planning" (small primary button) |
| Authenticated nav | "Chat" link + sidebar toggle icon-button + "Sign out" ghost link |
| Footer | Full redesigned footer — attribution, wordmark, tagline |

**Footer markup (required):**
```tsx
<footer className="border-t border-line bg-surface">
  <div className="mx-auto w-full max-w-container-xl px-md py-2xl">
    <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-display text-h3 text-ink">Waynora</p>
        <p className="mt-xs text-small text-ink-muted">AI-powered travel planning</p>
      </div>
      <p className="text-caption text-ink-muted">
        Made by{" "}
        <a
          href="https://github.com/yadavnitesh86"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="YADAV NITESH's GitHub profile"
          className="text-accent underline underline-offset-2 hover:text-ink transition-colors"
        >
          YADAV NITESH
        </a>
      </p>
    </div>
  </div>
</footer>
```

---

### Surface 2: Landing Page — `routes/Landing.tsx` (FULL REPLACEMENT)

#### Section 1: Hero

- Layout: full-width, `min-h-[90vh]`, vertically centered
- Visual anchor: typography scale + palette contrast (no image required)
- Optional: large semi-opaque decorative serif word in background (`opacity-[0.04]`)

```
Overline: "AI travel planning"    ← --text-overline, accent, uppercase, letter-spaced

H1: "Your trip, planned by a real agent."
  ← --text-display, font-display, ink
  ← text-wrap: balance
  ← max-w-[16ch]

Lead: "Describe where you want to go. Waynora's specialist agents research and write
your complete itinerary. Usually in 5 to 15 minutes — no fake progress, no instant hallucinations."
  ← --text-lead, font-sans, ink-muted
  ← max-w-prose (65ch)

CTA row:
  Primary: "Plan my trip →"   → /signup
  Text link: "How it works ↓" → #how-it-works
```

Motion: overline → H1 → lead → CTAs stagger on mount, y: 24px→0, opacity 0→1, 80ms apart.

#### Section 2: Honest Timing Strip

Dark background (`--color-surface-dark`) strip. 3 stats:
- `5 – 15 min` / "Average planning time"
- `3` / "Specialist agents at work"
- `Real` / "No fake progress or hallucinated plans"

Stats: `--text-h1` font-display for the number/value; `--text-small` for the label. Mobile: stack vertically.

#### Section 3: How It Works — `id="how-it-works"`

- Overline: "The planning process"
- H2: "From idea to itinerary"
- 4 process steps (numbered, large accent number, H3 title, body description)

Steps:
1. **Describe your trip** — "Tell Waynora where you want to go, for how long, and any preferences."
2. **Agents get to work** — "A Destination Planner, Transport Agent, and AccommodationWeather Agent research your trip simultaneously."
3. **Your plan is assembled** — "The main travel agent synthesises all agent research into a single, readable itinerary."
4. **Read it, then plan the real thing** — "An honest planning starting point — no booking, no live pricing, no hallucinations."

Layout: 2-col on desktop (steps 1–2 left, 3–4 right), single col mobile. Section wrapped in `SectionWrapper` for scroll reveal.

#### Section 4: Agent Architecture

- Overline: "Under the hood"
- H2: "Three specialists. One plan."
- 3 agent cards

| Agent | Icon (inline SVG) | Description |
|-------|------------------|-------------|
| Destination Planner | Map pin (24px, stroke-width 1.5) | "Research your destination: what to see, neighbourhoods, local context, seasonality." |
| Transport Agent | Route / road line | "Flights, trains, ground connections — the logistics of getting there and moving around." |
| AccommodationWeather Agent | House + cloud | "Where to stay and what the weather will be like across your travel dates." |

Card: `--color-surface`, `--radius-lg`, `--shadow-sm`, `--space-lg` padding. Agent name as H3, description as body-muted. Icon: 24px, accent color.

#### Section 5: What You Get

- Overline: "The output"
- H2: "A real plan, not a hallucination."
- Split: left = description text; right = code-style block of example plan STRUCTURE
- The example is clearly labelled: "Example structure — not a real Waynora output"
- No fabricated trip content presented as real

#### Footer (via RootLayout)

Attribution "Made by YADAV NITESH" → https://github.com/yadavnitesh86

---

### Surface 3: Sign In / Sign Up — Auth Surfaces

**Option A — Split panel (desktop, RECOMMENDED):**
- Left panel (40%, `--color-surface-dark`): Waynora wordmark + short editorial tagline + subtle decorative element
- Right panel (60%, light canvas): centered auth form
- Mobile: stack; dark panel becomes slim brand bar at top

**Option B — Single centered card:** Elevated version of current (shadow-md, display-serif heading).

Executor chooses Option A or B. Result MUST feel premium.

**States all surfaces:**
- Default, field focus, invalid field, submitting (Spinner + aria-busy, fields disabled), generic failure (alert above submit), success → redirect

**Copy (locked):**
- Sign In: heading "Welcome back", submit "Sign in", switch "Create an account"
- Sign Up: heading "Create your account", submit "Create account", switch "Sign in"

---

### Surface 4: Chat Empty State — `routes/Chat.tsx`

Phase 5 redesign:
- H2: "Where to?" (font-display, large, centered)
- Body: "Describe any trip — destination, duration, style. Your specialist agents will take it from there."
- The ChatComposer is ALWAYS visible and focused-elevated in the empty state
- No separate empty-state screen; the composer IS the call to action

---

### Surface 5: Chat Messages — `ChatThread`, `UserMessage`, `AssistantMessage`

**User message:**
- Right-aligned bubble, `max-w-[75%]`
- Background: `--color-accent-soft`
- `--radius-lg`, `--space-md` padding
- Font: body, ink

**Assistant message:**
- Left-aligned card
- Background: `--color-surface-raised`
- `border-left: 3px solid --color-accent`
- `--space-md --space-lg` padding
- Font: body; first paragraph uses display-serif lead weight

**Thread spacing:** `gap-xl` between messages (increased from `gap-lg`).

---

### Surface 6: ChatComposer

- Sticky to bottom, integrated into chat layout (not floating card)
- Textarea: 3-row minimum, `--radius-lg` border, refined focus ring
- Send button: icon-only (arrow-right SVG), `rounded-full`, primary accent, always visible
- Disabled during active request: muted, clearly non-interactive

---

### Surface 7: ChatSidebar

| Element | Phase 5 |
|---------|---------|
| Width | `w-64` (256px, tighter) |
| "Your chats" label | Overline style: `--text-overline`, uppercase, accent, letter-spaced |
| Section label | "Your trips" (renamed from "Your chats") |
| New chat button | Full-width primary with + icon |
| Active conversation | `--color-accent-soft` fill + 2px accent left border |
| Conversation item | Title (14px semibold) + date (caption muted) + context menu on hover |
| Empty state | "No trips yet" + small compass SVG (24px, muted) |

---

### Surface 8: WaitingShell

Phase 5 redesign — calm, atmospheric:

| Element | Phase 5 |
|---------|---------|
| Heading | H2 (serif): "Your trip is being planned." |
| Active indicator | 3 pulsing dots (CSS keyframes), NOT a spinner next to heading |
| Elapsed timer | Prominent mono display, centered in info area |
| Expectation copy | "Usually 5–15 minutes." on its own line |
| Band copy | Blockquote-style pull-quote with italic serif |
| Stop button | Ghost button with ✕ icon, right-aligned |
| 2048 lounge heading | "While you wait" |
| Container | Warm-tinted panel, subtly different from chat background |

---

### Surface 9: 2048 Board — `components/game/`

Tile colors redesigned to be cohesive with new palette:
- Low tiles (2, 4): light tints of `--color-surface-raised`
- Mid tiles (8–64): accent-soft through accent
- High tiles (128–2048): deep accent through accent+highlight
- Board grid gap: `--color-line`
- Board container: `--color-surface` bg, `--radius-md`
- Win overlay: semi-transparent, gold/accent text, "You hit 2048! 🎉" (only emoji allowed)

---

### Surface 10: ErrorBoundary (Production) — `src/ErrorBoundary.tsx`

Add `isDev` gate:
```tsx
{import.meta.env.DEV ? (
  <pre>{componentStack}</pre>
) : (
  <div className="friendly-error-panel">
    <AlertTriangleIcon aria-hidden />
    <h2>Something went wrong</h2>
    <p>Waynora encountered an unexpected error. Refresh the page to try again.</p>
    <Button onClick={() => window.location.reload()}>Refresh page</Button>
  </div>
)}
```

Design: centered `--color-surface` card, `--shadow-md`, serif H2, body-muted text, primary Button.

---

### Surface 11: 404 Page

```
Large serif: "404"  ← --text-display, accent, opacity-20, decorative layer
H1: "Page not found"  ← on top of 404, ink
Body: "We couldn't find that page. Head back home to start a trip."
Button: "Back to home" → /
```
Centered, `min-h-[70vh]`.

---

## Component Inventory

### Existing — Restyle

| Component | Changes |
|-----------|---------|
| `Button` | New palette for all variants + hover micro-interaction (translateY(-1px) on primary) |
| `TextField` | 44px min height, refined border + error state |
| `TextArea` | 3-row minimum default, refined focus ring |
| `Spinner` | Static-dots variant for reduced-motion. Shimmer for skeletons. |
| `EmptyState` | Flexible content override slot |
| `PageHeader` | Eyebrow: overline + accent. Title: full display-serif. |
| `SkipLink` | Unchanged |
| `VisuallyHidden` | Unchanged |
| `ErrorText` | Optional icon prefix |

### New — Phase 5

| Component | Purpose | File |
|-----------|---------|------|
| `LandingHero` | Hero section with motion entry | `components/landing/LandingHero.tsx` |
| `HowItWorks` | 4-step process section | `components/landing/HowItWorks.tsx` |
| `AgentCards` | 3-agent architecture cards | `components/landing/AgentCards.tsx` |
| `WhatYouGet` | Output description + example | `components/landing/WhatYouGet.tsx` |
| `StatStrip` | Dark 3-stat strip | `components/landing/StatStrip.tsx` |
| `SectionWrapper` | Section padding + scroll reveal | `components/landing/SectionWrapper.tsx` |
| `SkeletonLoader` | Configurable skeleton | `components/ui/SkeletonLoader.tsx` |
| `RouteTransition` | AnimatePresence route fade | `components/ui/RouteTransition.tsx` |

---

## Copywriting Contract — Phase 5 Additions

All Phase 1 copy is LOCKED. Phase 5 adds:

| Element | Copy |
|---------|------|
| Landing overline | `AI travel planning` |
| Landing H1 | `Your trip, planned by a real agent.` |
| Landing lead | `Describe where you want to go. Waynora's specialist agents research and write your complete itinerary — usually in 5 to 15 minutes.` |
| Landing CTA primary | `Plan my trip →` |
| Landing CTA secondary | `How it works ↓` |
| Stat 1 | `5 – 15 min` / `Average planning time` |
| Stat 2 | `3` / `Specialist agents at work` |
| Stat 3 | `Real` / `No fake progress or hallucinated plans` |
| How It Works H2 | `From idea to itinerary` |
| Agent section H2 | `Three specialists. One plan.` |
| What You Get H2 | `A real plan, not a hallucination.` |
| Example plan label | `Example structure — not a real Waynora output` |
| Attribution | `Made by YADAV NITESH` |
| Footer tagline | `AI-powered travel planning` |
| Waiting shell H2 | `Your trip is being planned.` |
| Waiting stop button | `Stop waiting` |
| Waiting lounge heading | `While you wait` |
| ErrorBoundary body | `Waynora encountered an unexpected error. Refresh the page to try again.` |
| ErrorBoundary button | `Refresh page` |
| Chat empty H2 | `Where to?` |
| Chat empty body | `Describe any trip — destination, duration, style. Your specialist agents will take it from there.` |
| Sidebar overline | `Your trips` |
| Sidebar empty title | `No trips yet` |
| Sidebar empty body | `Start a conversation and your travel plans will appear here.` |

---

## Accessibility Contract — Phase 5 Additions

Inherited Phase 1 rules: landmarks, skip link, focus ring, focus order, touch targets, form labelling, contrast.

Phase 5 additions:
- All scroll animations: `prefers-reduced-motion` via `useReducedMotion()` hook (Framer Motion) and/or CSS media query
- Route transitions: reduced-motion → immediate render, no animation
- Skeleton loaders: `role="status"` + `aria-label="Loading"` on container
- Landing sections: each `<section>` has `aria-labelledby` pointing at its H2
- Footer attribution: `aria-label="YADAV NITESH's GitHub profile"`
- All SVG icons remain `aria-hidden="true"` with parent button `aria-label`

---

## Responsive Contract

| Breakpoint | Landing | Auth | Chat | Sidebar |
|------------|---------|------|------|---------|
| 320px | Single col, hero text scales | Single col | Full-width composer | Drawer (closed) |
| 375px | Single col, fully readable | Single col card | Full width | Drawer |
| 640px (sm) | Single col + stats row | Split panel begins (Option A) | Full width | Drawer |
| 768px (md) | 2-col How It Works | Full split | Sidebar persistent | Persistent panel |
| 1024px (lg) | Agent cards 3-col | Wider split card | Side-by-side waiting | Persistent panel |
| 1280px (xl) | max-w container-xl | Same | Same | Same |

Horizontal overflow banned at 320px.

---

## Plan-by-Plan Scope

### 05-01: Editorial Landing + Full Visual Redesign

1. Token redesign — new palette values in `tokens.css` + motion tokens
2. Font loading — Google Font `<link>` in `index.html`
3. globals.css — shimmer keyframe, motion defaults
4. Install Framer Motion (or commit to CSS-only)
5. RootLayout — redesign header + footer (attribution)
6. Landing.tsx — full editorial page (5 content sections + footer)
7. Button, TextField, TextArea, Spinner — restyle for new palette + hover interactions
8. AuthCard + auth forms — redesign (Option A split or Option B card)
9. Chat empty state, ChatComposer — redesign
10. ChatThread, UserMessage, AssistantMessage — redesign message anatomy
11. ChatSidebar, ConversationItem — redesign panel + items
12. WaitingShell — atmospheric redesign
13. Game2048 tile colors + win/game-over overlays — palette-cohesive
14. ErrorBoundary — add `isDev` gate for traceback (closes D-37)
15. 404 page — redesign

### 05-02: Security Hardening + Adversarial Test Fixtures

1. Adversarial Markdown fixtures: `<script>`, `javascript:` href, `data:` href, XSS vectors
2. Cookie boundary test corpus: oversized, malformed JSON, missing version, partial shard, tampered shard
3. Malformed `/ask` response fixtures: missing `answer`, missing `thread_id`, extra fields
4. CORS / auth / secret leakage verification
5. ErrorBoundary production panel verification (if not done in 05-01)

### 05-03: Release Verification + Human Real-Viewport Pass

1. `npm run build` + `npm run preview` — production bundle
2. Full round-trip test with FastAPI on :8080
3. CORS header verification on /ask OPTIONS + POST
4. Convex auth token verification from production build
5. Responsive human browser pass: 375px, 768px, 1280px
6. axe-core a11y pass on all redesigned surfaces
7. Attribution link verification (LAND-05)
8. Automated checks: lint, tsc, unit tests, integration tests (QUAL-05)
9. Document proxy/timeout limitations (QUAL-07)

---

## UI Considerations

### Loading States
- Route-level (React.lazy + Suspense): skeleton loader, not bare spinner. `resolved` (explicit)
- Waiting shell elapsed clock: must not flicker; driven by `useElapsedClock` at 1s interval. `resolved` (explicit)
- Auth session check: skeleton card replaces bare spinner. `resolved` (explicit)

### Error States
- Network failure in chat: `RecoveryBlock` with new palette, copy unchanged. `resolved` (explicit)
- Auth failure: error alert above submit, copywriting contract copy. `resolved` (explicit)
- ErrorBoundary production: friendly panel, no traceback. `resolved` (explicit — D-08)
- 404: on-brand friendly page. `resolved` (explicit)

### Empty States
- Chat empty: "Where to?" with always-visible composer. `resolved` (explicit)
- Sidebar empty: "No trips yet" with compass SVG. `resolved` (explicit)

### Interactive States
- All interactive elements: hover + focus-visible + active + disabled. `resolved` (explicit — covered by component restyle)
- Conversation rename inline edit: focused input, clear submit/cancel. `resolved` (explicit — behavior unchanged)

### Scroll / Viewport States
- Landing sections scroll reveal: IntersectionObserver / Framer Motion whileInView. `resolved` (explicit)
- Sidebar overflow: `overflow-y-auto` on conversation list. `resolved` (explicit — unchanged)
- Chat thread overflow: `overflow-y-auto` on thread. `resolved` (explicit — unchanged)

---

## Registry Safety

| Registry | Package | Safety Gate |
|----------|---------|-------------|
| npm | `framer-motion` (if chosen) | View package.json, check bundle size (<50KB gzipped). Record in plan summary. |
| Google Fonts | One display serif | Preconnect in index.html, `font-display: swap`. Not a registry block. |

No shadcn, Radix, or other UI library. Hand-built primitives only (D-02, locked).

---

## Checker Sign-Off (7 Dimensions)

- [x] **Dimension 1 — Copywriting:** All new copy specified. Phase 1 copy locked and preserved. Attribution exact. Honest: no fake claims.
- [x] **Dimension 2 — Visuals:** Design direction specified. Palette decision-spec with constraints. Banned patterns enumerated. All 11 surfaces described with before/after.
- [x] **Dimension 3 — Color:** Token architecture preserved. New token values required to meet contrast minimums. New dark-section tokens added. Contrast requirements specified.
- [x] **Dimension 4 — Typography:** Display font upgrade specified. Type scale locked. Max 2 families. `font-display: swap`. Tabular nums on time displays.
- [x] **Dimension 5 — Spacing:** 4px grid. `--space-4xl: 96px` for landing rhythm. No ad-hoc values.
- [x] **Dimension 6 — Registry Safety:** `framer-motion` (optional, gated) + Google Fonts only. Documented.
- [x] **Dimension 7 — Accessibility:** Reduced-motion contract for all new animations. `useReducedMotion()` required for Framer Motion. Aria labels for attribution, sections, skeletons.

**Approval: APPROVED — UI-SPEC READY**

---

## Implementation Notes for Executor

1. **Use `design-taste-frontend` and `high-end-visual-design` skills** — every UI task in the plan must say this explicitly.
2. **Pick the exact palette** — the spec gives direction and constraints; fill values that produce the most impressive result. Document the chosen palette in the plan's first task.
3. **Pick the display font** — Fraunces is recommended; Playfair Display or DM Serif Display are acceptable.
4. **Pick animation approach** — Framer Motion recommended; CSS-only acceptable if equally polished.
5. **Build and run after every plan task** — no broken builds between tasks.
6. **Zero business logic changes** — if a visual change requires touching a hook or API call, flag it in the plan summary instead.
7. **Accessibility clean after redesign** — axe-core gates run in 05-03; do not introduce new violations.
8. **Commit palette, font, and animation decisions in the first task commit message** — the planner and verifier need to know what was chosen.
