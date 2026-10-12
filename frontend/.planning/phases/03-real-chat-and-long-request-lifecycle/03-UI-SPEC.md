---
phase: 03
slug: real-chat-and-long-request-lifecycle
status: draft
shadcn_initialized: false
preset: none
created: 2026-10-12
tool: none
component_library: none
icon_library: inline-svg
fonts: system-first (no external font loading)
inherits: .planning/phases/01-foundation-contracts-and-auth/01-UI-SPEC.md
supersedes: none
---

# Phase 03 — UI Design Contract

> Visual and interaction contract for the real chat surface and the long-request lifecycle.
> Written against `01-UI-SPEC.md` (the shipped design system — reused, never contradicted), `01-CONTEXT.md` (D-01…D-14), `02-CONTEXT.md` (D-15…D-29), `REQUIREMENTS.md` (CHAT-01…09, WAIT-01…06) and `PROJECT.md`.
> **Mandatory skills applied here, not cited (D-12):** `design-taste-frontend` and `high-end-visual-design`. Where those skills conflict with a locked project decision, the locked decision wins and the conflict is recorded in "Skill reconciliation" below.

**Design Read** (design-taste-frontend §0.B): *Reading this as a premium consumer product's core workspace — a long-form correspondence between a traveler and a planning house, with an editorial/magazine language, leaning on the shipped Tailwind token layer, system serif display + sans body, restrained 200ms motion, and zero new dependencies.*

---

## Design System

| Property | Value |
|----------|-------|
| Tool | Tailwind CSS utilities over the shipped tokens in `src/styles/tokens.css` — no new tokens without recording them here |
| Preset | none (`shadcn_initialized: false`) |
| Component library | **none** — hand-built only (D-02). No shadcn, no Radix, no headless UI |
| Icon library | inline SVG only, 16/20/24px, `stroke="currentColor"`, `stroke-width={1.5}`, `aria-hidden="true"` — same as Phase 1 |
| Font | system-first serif display + system UI sans body; **no webfont, no external font request, ever** |
| Markdown | the existing `src/components/Markdown.tsx` (`react-markdown` + `remark-gfm`, **no `rehype-raw`**), rendered **unchanged** inside assistant messages |
| New dependencies | **zero.** Phase 3 adds no package. If an executor believes one is needed, that is a deviation to raise, not a silent install |

### Skill reconciliation (locked decisions override skill defaults)

`high-end-visual-design` bans system fonts, 1px gray borders, `ease-out`, and prescribes glassmorphism and 700ms cubic-bezier motion. Those directives are **overridden** by the shipped contract (system fonts, `--color-line` borders, 200ms `ease-out`, no `backdrop-filter`, no gradients). What Phase 3 **does** take from the skills:

| Skill principle | How Phase 3 applies it |
|---|---|
| Editorial Luxury archetype (warm cream, high-contrast serif) | Already shipped: `#F7F4EE` canvas, serif display headings. Phase 3 extends it: the chat reads as a correspondence, not a bubble wall |
| "Cards only when elevation communicates real hierarchy" (taste §4.4) | Exactly one card exists per message pair role — see Message anatomy. Assistant prose sits flat on canvas |
| Macro-whitespace / breathing room | Message vertical rhythm `lg` (24px) minimum, waiting shell padding `lg`, page column capped at 65ch measure |
| Anti-center / anti-generic (taste §4.3, §9) | No chat bubbles, no gradient hero, no AI-purple, no spinner-only loading state — the waiting shell is a composed, honest panel |
| Full state cycles (taste §4.5) | Every state below is contracted: empty, in-flight, six failure kinds, stopped, reload recovery, storage overflow |
| GPU-safe motion (both skills) | `opacity`/`transform` only, 200ms `ease-out`, no entrance spectacle — already the locked rule |
| Double-bezel nesting | Not applied (would require new radius/shadow tokens); the raised-user-message + flat-assistant contrast carries depth instead |
| `min-h-[100dvh]`, never `h-screen` (taste §3.E) | The chat column uses `dvh`-safe flexible height via the existing `flex-1` `<main>` |
| Motion must be motivated (taste §5) | The only continuous motion is the shipped `Spinner` (state feedback). Band copy changes cross-fade 200ms for legibility, nothing else moves |

---

## Spacing Scale

Phase 1's scale is inherited unchanged — `3xs 2 · 2xs 4 · xs 8 · sm 12 · md 16 · lg 24 · xl 32 · 2xl 48 · 3xl 64 · 4xl 96`. No new spacing token is introduced. Phase 3 layout metrics:

| Metric | Value | Rationale |
|--------|-------|-----------|
| Chat column max width | `--container-lg` (64rem) | Reading-first width; leaves room for the Phase 4 sidebar without reflow |
| Assistant prose measure | `--measure-prose` (65ch) | Inherited from the Markdown contract |
| User message measure | `48ch` | User requests are prompts, not articles; narrower than prose keeps the card honest and scannable |
| Message vertical rhythm | `gap: var(--space-lg)` (24px) between turns | Macro-whitespace; a thread must breathe like an article |
| Waiting shell padding | `var(--space-lg)` (24px) | Matches card padding |
| Composer block | `padding-block: var(--space-md) var(--space-xl)` | Sits on a hairline above the page end |
| Composer textarea min-height | `88px` | Multiple of 4; ≈3 comfortable lines for a multi-line trip request |
| Composer textarea max-height | `192px` | Multiple of 4; beyond this it scrolls internally, so the composer never swallows the viewport |
| Touch targets | `min 44×44px` | Inherited a11y contract; the Send button uses `Button size="md"` |

Exceptions: the textarea `88px/192px` heights are component dimensions (multiples of 4), not spacing tokens — recorded here per the Phase 1 exception rule.

---

## Typography

**Phase 3 introduces zero new font sizes and zero new weights.** Every value below resolves to a token already shipped in `tokens.css`. Sizes used on Phase 3 surfaces: **22, 17, 15, 13 px (4)**. Weights: **400, 600 (2)**.

| Role | Token | Size | Weight | Line height | Used by |
|------|-------|------|--------|-------------|---------|
| Route heading | `--text-h1` + `--font-display` | fluid clamp(2rem, 1.4rem + 2.2vw, 3rem) | 600 | 1.1 | The conversation title (via `PageHeader`) — inherited, not new |
| Section heading | `--text-h3` + `--font-sans` | 22px | 600 | 1.3 | Empty-state title, waiting-shell heading |
| Body | `--text-body` + `--font-sans` | 17px | 400 | 1.65 | User message text, assistant Markdown, time-banded waiting copy |
| Small | `--text-small` + `--font-sans` | 15px | 400 | 1.5 | Composer label, composer hint, expectation line, error/recovery body, storage notice body |
| Caption | `--text-caption` + `--font-sans` | 13px | 400 | 1.45 | Role captions, timestamps, storage-notice heading |
| Elapsed readout | `--text-mono` | 15px | 400 | 1.5 | `M:SS` elapsed value, **`font-variant-numeric: tabular-nums`** (Phase 1 rule for any time display) |

Rules:
- Serif (`--font-display`) appears on this surface in exactly two places: the route `<h1>` (inherited) and nothing else. Assistant prose is **sans**, via the unchanged Markdown contract — long itineraries stay at the 65ch sans measure Phase 1 locked.
- `text-wrap: balance` on the h1 and h3s; `text-wrap: pretty` on body paragraphs of 3+ lines.
- Nothing below 13px anywhere in Phase 3.
- Sentence case everywhere; no uppercase except the inherited overline pattern (unused on this surface).

---

## Color

Palette inherited verbatim from `01-UI-SPEC.md` / `tokens.css`. **Phase 3 reintroduces no color.**

| Role | Token | Value | Phase 3 usage |
|------|-------|-------|---------------|
| Dominant (~60%) | `--color-canvas` | `#F7F4EE` | The entire chat surface background — page, thread, composer |
| Secondary (~30%) | `--color-surface` | `#FDFBF7` | Waiting shell panel, storage notice panel, header/footer (inherited) |
| Raised | `--color-surface-raised` | `#FFFFFF` | The user message card, the composer textarea fill |
| Ink | `--color-ink` | `#1C1917` | All message text, headings, elapsed readout |
| Ink muted | `--color-ink-muted` | `#55504A` | Role captions, hints, expectation line, error bodies |
| Line | `--color-line` | `#E0DAD0` | Hairline between turns, card borders, composer top rule |
| Accent (~10%) | `--color-accent` | `#0F5C56` | Reserved list below |
| On accent | `--color-accent-ink` | `#FFFFFF` | Text on the primary Send button |
| Focus | `--color-focus` | `#C2410C` | Focus rings only |
| Destructive | `--color-danger` | `#9F1239` | Error headlines (`ErrorText`) only |
| Success | `--color-success` | `#166534` | **Unused in Phase 3.** The plan arriving is its own success; a green "success" banner is banned |

**Accent reserved for — ONLY these on Phase 3 surfaces:**
1. The `Send request` primary button fill and its label (inherited reservation 1)
2. Links inside assistant Markdown (inherited reservation 2)
3. The active nav item's left rule + text in the shell header (inherited reservation 4)
4. Focus, via `--color-focus` (inherited reservation 5)
5. **New, and the only new item:** the `Spinner` inside the waiting shell and on the in-flight user message (the primitive already renders in `--color-accent`)

Never accent in Phase 3: user message fill, message borders, hairline dividers, the elapsed readout, waiting-shell background, band copy, error blocks, the storage notice, the empty state, timestamps. Accent stays ≈10% of the screen — on this surface it is nearly all the Send button.

Hard bans carried forward: no gradients on any surface, no `backdrop-filter`, no decorative blobs, no new `box-shadow` beyond the three shipped tokens, no emoji as iconography.

---

## Copywriting Contract

Exact strings. Sentence case. No exclamation marks. No "Awesome/Amazing/Supercharge/effortless". Errors never expose raw diagnostics, status codes, stack traces, or provider messages (QUAL-01). No timing claims other than the honest 5–15 minutes.

### Identity and framing

| ID | Element | Copy |
|----|---------|------|
| C-01 | Document title | `{conversation title}` (falls back to `New chat` per D-26) via the existing `useDocumentTitle` pattern |
| C-02 | Meta description | `Your trip planning chat` |
| C-03 | Route `<h1>` | `{conversation.title}` — the derived title; `New chat` before the first message (D-26) |

### Empty state (CHAT-01)

| ID | Element | Copy |
|----|---------|------|
| C-16 | Empty-state title | `Where do you want to go?` |
| C-17 | Empty-state body | `Describe your trip in your own words. A real agent builds the plan, usually in 5 to 15 minutes. Your chat stays in this browser.` |
| C-18 | Empty-state action | **none.** The composer is directly below; a second CTA would duplicate intent |

### Composer (CHAT-02, CHAT-08)

| ID | Element | Copy |
|----|---------|------|
| C-05 | Visible label | `Your trip request` |
| C-06 | Placeholder | `Example: 10 days in Japan in April, two people, mid-range budget.` |
| C-07 | Static hint (idle, wired via `aria-describedby`) | `Press Enter to send. Shift+Enter starts a new line.` |
| C-08 | Busy notice (rendered only while a request is active, `role="status"`) | `A request is already running. Your text stays here until it finishes.` |
| C-09 | Primary CTA | `Send request` |

### Waiting shell (WAIT-03, WAIT-04)

| ID | Element | Copy |
|----|---------|------|
| C-10 | Heading (h3) | `Waynora is planning your trip` |
| C-11 | Elapsed label (visible) | `Elapsed` |
| C-12 | Elapsed value | `M:SS` (mono, tabular-nums; `15:00` not `15m 0s`) |
| C-13 | Expectation line | `Plans usually take 5 to 15 minutes.` |
| C-14 | Stop control (secondary) | `Stop waiting` |
| C-15 | In-flight message footer | `Waiting for your plan` |

### Time-banded copy (WAIT-03, WAIT-04)

Band is a pure function of elapsed time. Each band has exactly 2 variants; variant selection is also elapsed-driven (`floor(elapsed / 45000) % 2`), never render-count-driven, and never repeats consecutively. No variant claims a specialist finished, a percentage, or a promised finish time.

| Band | Elapsed | Variant 1 | Variant 2 |
|------|---------|-----------|-----------|
| A | 0:00–0:59 | `Reading your request.` | `Working on your plan.` |
| B | 1:00–2:59 | `Gathering destination ideas.` | `Looking at places that fit your trip.` |
| C | 3:00–4:59 | `Checking routes and places to stay.` | `Weighing options for your itinerary.` |
| D | 5:00–8:59 | `This one is taking a while. Full itineraries often do.` | `Still going. Longer trips need more research.` |
| E | 9:00–14:59 | `Still working on your plan.` | `Detailed plans take time to put together.` |
| F | 15:00+ | `This is taking longer than usual. Keep waiting, or stop and try again.` | `Longer than a typical plan. Keep waiting, or stop and start again.` |

Rules: the band boundary is crossed by elapsed time only. Copy never names a specialist agent as running or complete (those names are Phase 5 landing content, LAND-03). No percentages, no step counts, no `<progress>`/`<meter>`.

### Failure and recovery states (CHAT-09, WAIT-05, PERSIST-09)

Each renders inside the user message card that failed, beneath its text: `role="alert"` headline (via `ErrorText`), 15px body, and a **deliberate** secondary `Try again` button. Every block keeps the submitted prompt and full history visible above it.

| Kind | Headline | Body |
|------|----------|------|
| network | `We couldn't reach the server.` | `Check your connection and try again. Your request is saved below, and nothing was lost.` |
| timeout | `This request took too long.` | `Your trip may still be building on our side. Because it timed out here, trying again would start a second, separate plan. Your request is saved below — try again when you're ready.` |
| http | `Something went wrong on our side.` | `Your request is saved below and your conversation is intact. Try again when you're ready.` |
| malformed | `We received a response we couldn't read.` | `Your request is saved below and your conversation is intact. Try again when you're ready.` |
| unexpected | `Something unexpected happened.` | `Your request is saved below and your conversation is intact. Try again when you're ready.` |
| aborted (user stopped) | `Waiting stopped.` | `Your trip may still be building on our side. Your request is saved below — trying again would start a second, separate plan.` |
| reload recovery (in-flight at reload; D-27, PERSIST-10) | `This request was still running when you left.` | `We can't tell whether it finished, so nothing was restarted for you. Your request is saved below — try again when you're ready.` |

- Recovery action for every kind: `Try again` (secondary variant). It is never automatic, never on a timer, never on focus or reload.
- Retry re-sends the identical question; `thread_id` is included only if the conversation already holds one from a prior successful turn.
- Storage notice (not an error; `role="status"`): heading `This chat couldn't be saved.` body `Your browser's storage for Waynora is full. This conversation stays available until you close the tab, but it won't be here next time.` — no action button, rendered above the composer, does not block the request (D-20, PERSIST-05).
- The internal strings in `src/lib/errors.ts` (`CUSTOMER_MESSAGES`) remain the data-layer source of truth; the display copy above extends them with the recovery guidance WAIT-05 requires. `abort`'s short string (`The request was cancelled.`) is superseded on screen by the `aborted` block above.

---

## Motion Contract

Inherited rule: `opacity` / `transform` only, ≤ 200ms, `ease-out`, state transitions only, no entrance spectacle. The global reduced-motion block in `globals.css` already collapses all of it.

| Motion | Property | Duration/easing | Under reduced motion |
|--------|----------|-----------------|----------------------|
| Assistant answer arriving | `opacity` 0→1 | 200ms `ease-out` | Instant (global override) |
| Waiting shell appearing | `opacity` | 200ms ease-out | Instant |
| Band/variant copy change | `opacity` cross-fade only | 200ms ease-out, atomic swap | Instant swap |
| Composer busy notice appearing | `opacity` | 200ms ease-out | Instant |
| `Spinner` rotation | (shipped primitive) | — | 3 static dots (primitive already handles it) |
| Error block appearing | `opacity` | 200ms ease-out | Instant |

Explicitly banned in Phase 3: entrance/slide-in choreography, scroll-triggered reveals, scroll hijacking, marquees, parallax, pulsing/glows, animated skeletons, height animations on band copy changes, and any second continuously-animating element beyond the shipped `Spinner`.

---

## Accessibility & Focus Contract

Phase 1's contract (D-14) is inherited in full. Phase 3 adds:

1. **Thread semantics** — the transcript is `<ol aria-label="Conversation">`; each turn is an `<li>` in DOM order (oldest first). No `role="log"` and no `aria-live` on the list (see the double-announcement rule).
2. **Role captions are real text** — every message starts with a visible caption: `You` (user) or `Waynora` (assistant), 13px muted. Because they are real text in DOM order, screen readers get the role without hidden duplicates. This, plus the surface difference below, satisfies CHAT-07.
3. **Double-announcement rule (binding)** — exactly three live regions exist on `/chat`: (a) the assistant `Markdown` wrapper's inherited `aria-live="polite"`, (b) the waiting shell's band-copy region (`aria-live="polite" aria-atomic="true"`), (c) `role="alert"`/`role="status"` nodes. The transcript list itself carries **no** live region — a nested live region would announce every itinerary twice.
4. **Composer while busy** — the textarea stays enabled and focusable; only the submit button is `disabled` + `aria-busy`; the form carries `aria-busy="true"`; C-08 renders as `role="status"`. Enter is a no-op while busy.
5. **Elapsed readout is not a live region** — it updates every second and must never be announced each second. `aria-live` is absent from the readout.
6. **Band copy region** — `aria-live="polite"`, `aria-atomic="true"`, so a band change replaces the whole sentence atomically. It changes at most every 45 seconds; the elapsed value is never announced.
7. **Errors** — `role="alert"` headline (ErrorText) + `aria-hidden` 16px warning glyph, so color is never the sole signal (a11y contract 9). Focus does **not** move to errors; the alert announces in place.
8. **Storage notice** — `role="status"`, polite.
9. **Keyboard map** — Tab reaches: skip link → header nav → transcript links → recovery buttons → composer label → textarea → `Send request` / `Stop waiting`. `Enter` submits; `Shift+Enter` newline; `Enter` while busy is a no-op. No positive `tabindex`. No overlays exist in Phase 3, so Escape has no contracted behavior yet.
10. **Focus never jumps** after submit, answer arrival, or failure. The live regions do the announcing.
11. **Auto-scroll discipline** — the thread scrolls to the newest turn only when the user is already within 96px of the bottom; otherwise scroll position is untouched. No scroll stealing, ever (taste §5 spirit).

---

## Request State Machine (WAIT-01)

The controller owns this union; the UI maps each member to exactly one visual treatment.

```
idle ──submit──▶ submitting ──▶ waiting ──answer──▶ succeeded
                    │              │
                    │              ├─stop──▶ aborted ─┐
                    │              ├─timeout──────────┤
                    └──────────────┴─network/http/───┤
                       malformed / unexpected ────────┴──▶ failed(kind)
```

| Status | Visual treatment |
|--------|------------------|
| `idle` | Empty state (no messages) or transcript + active composer |
| `submitting` | Waiting shell with elapsed `0:00`, band A. Shares the visual treatment of `waiting`; the controller keeps them distinct (WAIT-01 is about the controller, not a separate screen) |
| `waiting` | Waiting shell visible; band copy driven by elapsed time |
| `succeeded` | Assistant message rendered through Markdown; waiting shell removed; `thread_id` stored (CHAT-05) |
| `failed(network/timeout/http/malformed/unexpected)` | Recovery block attached to the user message; composer re-enabled |
| `aborted` | Same treatment as failures with the abort copy; reached only via the deliberate `Stop waiting` control |
| `recovered-inflight` | Reload found a persisted in-flight message → reload-recovery block; **never auto-replays** (D-27, PERSIST-10) |

Single-flight rule (PROJECT constraint): one active request per conversation. `markInFlight`/`markError` from `src/lib/chat/domain.ts` drive the persisted metadata.

---

## Surface Inventory

States are the contract; the executor may not add states without updating this table.

| Surface | Location | States |
|---------|----------|--------|
| Chat conversation (protected) | `/chat` | session resolving (inherited) · unauthenticated → redirect (never renders) · empty · transcript active · waiting shell shown · message failed · message stopped · reload recovery · storage notice |
| Composer | `/chat` bottom | idle · busy (textarea editable, submit disabled, C-08 shown) |
| Waiting shell | last item of the transcript | bands A–F, 2 variants each; game slot empty (Phase 4) |
| User message | transcript | default · in-flight (C-15 footer + 16px Spinner) · failed (recovery block) |
| Assistant message | transcript | rendering (Markdown) · empty (never rendered — an empty answer fails validation upstream and becomes `malformed`) |
| Recovery block | inside failed user message | network · timeout · http · malformed · unexpected · aborted · reload-recovery |
| Storage notice | above composer | hidden · shown (PERSIST-05, D-20) |
| Empty state | transcript, when `messages.length === 0` | default (C-16..C-18) |

---

## Visual Anatomy

### Message anatomy (CHAT-07 — distinct, readable, honest)

**No chat bubbles.** Bubble walls are the generic AI-chat tell (taste §9); Waynora's thread reads as correspondence.

**User turn**
- Caption row: `You`, 13px, `--color-ink-muted`, weight 400.
- Below it, a raised card: `--color-surface-raised` fill, `1px solid var(--color-line)`, `--radius-lg` (8px), `--shadow-sm`, padding `var(--space-md) var(--space-lg)`, measure `48ch`, text 17px/1.65 `--color-ink`.
- The only card on the surface — elevation marks *whose* words these are (taste §4.4: cards only when hierarchy is real).
- In-flight state appends a footer row inside the card: 16px `Spinner` + C-15 caption. Failed state replaces that footer with the recovery block.

**Assistant turn**
- Caption row: `Waynora`, 13px, `--color-ink-muted`.
- Below it, **flat on canvas**: no card, no border, no shadow; the existing `Markdown` component unchanged; measure 65ch.
- Preceded by a hairline `1px solid var(--color-line)` rule spanning the column — the divider that separates turns.
- Long-response readability comes entirely from the inherited Markdown contract: 65ch measure, 17px/1.65, `mb-md` paragraph rhythm, GFM tables with `overflow-x: auto`.

### Waiting shell (WAIT-01..04) — the composed, honest wait

One panel, last item of the transcript, full column width capped at `--container-md` (48rem):

```
┌─────────────────────────────────────────────────┐
│ ◌  Waynora is planning your trip        (h3)    │  ← Spinner md + heading, gap-xs
│ Elapsed  2:41   ·  Plans usually take 5 to 15   │  ← mono tabular readout + C-13
│ minutes.                                        │
│                                                 │
│ Checking routes and places to stay.             │  ← band copy, 17px, live region
│                                                 │
│ [ Stop waiting ]                                │  ← Button secondary, sm
│                                                 │
│ (reserved region — Phase 4 game slot, empty)    │  ← renders NOTHING in Phase 3
└─────────────────────────────────────────────────┘
```

- Panel: `--color-surface`, `1px solid var(--color-line)`, `--radius-lg`, `--shadow-sm`, padding `--space-lg`.
- Layout: flex column, `gap: var(--space-md)`; the elapsed row and band copy share a `gap-xs` stack.
- `min-height` is **not** fixed to reserve game space — an empty promise of layout is still a fake promise. Phase 4 adds its own height when the board mounts (GAME-01).
- The panel is honest at every elapsed second: real clock time, honest bands, one spinner. Nothing implies progress beyond existence.

### Composer

- Sits outside the scroll flow, pinned as the last block of the column: `position: sticky; bottom: 0`, `background: var(--color-canvas)`, `border-top: 1px solid var(--color-line)`, `padding-block: var(--space-md) var(--space-xl)`.
- Structure: visible label (C-05, `text-small font-medium text-ink`, `htmlFor`-bound) → textarea (C-06 placeholder, `bg-surface-raised`, `border-line`, `--radius-md`, min 88px / max 192px, auto-grows, then scrolls internally) → hint row (C-07, and C-08 when busy) → `Send request` button (`Button variant="primary" size="md"`), right-aligned on the same row as the hints at `md+`, stacked full-width on mobile.
- Wraps in a `<form>` with `aria-busy` while a request is active. The submit `Button` receives `isSubmitting` (shows spinner, `aria-busy`, disabled) — the primitive already implements this.

### Empty state

`EmptyState` primitive with C-02/C-03, centered in the transcript area, measure 65ch, no action node. The route `<h1>` above it stays C-03 (`New chat`). Nothing decorative: no illustration, no icon, no accent — a quiet editorial invitation.

---

## Component Inventory

New feature components (not primitives) in `src/components/chat/`:

| Component | Role |
|-----------|------|
| `ChatThread` | The `<ol aria-label="Conversation">`; renders turns in order |
| `UserMessage` | User turn card + caption + in-flight footer + recovery block slot |
| `AssistantMessage` | Caption + hairline + `<Markdown content={...} />` unchanged |
| `ChatComposer` | Label, textarea, hints, CTA, busy state, form semantics |
| `WaitingShell` | The composed waiting panel: heading, elapsed, band copy, Stop, reserved region |
| `RecoveryBlock` | One component, seven kinds via props (`kind`, headline, body, `Try again`) |
| `StorageNotice` | The PERSIST-05 notice |
| `useElapsedClock` | `setInterval` at 1000ms, returns elapsed ms, cleans up on unmount (WAIT-06) |
| `waitingCopy.ts` | Pure `selectBand(elapsedMs)` + `selectVariant(elapsedMs)` — pure functions, no React (mirrors the domain-layer pattern) |

One primitive addition is authorized: **`TextArea`** in `src/components/ui/` (the primitive layer's `<input>`-only `TextField` cannot host a multi-line composer). It mirrors `TextField`'s a11y wiring exactly: visible label, `useId`, hint/error `aria-describedby`, 44px+ target. It joins the barrel `index.ts`. If the executor instead wires a raw `<textarea>` with identical semantics, that is an acceptable deviation if recorded.

The route component `src/routes/Chat.tsx` replaces `ChatPlaceholder.tsx` (which is deleted; its CTA duplication with the header's `Sign out` disappears with it). Route entry in `src/routes/index.tsx` keeps `ProtectedRoute` + lazy `Suspense`.

---

## Interaction Contract

### Composer (CHAT-02, CHAT-03, CHAT-08)

| Trigger | Behavior |
|---------|----------|
| Enter (idle) | Submits. On submit: the user message appears immediately (CHAT-03), `markInFlight` runs, the textarea **clears** (the text now lives in the transcript), focus stays in the textarea |
| Shift+Enter | Newline, always |
| Enter / click Send (busy) | **No-op.** The button is disabled, C-08 is visible, the waiting shell is on screen |
| Typing while busy | Text is preserved and editable — nothing the user composes is discarded (CHAT-08) |
| Request settles (success or failure) | Composer returns to idle; preserved draft (if any) still present; on failure the submitted prompt is visible in the transcript (PERSIST-09) and the composer is empty |
| Submit with empty/whitespace text | Blocked client-side; the Send button stays disabled for an empty draft |

### Waiting

- No cancel exists in the backend contract, but the client `AbortController` is real (WAIT-06 names abort resources), so the user gets a deliberate escape: `Stop waiting` → `aborted` → recovery block. This is the honest alternative to a fake "we cancelled it" claim, and the abort copy says the server side may continue.
- No auto-retry anywhere: not on timeout, not on network recovery, not on reload (QUAL-02, D-27).

### Retry

- `Try again` re-sends the identical question; `thread_id` is included only when the conversation already has one from a previous successful answer. First-turn retries send no `thread_id`.
- Retry is a user click on a visible, labeled control. Never automatic, never keyboard-accidental, never on a timer.

### Long-request lifecycle (WAIT-02, WAIT-06)

| Rule | Contract |
|------|----------|
| Timeout budget | `REQUEST_TIMEOUT_MS = 1_200_000` (20 minutes) — deliberately above the 15-minute expectation so legitimate work is never interrupted by a "normal short timeout" |
| Mechanism | One `AbortController` per request; a single `setTimeout` calls `abort()` at the budget; cleared in `finally` |
| Stale results | Every request captures `conversationId` + message id at submit time; a resolved result is applied **only if** the conversation still matches and the message is still in-flight — stale results are dropped silently, never rendered (WAIT-06) |
| Cleanup | Timer, listeners, and the controller are cleared on unmount and on conversation change; a result arriving after either is stale by the rule above |
| Elapsed clock | 1000ms `setInterval` inside `useElapsedClock` only; cleaned up on unmount; band/variant selection is pure elapsed-time math (`waitingCopy.ts`), never render-count math (WAIT-03) |
| Re-render discipline | The per-second tick must not re-render the transcript or `Markdown`. The clock lives in `WaitingShell`/`UserMessage`'s in-flight footer only; the thread list is memoized against per-second props |

### Optimistic persistence (CHAT-03, PERSIST-09, D-28)

1. Submit → user message added and rendered immediately; conversation persisted via the Phase 2 repository; `markInFlight` stamped.
2. Persist failure (overflow/cap) → conversation stays in memory, `StorageNotice` shows, the request proceeds — persistence failure never blocks or cancels a request.
3. Answer validated → assistant message appended, `thread_id` stored (CHAT-05), in-flight cleared.
4. Failure of any kind → `markError` with the customer-safe string for the kind; prompt + history untouched.

---

## Honesty Contract (CHAT-09 — the phase's spine)

Waynora's core value is receiving the *actual* plan. The UI may never manufacture evidence of progress or success:

**Banned on every Phase 3 surface:**
- Percentage text, `<progress>`, `<meter>`, indeterminate bars implying completion, step checklists ("3 of 5 done").
- Any claim that a specialist agent (Destination Planner, Transport Agent, AccommodationWeather Agent) is running, queued, or complete — those names belong to Phase 5's landing story (LAND-03) and appear nowhere in the waiting UI.
- Promised finish times beyond the honest 5–15 minute expectation.
- A fabricated answer, a mock plan, or a placeholder itinerary when `/ask` fails (CHAT-09 — the hard project constraint).
- Raw tracebacks, `response.status`, provider messages, stack traces, `error.message` interpolation into any product surface.
- Emoji as iconography or in copy.

**Production error surface (WAIT-01 `unexpected`, QUAL-01):** the existing `src/ErrorBoundary.tsx` currently renders `error.message` and the stack inside a `<pre>` and its own copy calls this "a development error surface". In a production build that is a raw traceback in the UI, which QUAL-01 forbids. Phase 3 contracts: the `<pre>` diagnostic block renders **only when `isDev`** (the flag already exists in `src/lib/env.ts`); production renders a customer-safe panel — headline `Something unexpected happened.`, body `Something went wrong on our side. Reload the page to try again.`, plus a `Reload the page` action — with the same canvas/surface/hairline styling as the auth error surfaces. The `componentDidCatch` console path is unchanged.

---

## Reserved Regions for Phase 4 (explicit, non-negotiable)

| Region | Phase 3 renders | Contract reserved |
|--------|-----------------|-------------------|
| Game slot | **nothing** — no element, no reserved height | The waiting shell's outer container is sized `--container-md` (48rem) so the Phase 4 2048 board mounts without a layout change (GAME-01) |
| Chat sidebar / history panel | nothing | PERSIST-06/07/08 are Phase 4. `New chat`, rename, delete, and the sidebar belong there; Phase 3 renders exactly one conversation — the newest from the Phase 2 snapshot (Phase 2 already returns newest-first, so no re-sort), or a fresh empty conversation when the snapshot is empty |
| New-chat control | none | With the sidebar in Phase 4. CHAT-01 is served in Phase 3 by the empty state on the auto-created conversation; the explicit create affordance lands with PERSIST-06. Documented boundary, not an omission |
| Rename/delete/overflow surfacing beyond `StorageNotice` | none | Phase 4 |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none — `shadcn_initialized: false` | not required |
| radix / base-ui / headless | none — hand-built primitives only (D-02) | not required |
| Third-party registries | none | not required |

**No registry blocks are used in Phase 3.** Any later addition must run the view-and-diff safety gate and record it here before merge.

---

## Discretionary Decisions Made Here (D-30…D-37)

Upstream artifacts left these open; each is decided with rationale so the checker/planner can override deliberately.

| ID | Decision | Rationale |
|----|----------|-----------|
| D-30 | No chat bubbles; one raised user card + flat assistant prose | Distinctness (CHAT-07) via surface + hairline + captions instead of accent; avoids the generic bubble-wall AI tell; keeps every long itinerary at the inherited 65ch sans measure |
| D-31 | Composer stays editable while busy (submit disabled, Enter no-op, C-08 shown) | A disabled textarea is unfocusable and silently swallows composition; CHAT-08 explicitly protects in-progress text |
| D-32 | `Stop waiting` control and the `aborted` state | A 15-minute wait with no escape hatch is a usability trap; `AskErrorKind` already carries `abort`; WAIT-06 names abort resources. Presented as an authorized extension to WAIT-01's enumeration — it is user-initiated, not a failure mode |
| D-33 | Page-level scroll with a sticky composer; the waiting shell scrolls with the transcript | Nested scroll containers are a keyboard/a11y trap and a mobile trap; Phase 4 owns keeping the game reachable during long waits (04-03) |
| D-34 | Auto-grow textarea 88→192px, then internal scroll | Keeps a long multi-line request from swallowing the viewport |
| D-35 | `Try again` reuses the prior `thread_id` only when one is already known | Deterministic against the exact `/ask` contract; first-turn retries honestly start a new thread — the timeout/abort copy says so |
| D-36 | Zero visual treatment distinguishes `submitting` from `waiting` | The controller distinguishes them (WAIT-01); a separate "Sending…" screen would be motion without motivation (taste §5) |
| D-37 | `ErrorBoundary` must gate its `<pre>` traceback behind `isDev` and use the production copy above | QUAL-01 forbids raw tracebacks in the UI; today it renders them unconditionally — this is the Phase 3 "unexpected application failure" surface |

---

## Requirement Traceability

| Requirement | Contracted by |
|-------------|---------------|
| CHAT-01 | Empty state C-16..C-18 on the auto-created conversation (create control = Phase 4, PERSIST-06) |
| CHAT-02 | Composer: Enter/Shift+Enter, C-07 hint visible in the UI, auto-grow bounds |
| CHAT-03 | Submit → immediate user message; optimistic persistence section |
| CHAT-05 | `thread_id` stored on success and reused on follow-ups / eligible retries |
| CHAT-06 | Existing `Markdown.tsx` rendered unchanged (safe renderer, GFM tables, no raw HTML) |
| CHAT-07 | Message anatomy: captions + raised/flat distinction + 65ch long-form measure + thread semantics |
| CHAT-08 | Busy composer: editable, preserved draft, disabled submit, C-08 |
| CHAT-09 | Honesty contract; `succeeded` renders only validated real answers; no fabricated anything |
| WAIT-01 | State machine (9 contracted statuses incl. all 5 failure kinds + aborted + reload recovery) |
| WAIT-02 | 20-minute budget, single AbortController, cleared in `finally` |
| WAIT-03 | Waiting shell: live elapsed readout, C-13 expectation, band copy driven by elapsed time |
| WAIT-04 | 6 bands × 2 variants, elapsed-driven selection, no consecutive repeats, no completion/percentage claims |
| WAIT-05 | Timeout/abort copy explains server-side continuation, preserves the prompt, retry is deliberate |
| WAIT-06 | Stale-result rule, cleanup-on-unmount/conversation-change, clock cleanup |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending


