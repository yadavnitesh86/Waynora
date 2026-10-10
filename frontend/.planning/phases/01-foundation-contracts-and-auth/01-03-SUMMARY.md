---
phase: 01-foundation-contracts-and-auth
plan: 03
subsystem: ui
tags: [react, typescript, tailwind, accessibility, axe-core, vitest, design-system, focus-management]

# Dependency graph
requires:
  - phase: 01-01
    provides: Vite + React SPA, design tokens, route skeleton, typed /ask boundary, safe Markdown renderer
  - phase: 01-02
    provides: Convex Auth Password provider, ConvexAuthProvider, accessible auth forms with generic-error mapping, session-aware ProtectedRoute with open-redirect-safe next allowlist
provides:
  - "src/components/ui/: eight reusable, forwardRef, token-only accessible primitives (Button, TextField, ErrorText, Spinner, EmptyState, VisuallyHidden, SkipLink, PageHeader) in one barrel"
  - "App shell (RootLayout) with SkipLink as first focusable element, session-aware nav, one header/main/footer per route"
  - "Per-route document title + meta description management (useDocumentTitle with skipTitleSuffix)"
  - "axe-core a11y suite over all five routes with zero critical/serious violations, plus skip-link and tab-order assertions"
  - "Boundary regression suites re-locking the /ask contract, the env allowlist, and the secrets funnel"
affects: [02-cookie-persistence, 03-chat-slice, 04-2048, 05-landing]

# Tech tracking
tech-stack:
  added:
    - "axe-core 4.14.0 (exact, devDependency)"
  patterns:
    - "Primitives are the only styling path: no hex/rgb()/hsl() outside src/components/ui/ and src/styles/"
    - "Button renders asChild by merging props into the single element child, so React Router <Link> semantics survive without a Radix dependency"
    - "TextField owns useId label wiring, aria-describedby (hint + error), aria-invalid, and a decorative error icon so colour is never the only signal"
    - "Spinner has two loading forms: animate-spin arc, or three static dots under prefers-reduced-motion"
    - "Document title/metadata restored on unmount; PageHeader owns the route <h1> so heading order stays valid (h1 then h3)"
    - "jsdom test environment stubs HTMLCanvasElement.getContext so axe-core does not emit jsdom noise"
    - "Test-side path resolution uses fileURLToPath(import.meta.url) rather than new URL(..., import.meta.url), which Vite rewrites into a non-file asset URL"

key-files:
  created:
    - src/components/ui/Button.tsx
    - src/components/ui/TextField.tsx
    - src/components/ui/ErrorText.tsx
    - src/components/ui/Spinner.tsx
    - src/components/ui/EmptyState.tsx
    - src/components/ui/VisuallyHidden.tsx
    - src/components/ui/SkipLink.tsx
    - src/components/ui/PageHeader.tsx
    - src/components/ui/index.ts
    - src/components/ui/primitives.test.tsx
    - src/test/a11y.test.tsx
    - src/test/axe.ts
    - src/lib/api/ask.boundary.test.ts
    - src/lib/env.boundary.test.ts
    - src/test/secrets.test.ts
  modified:
    - src/layouts/RootLayout.tsx
    - src/lib/useDocumentTitle.ts
    - src/routes/Landing.tsx
    - src/routes/NotFound.tsx
    - src/routes/ChatPlaceholder.tsx
    - src/routes/SignUp.tsx
    - src/components/auth/AuthCard.tsx
    - src/components/auth/PasswordField.tsx
    - src/components/auth/SignInForm.tsx
    - src/components/auth/SignUpForm.tsx
    - src/components/Markdown.test.tsx
    - src/test/setup.ts
    - tailwind.config.ts
    - package.json
    - package-lock.json

key-decisions:
  - "ChatPlaceholder composes PageHeader instead of EmptyState: EmptyState's title is an <h3> per the UI-SPEC, and using it alone would leave the route without an <h1> and break heading order. Documented inline in the component; the plan text asked for EmptyState."
  - "axe-core's color-contrast rule is disabled inside the helper because jsdom has no real stylesheet or layout; contrast was measured when the tokens were defined and is left to the human browser pass."
  - "Text field source-scan tests read sources with fileURLToPath(import.meta.url), because Vite rewrites new URL(..., import.meta.url) into an HTTP asset URL that fileURLToPath rejects."
  - "Button's in-button Spinner is wrapped in an aria-hidden span with a sibling role=status Spinner outside the control, so the loading label never leaks into the button's accessible name."
  - "Conversions use custom cubic-bezier + transform/opacity only; the high-end-visual-design agency mandates (double-bezel, glass nav, button-in-button, grain overlays, scroll reveals) were deliberately not applied because 01-UI-SPEC.md hard-bans them for Phase 1 and defers landing composition to Phase 5."

patterns-established:
  - "Any future surface imports from src/components/ui only; bespoke label/error/loading markup is a review failure"
  - "Every route sets its title and description through useDocumentTitle; the homepage uses skipTitleSuffix"
  - "Boundary suites re-run on every later phase: /ask strictObject, env strictObject, secrets funnel, convex/_generated import allowlist"

requirements-completed: [FOUND-01, FOUND-02, FOUND-03, FOUND-05, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, CHAT-04]

# Metrics
duration: ~1h 5m
completed: 2026-10-10
---

# Phase 01 Plan 03: Shared UI Primitives Summary

**Eight token-only accessible primitives behind one barrel, an app shell with a working skip link, five per-route titles, axe-core across every route, and boundary suites re-locking the /ask contract, env allowlist, and secret funnel.**

## Objective

Build the shared accessible shell primitives that landing, auth, chat, and waiting surfaces all reuse (CONTEXT D-04), then re-verify every Phase 1 foundation and auth contract in one consolidated gate (D-05/D-06/D-07, D-01…D-03, D-12/D-13/D-14, TM-01…TM-05).

## What Was Built

### Task 1 — Shared accessible UI primitive barrel (`a1b41dc`)

- `src/components/ui/` now holds eight `forwardRef` primitives, each extending the native element props, each styled only through the `tokens.css` Tailwind utilities, plus a single `index.ts` barrel:
  - **Button** — `variant: primary | secondary | ghost`, `size: sm | md | lg`, `isSubmitting` → `aria-busy` + `disabled`, 44px minimum touch targets at every size, `active:scale-[0.98]` tactile press, 150ms `ease-out` transitions on colour/shadow/transform only, `asChild` merges props into one element child so `<Link>` navigation survives, `href` renders a plain anchor.
  - **TextField** — `useId()`-derived label binding, `hint` and `error` wired into `aria-describedby`, `aria-invalid`, `role="alert"` error with a decorative `aria-hidden` icon so colour is never the only signal, and a `trailing` slot so the password show/hide toggle can live inside the input row.
  - **ErrorText** — `<p role="alert">` in `--color-danger` at the 15px `small` step.
  - **Spinner** — `role="status"` + `aria-label="Loading"`, renders a rotating arc or, under `prefers-reduced-motion: reduce`, three static dots.
  - **EmptyState** — H3 title, muted body, optional action node.
  - **VisuallyHidden** — the standard `sr-only` clip pattern.
  - **SkipLink** — anchor `href="#main"`, copy exactly `Skip to content`, `sr-only` until `:focus-visible`, focuses `#main` programmatically on activation.
  - **PageHeader** — `eyebrow` (accent overline), `title` as the route `<h1>` on the fluid `text-h1` scale, `lede` capped at 58ch, `actions` node.
- The auth shell was refactored onto the primitives: `AuthCard` uses `PageHeader` for its `<h1>`, `PasswordField` is now `TextField` + the toggle, and both forms use `TextField`, `Button`, and `ErrorText`. Copy and behaviour are unchanged — the existing `authForms.test.tsx` suite passes untouched, including the generic-failure, submitting-state, and allowlist cases.
- `src/components/ui/primitives.test.tsx` (16 tests) covers barrel completeness, `aria-busy` forwarding with a stable accessible name, `aria-describedby` wiring, anchor/asChild rendering, `role="alert"`, both Spinner motion modes, and the skip link moving focus.

### Task 2 — Focus, keyboard, and document-metadata foundations (`c7e8076`)

- `axe-core` 4.14.0 installed exact; `src/test/axe.ts` runs it over a container, throws on any `critical`/`serious` violation with id/impact/target, and returns the minor/moderate list for reporting. `color-contrast` is disabled inside the helper (jsdom has no layout).
- `RootLayout` was rebuilt: `SkipLink` first, then a `header` with the serif `Waynora` wordmark and a `nav[aria-label="Primary"]` that swaps between unauthenticated (`Sign in`, `Create account`) and authenticated (`Chat`, `Sign out`), then `<main id="main" tabIndex={-1}>`, then a `footer`. The old `focus:outline-none` on `<main>` — a §D-14 violation — is gone.
- `useDocumentTitle` now also manages `<meta name="description">`, restores both on unmount, no-ops without a DOM, and takes `skipTitleSuffix` for the bare `Waynora` homepage. Five distinct titles: `Waynora` / `Sign in · Waynora` / `Create account · Waynora` / `Chat · Waynora` / `Page not found · Waynora`.
- `Landing` now composes `PageHeader` + two `Button asChild` links with the exact UI-SPEC copy, carries the `{/* Phase 5 replaces this with the editorial landing page (D-13) */}` marker, and uses `VisuallyHidden` for an honest early-access note. `NotFound` uses `PageHeader` + a home button. `ChatPlaceholder` keeps the Sign out button wired to `signOut()` + `navigate("/", { replace: true })`.
- `tailwind.config.ts` gained the UI-SPEC container tokens (`max-w-container-xl` etc.) so page widths stay token-driven.
- `src/test/a11y.test.tsx` (14 tests) renders all five routes through `MemoryRouter` with mocked auth state, asserts zero critical/serious axe violations on each, and additionally asserts the skip link is the first focusable element, that activating it moves focus to `#main`, the exact landing tab order, zero positive `tabindex`, distinct per-route titles, meta description write/restore, and the Spinner reduced-motion path behind a `matchMedia` mock.

### Task 3 — Boundary regression suites (`9880ab3`)

- `src/lib/api/ask.boundary.test.ts` — both `z.strictObject` schemas, rejection of unknown keys (`stream: true`), and the exact wire format: `POST .../ask`, body exactly `{"question":...}` when `thread_id` is absent and `{"question":...,"thread_id":...}` when present. Also asserts the source contains none of `EventSource`, `ReadableStream`, `setInterval`, `progressPercent`, `jobId`, `cancelRequest`.
- `src/lib/env.boundary.test.ts` — `publicEnvSchema` rejects a missing `VITE_CONVEX_URL`, a non-URL base, and any extra key (`VITE_SECRET`).
- `src/test/secrets.test.ts` — recursively walks `src/` (Node `fs.readdirSync`, no new dependency — D-02) and blocks secret-shaped env reads, `CONVEX_DEPLOY_KEY` / `JWT_PRIVATE_KEY` / `JWT_PRIVATE`, any `import.meta.env` read outside `src/lib/env.ts`, and any relative import into `convex/` other than `convex/_generated/*`. Test files are excluded from the walk because they legitimately contain the forbidden literals.
- `src/components/Markdown.test.tsx` gained a source guard so `rehype-raw` and `dangerouslySetInnerHTML` cannot be reintroduced (D-07).
- **Mutation check performed and reverted:** temporarily adding `stream: true` to a request fixture in `ask.boundary.test.ts` made it fail (`expected false to be true`); the file was restored from a backup and re-run green (7 passed).

## Auto-Fixes / Deviations

1. **[Rule 1 - Bug] Vite rewrote `new URL(..., import.meta.url)` into a non-file URL** — `fileURLToPath` threw "The URL must be of scheme file". All three source-reading tests now use `fileURLToPath(import.meta.url)`. Found during Task 3, committed in `9880ab3`.
2. **[Rule 1 - Bug] The in-button Spinner's `aria-label` leaked into the button's accessible name** — `getByRole("button", { name: "Sign in" })` failed during submit, which is exactly the existing auth regression test. The visual spinner is now inside an `aria-hidden` span and a sibling `role="status"` Spinner carries the announcement. Found during Task 1, committed in `a1b41dc`.
3. **[Rule 3 - Blocking] `focus:outline-none` on `<main>` suppressed the focus ring** — a direct §D-14/UI-SPEC a11y-contract violation carried over from plan 01-01. Removed during the RootLayout refactor. Committed in `c7e8076`.
4. **[Rule 1 - Bug] Tailwind generated no utilities for the container tokens** — `max-w-container-xl` was needed by the shell, so the four `--container-*` tokens were mapped in `tailwind.config.ts`. Committed in `c7e8076`.
5. **[Rule 3 - Blocking] jsdom's missing canvas made axe-core noisy** — the test setup stubs `HTMLCanvasElement.prototype.getContext`. Committed in `c7e8076`.
6. **[Rule 2 - Design decision] `ChatPlaceholder` uses `PageHeader`, not `EmptyState`** — the plan asked for `EmptyState`, whose title is an `<h3>` by contract; on its own that would leave the route with no `<h1>` and an invalid heading order. `PageHeader` owns the route `<h1>` instead. `EmptyState` remains exported and unit-tested for Phase 3's in-page empty state. Documented inline in the component; committed in `c7e8076`.
7. **[Rule 3 - Blocking] Text field path resolution in `Markdown.test.tsx`** — same `import.meta.url` issue as (1). Committed in `9880ab3`.
8. **Dependency choice (justification as required by the plan):** Node's built-in `fs.readdirSync` with an explicit recursion was used instead of `glob`/`tinyglobby`. The pattern needed is a simple recursive walk; adding a package for it contradicts the minimal-dependency decision (D-02), and `Dirent.parentPath` is only reliable from Node 20.12, so the recursion is explicit rather than relying on Dirent metadata.

**Total deviations:** 7 auto-fixed (3 blocking, 2 bug, 2 design/justification).
**Impact on plan:** Every fix was required for the gate to run or for the a11y contract to hold. No scope creep; no streaming, jobs, or fabricated capability was added; `convex/` was not touched.

## Files Changed

**Created:** the eight primitives plus `src/components/ui/index.ts`, `src/components/ui/primitives.test.tsx`, `src/test/axe.ts`, `src/test/a11y.test.tsx`, `src/lib/api/ask.boundary.test.ts`, `src/lib/env.boundary.test.ts`, `src/test/secrets.test.ts`.

**Modified:**
- `src/layouts/RootLayout.tsx` — skip link, session-aware header nav, `#main` landmark with `tabIndex={-1}`, footer
- `src/lib/useDocumentTitle.ts` — meta description, restore-on-unmount, `skipTitleSuffix`
- `src/routes/Landing.tsx`, `NotFound.tsx`, `ChatPlaceholder.tsx`, `SignUp.tsx` — composed from the primitives
- `src/components/auth/AuthCard.tsx`, `PasswordField.tsx`, `SignInForm.tsx`, `SignUpForm.tsx` — refactored onto Button/TextField/ErrorText/PageHeader
- `src/components/Markdown.test.tsx` — source guard for rehype-raw / dangerouslySetInnerHTML
- `src/test/setup.ts` — canvas stub for axe-core
- `tailwind.config.ts` — container tokens
- `package.json` / `package-lock.json` — `axe-core@4.14.0` exact

## Verification

Executed on 2026-10-10 by the executor agent:

| Check | Command | Result |
|-------|---------|--------|
| Typecheck | `npm run typecheck` | **exit 0** |
| Lint | `npm run lint` | **exit 0** — 0 errors, 3 pre-existing `convex/_generated/` warnings (also present in plans 01-01 and 01-02) |
| Build | `npm run build` | **exit 0** — `dist/assets/index-DXHN7UDY.js` 361.36 kB / gzip 108.61 kB, CSS 15.56 kB |
| Full test suite | `npx vitest run` | **exit 0** — 9 files, **74 tests passed** |
| New suites | `npx vitest run src/components/ui src/test/a11y.test.tsx src/lib/api/ask.boundary.test.ts src/lib/env.boundary.test.ts src/test/secrets.test.ts` | **exit 0** — 16 + 14 + 7 + 4 + 6 |
| Axe gate | `axe.run(container, { resultTypes: ["violations"], rules: { "color-contrast": { enabled: false } } })` | **zero critical/serious on all five routes** (landing, sign in, sign up, chat authenticated, 404) |
| Colour ban | `#hex` / `rgb(` / `hsl(` in `*.tsx` outside `src/components/ui/` and `src/styles/`, tests excluded | **0 matches** |
| Forbidden patterns | `rehype-raw` / `dangerouslySetInnerHTML` / `EventSource` / `JWT_PRIVATE_KEY` / `deploy_key` in shipped `src/` and `dist/` | **0 matches** in shipped source; the only matches anywhere are inside the test files that assert their absence. In `dist/`, the sole `dangerouslySetInnerHTML` hits are the 4 emitted by React DOM's own vendor chunk (`react-dom`'s package ships 264 occurrences of the same identifier) — not application code. |
| Env funnel | `import.meta.env` in shipped `src/` | **only** `src/lib/env.ts` (lines 8, 37) |
| Mutation check | temporarily add `stream: true` to an `ask.boundary.test.ts` fixture | **test failed as expected** (`expected false to be true`), then reverted and re-run green |
| Planning/convex files | `git diff --name-only 7d5095c HEAD -- convex .planning` | **empty** — no `convex/`, `STATE.md`, `ROADMAP.md`, or `REQUIREMENTS.md` changes |

Four ROADMAP Phase 1 success criteria evidenced:
1. **Typed React/Vite SPA with shared tokens, routes, public env** — build/typecheck/lint exit 0; tokens consumed through `src/components/ui/`; `env.boundary.test.ts` locks the two-key allowlist.
2. **Sign up, log in, stay logged in, log out, protected redirect** — covered by plan 01-02's 25 tests (unchanged and still passing after the refactor, including the `next` allowlist test from `7d2139f`); the browser confirmation remains open (see Task 4).
3. **`/ask` and Markdown boundaries** — `ask.boundary.test.ts` (7 tests) and `Markdown.test.tsx` (6 tests, including the new source guard) both green.
4. **No private credentials in browser code** — `secrets.test.ts` green; the forbidden-pattern scan of shipped `src/` and `dist/` returns nothing attributable to application code (only React DOM's own `dangerouslySetInnerHTML` identifier in the vendor chunk).

## Task 4 — Human verification: NOT PERFORMED by agent

**Status: `deferred-to-human`** — not complete, not approved, and not verified by this agent.

This agent has no browser. No claim of a browser pass is made anywhere in this summary. Task 4 requires the human user to run `npm run dev` (terminal 1) with `npx convex dev` (terminal 2) and walk the following checklist from the plan verbatim:

1. `/` — the token-styled landing placeholder renders, focus ring appears on the first Tab, and the skip link "Skip to content" appears on the very first Tab and moves focus to main content.
2. `/signup` — create an account; you land on `/chat`; reload `/chat` and you are STILL signed in (AUTH-04).
3. Sign out — you return to `/` unauthenticated.
4. `/chat` while signed out — you are redirected to `/signin?next=/chat`; the "Create an account" link is visible.
5. Enter a wrong password on `/signin` — you get a friendly generic message with no raw error text.
6. Manually visit `/chat?next=https://evil.com` and `//evil.com` variants while signed out — you always end up at `/chat` after signing in, never on an external host.
7. Resize to 375px width — the header nav, buttons, and forms remain usable and nothing overflows horizontally.
8. Browser DevTools → Application → the page source/bundle contains no `CONVEX_DEPLOY`, `JWT_PRIVATE_KEY`, or any non-`VITE_` secret.
9. Check the browser console — no errors or warnings during navigation between all routes.

**Automated coverage that stands in for part of this, above:** items 1, 4, 6, 8 and 9 are partially covered in jsdom (skip link + focus, `next` allowlist, distinct titles, zero axe critical/serious, no secrets in the bundle). Items 2, 3, 5, 7 (real persisted session, real sign-out, real provider error copy, real viewport width at 375px) can only be confirmed in a real browser.

## Known Stubs

- `src/routes/ChatPlaceholder.tsx` — "Chat and your generated travel plans arrive in Phase 3. Nothing to show yet." is a deliberate, UI-SPEC-mandated placeholder (Phase 3 delivers real chat). Sign-out is fully wired.
- `src/routes/Landing.tsx` — deliberately partial, marked with the Phase 5 / D-13 comment; no hero imagery, section grid, agent storytelling, or attribution (all Phase 5).
- `src/layouts/RootLayout.tsx` footer — carries only the wordmark until Phase 5 owns footer composition.
- No faked data sources: every form field is wired to the live Convex session, and every button target is a real route.

## Issues Encountered

- The React Router v6 future-flag warnings (`v7_startTransition`, `v7_relativeSplatPath`) appear in test stderr; these are upstream notices, not errors, and were left untouched.
- The `next` allowlist regex `^\/(?!\/).*$` was re-verified: it remains literal in `src/routes/ProtectedRoute.tsx`, is still exported as `isValidNextPath`, and the regression test from commit `7d2139f` still passes after the refactor.

## Self-Check

- `src/components/ui/index.ts` exports all eight primitives plus their prop types — verified by `primitives.test.tsx` (barrel key count === 8).
- All three task commits present: `a1b41dc`, `c7e8076`, `9880ab3` — verified in `git log`.
- `npm run typecheck` exit 0, `npm run lint` 0 errors, `npm run build` exit 0, `npx vitest run` 74/74 — verified above.
- `convex/` and `.planning/` untouched since `7d5095c` — verified.

---
*Phase: 01-foundation-contracts-and-auth*
*Completed: 2026-10-10*
