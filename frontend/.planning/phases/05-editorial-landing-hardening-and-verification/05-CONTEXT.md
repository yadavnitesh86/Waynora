# Phase 5: Editorial Landing, Hardening, and Verification — Context

**Gathered:** 2026-10-14  
**Status:** Ready for planning

---

## Phase Boundary

Phase 5 ships the full visual redesign of the Waynora frontend — landing page, auth screens, chat UI, waiting experience, sidebar — so the product looks and feels like it was designed by a senior product designer. It also closes open hardening items (ErrorBoundary traceback gate, adversarial test fixtures) and runs the full release verification pass (lint, type-check, tests, accessibility, responsive, attribution).

**Hard boundary:** No changes to business logic, API calls, data fetching, state machines, auth flow, backend config, or routes. If a UI change requires touching any of those, it must be flagged and discussed, not done silently.

---

## Domain

The user SEES a new Waynora — every surface that was placeholder-quality gets a purposeful, consistent visual identity. The product continues to work exactly as before.

---

## Requirements Covered

- **FOUND-04**: UI applies `design-taste-frontend` and `high-end-visual-design` skills; avoids generic SaaS patterns.
- **LAND-01**: Landing page — clear AI travel-planning value + "Plan my trip" CTA.
- **LAND-02**: Secondary CTA — how Waynora works + explicit 5–15 minute expectation.
- **LAND-03**: Accurate agent architecture — Destination Planner, Transport Agent, AccommodationWeather Agent described as specialists coordinated by the main agent.
- **LAND-04**: What users receive — plan structure, process, why it takes time.
- **LAND-05**: Attribution — clickable "Made by YADAV NITESH" → `https://github.com/yadavnitesh86`, new tab, `rel="noopener noreferrer"`.
- **LAND-06**: Editorial travel identity — meaningful composition, purposeful motion, responsive, no fabricated claims.
- **QUAL-01**: Customer-facing errors are concise; no raw tracebacks in production UI.
- **QUAL-02**: Failure states provide friendly recovery without automatic retries.
- **QUAL-03**: Hostile Markdown/URL fixtures and cookie boundary cases are tested.
- **QUAL-04**: All surfaces responsive on desktop, tablet, mobile.
- **QUAL-05**: All automated checks pass — lint, tsc, unit, integration.
- **QUAL-06**: Documented workflows verified end-to-end.
- **QUAL-07**: CORS, auth, timeout behavior documented for production-like origin.

---

## Decisions

### D-01: Overall Redesign Mandate

The entire frontend is redesigned end-to-end. Every screen — landing, auth, chat, chat sidebar, waiting room, 2048 waiting game, error states — must feel consistent and polished. Visitors should be impressed within 5 seconds of landing.

**Rationale:** User explicitly confirmed the current UI cannot ship. Phase 5 owns the full aesthetic resolution.

### D-02: Design Identity Direction

One distinctive visual identity with a specific mood — not "modern and clean."

- Strong type hierarchy — max 2 font families, deliberate weight contrast.
- Deliberate palette — curated and harmonious, not Tailwind defaults.
- Consistent spacing — same rhythm across all screens.
- Layered depth — shadows, subtle texture, foreground/background relationships.

**Banned patterns:**
- Default purple-blue gradients
- Generic 3-column card grids
- Inter + neutral-50 background
- Emoji as icons
- Centered headline + sub + button on white hero
- Fabricated social proof (testimonials, star ratings, user counts)

### D-03: Token / CSS Strategy

Locked architecture from Phase 1 — CSS custom properties in `src/styles/tokens.css`, Tailwind utility layer, no component library.

Phase 5 MAY redefine token VALUES (palette, font stacks) if the new identity requires it. New tokens may be added. Hard bans remain: no gradients on primary surfaces, no backdrop-filter, no decorative blobs, box-shadow only via declared tokens.

### D-04: Font Strategy

Option A (preferred): Load a high-quality display serif (Fraunces, Playfair Display, DM Serif Display) via `<link>` in index.html for headings + system sans for body. Use font-display: swap + preconnect to prevent layout shift.

Option B (fallback): Keep system-first serif if the new palette already feels distinctive.

Executor discretion: choose whichever produces a more impressive result. Max 2 font families total.

### D-05: Animation Library

Framer Motion OR GSAP OR CSS-only — executor chooses what clearly helps.

Required animations:
- Staggered page-load reveals
- Scroll-driven section entrances (IntersectionObserver or Framer Motion whileInView)
- Route transitions (fade or slide) between landing / auth / chat
- Hover/press/focus micro-interactions
- Skeleton loaders for loading states
- Animated empty/success/error states

Rules: transform/opacity only; prefers-reduced-motion disables or simplifies all motion.

### D-06: Landing Page Structure

Required sections:
1. Hero — primary CTA, headline, timing copy (5–15 min), secondary CTA.
2. How It Works — planning process ≤4 steps; names all 3 specialist agents.
3. What You Get — actual output description, honest expectations; NO fabricated plan previews.
4. Footer — "Made by YADAV NITESH" → https://github.com/yadavnitesh86, target="_blank", rel="noopener noreferrer".

Optional 5th section (executor discretion): editorial "Why the wait is worth it" text section.

Strictly banned: fake testimonials, fabricated trip screenshots, booking links, pricing widgets.

### D-07: Scope of UI Changes

In scope for visual redesign:
| Screen | Phase 5 Goal |
|--------|--------------|
| Landing | Full editorial landing (D-06) |
| Sign-up / Sign-in | Polished on-brand auth surfaces |
| Chat empty state | On-brand welcoming empty state |
| Chat with messages | Polished message layout + typography |
| ChatSidebar | On-brand panel, clear conversation items |
| WaitingShell | Atmospheric, honest waiting UX |
| ErrorBoundary (production) | Friendly panel (no traceback in prod) |

NOT changing: business logic, API signatures, cookie behavior, routes, auth flow, Convex queries.

### D-08: ErrorBoundary Production Panel (Open item D-37)

Gate the `<pre>` traceback behind `import.meta.env.DEV`. Production renders a friendly error panel. Closes QUAL-01.

### D-09: Adversarial Test Fixtures (QUAL-03)

Plan 05-02 adds test fixtures for:
- Hostile Markdown: `<script>`, `javascript:` href, `data:` href, XSS vectors — must be sanitized.
- Cookie boundary: oversized payload, malformed JSON, missing version, partial shard, tampered shard.
- Malformed /ask responses: missing `answer`, missing `thread_id`, unexpected extra fields.

### D-10: QUAL-07 Verification Strategy

1. npm run build + npm run preview (production bundle, local origin)
2. FastAPI on :8080 (uvicorn already confirmed running)
3. Test CORS headers on /ask OPTIONS + POST
4. Test Convex auth token passed correctly from production build
5. Submit a short real request to confirm full round-trip
6. Document proxy/hosting timeout limitation explicitly

If 15-minute path cannot be proven locally, SUMMARY says so honestly with exact limitation. QUAL-07 is satisfied by documentation, not fabricated pass.

### D-11: Responsive Gate (QUAL-04)

Human real-viewport pass in 05-03:
- 375px mobile (iPhone SE proxy)
- 768px tablet
- 1280px+ desktop

Documented in 05-03-SUMMARY.md with actual outcome.

### D-12: Component Structure Principle

Reuse existing primitive set. Add new components only for genuinely reusable visual patterns. No barrel explosion. Single-use components may live inline in parent file.

---

## Canonical Refs

| File | Note |
|------|------|
| `.planning/phases/01-foundation-contracts-and-auth/01-UI-SPEC.md` | Locked token architecture; values may change, variable names must be preserved. |
| `.planning/REQUIREMENTS.md` | All Phase 5 requirements: FOUND-04, LAND-01–06, QUAL-01–07. |
| `.planning/ROADMAP.md` | Phase 5 success criteria (4 items). |
| `src/styles/tokens.css` | Current token values — may be updated as part of redesign. |
| `src/styles/globals.css` | Motion contracts; prefers-reduced-motion rules must be preserved. |
| `src/routes/Landing.tsx` | Current placeholder landing — Phase 5 replaces this. |
| `src/ErrorBoundary.tsx` | D-08: gate traceback behind isDev. |
| `src/components/ui/` | Existing primitive set to reuse/extend. |

---

## Code Context (Reusable Assets)

| Asset | Location | Reuse in Phase 5 |
|-------|----------|-----------------|
| Design token CSS vars | `src/styles/tokens.css` | Update values; all components reference these |
| Button primitive | `src/components/ui/Button.tsx` | Style updates if palette changes |
| PageHeader primitive | `src/components/ui/PageHeader.tsx` | Landing section headings |
| Spinner | `src/components/ui/Spinner.tsx` | Skeleton loaders, loading states |
| EmptyState | `src/components/ui/EmptyState.tsx` | Chat empty state redesign |
| useDocumentTitle | `src/lib/useDocumentTitle.ts` | Landing/auth page meta |
| axe-core harness | `src/test/axe.ts` | Phase 5 a11y gates reuse this |
| AuthCard | `src/components/auth/AuthCard.tsx` | Auth screen visual redesign |

---

## Deferred Ideas

| Idea | Why deferred |
|------|-------------|
| Dark mode toggle | Requires full parallel token set; v2 candidate (V2-UX-01) |
| Localization / i18n | Separate backend/product scope |
| Booking / live pricing | Out of scope (v1) |
| OAuth / Google sign-in | v2 candidate (V2-AUTH-02) |
