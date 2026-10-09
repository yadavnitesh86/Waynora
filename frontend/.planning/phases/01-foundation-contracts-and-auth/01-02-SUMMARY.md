---
phase: 01-foundation-contracts-and-auth
plan: 02
subsystem: auth
tags: [convex-auth, password-provider, react, typescript, protected-routing, accessibility, tailwind]

# Dependency graph
requires:
  - phase: 01-01
    provides: Vite + React SPA, design tokens, route skeleton with ProtectedRoute stub, env validation module, errors module
provides:
  - Convex Auth Password provider (convexAuth + Password) with HTTP routes and auth.config.ts
  - Convex schema containing only authTables (auth/session, no chat tables)
  - ConvexAuthProvider session wiring for the SPA and useAuthState/useCurrentUser hooks
  - Accessible sign-in / sign-up forms with generic-error mapping and password visibility toggle
  - Session-aware ProtectedRoute with open-redirect-safe next allowlist and sign-out flow
affects: [01-03-ui-primitives, 02-cookie-persistence, 03-chat-slice, 05-landing]

# Tech tracking
tech-stack:
  added:
    - "@convex-dev/auth 0.0.96 (exact)"
    - "@auth/core 0.41.1 (exact)"
  patterns:
    - "convexAuth({ providers: [Password] }) server config with re-exported getAuthUserId and api.auth.currentUser query"
    - "ConvexAuthProvider (internally ConvexProviderWithAuth) as the single session provider"
    - "useAuthState: consumers must branch on isLoading before isAuthenticated (TM-05)"
    - "Every auth failure mapped to a generic copy constant; raw provider errors never rendered (TM-04)"
    - "next allowlist regex ^\/(?!\/).*$ exported from ProtectedRoute as isValidNextPath (single source, TM-03)"
    - "All Vite env reads funnel through src/lib/env.ts (isDev + env getters)"

key-files:
  created:
    - convex/auth.ts
    - convex/http.ts
    - convex/auth.config.ts
    - src/auth/AuthProvider.tsx
    - src/auth/useCurrentUser.ts
    - src/auth/useCurrentUser.test.ts
    - src/components/auth/useAuthForm.ts
    - src/components/auth/AuthCard.tsx
    - src/components/auth/PasswordField.tsx
    - src/components/auth/SignInForm.tsx
    - src/components/auth/SignUpForm.tsx
    - src/components/auth/authForms.test.tsx
    - src/routes/SignIn.tsx
    - src/routes/SignUp.tsx
  modified:
    - convex/schema.ts
    - package.json
    - package-lock.json
    - .env.example
    - src/main.tsx
    - src/routes/ProtectedRoute.tsx
    - src/routes/ChatPlaceholder.tsx
    - src/routes/index.tsx
    - src/lib/errors.ts
    - src/lib/env.ts
    - src/lib/api/ask.ts
    - src/lib/api/ask.test.ts
    - tailwind.config.ts
    - .planning/REQUIREMENTS.md
  deleted:
    - src/routes/LoginPlaceholder.tsx

key-decisions:
  - "convexAuth() used instead of the plan's new Auth(...) snippet - the pinned @convex-dev/auth 0.0.96 exports no Auth class"
  - "Two generic failure strings (signin/signup) from the UI-SPEC copy contract; both flow-generic, preserving TM-04"
  - "AuthCard renders no <form> so ProtectedRoute can reuse it for the loading state; forms own their noValidate form"
  - "isValidNextPath lives in ProtectedRoute (regex must stay there) and is imported by the forms"
  - "convex/auth.ts exports api.auth.currentUser; auth.email.ts deliberately not created (D-11)"

patterns-established:
  - "Auth form state machine: useAuthForm(values, errors, isSubmitting, formError, setField, submit)"
  - "PasswordField: visible label + aria-describedby + role=alert errors + aria-pressed show/hide toggle"
  - "Route guard: isLoading -> neutral AuthCard, unauthenticated -> validated next redirect, authenticated -> content"
  - "Server identity: getAuthUserId(ctx) re-exported from convex/auth.ts for future server functions"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06]

# Metrics
duration: 32min
completed: 2026-10-09
---

# Phase 1 Plan 2: Convex Auth Password Provider Summary

**Convex Auth Password provider wired end to end: server-side `convexAuth` + authTables-only schema, SPA session via `ConvexAuthProvider`, accessible sign-in/up/out forms with generic-error mapping, and an open-redirect-safe session-aware `ProtectedRoute`**

## Performance

- **Duration:** 32 min
- **Started:** 2026-10-09T13:43:00Z (resumed executor)
- **Completed:** 2026-10-09T14:16:00Z
- **Tasks:** 4 (Task 2 was a user-completed checkpoint, verified by executor)
- **Files modified:** 30

## Accomplishments
- Server-side auth complete: `convex/auth.ts` (Password provider only), `convex/http.ts` (`auth.addHttpRoutes`), `auth.config.ts` (domain from `process.env.CONVEX_SITE_URL`), schema containing only `authTables` — no chat/conversation/itinerary tables (D-09)
- Session provided to every route through `ConvexAuthProvider`; `useAuthState`/`useCurrentUser` expose loading/authenticated/userId with no unauthenticated flash (TM-05, D-10)
- Sign-in/sign-up/sign-out flows built to the 01-UI-SPEC copy and accessibility contracts: visible labels, `aria-describedby`+`role="alert"` errors, `aria-busy` submit, show/hide password toggle with `aria-pressed`
- Protected `/chat` redirects to `/signin?next=/chat` when signed out with a visible "Create an account" path (AUTH-05); `?next=//evil.com` and `?next=https://evil.com` both fall back to `/chat` (TM-03, unit-tested)
- 25 tests passing (7 auth-state transitions, 14 form behaviors, 1 open-redirect allowlist, 3 pre-existing auth-state extras); typecheck, lint, build, convex codegen, and convex typecheck all exit 0
- Secrets scan of `dist/` and `src/` for `jwt_private_key|convex_deployment|deploy_key` returns nothing (AUTH-06, TM-01)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install and configure the Convex Auth Password provider** - `234d6a2` (feat)
2. **Task 1 follow-up: pin auth package versions exactly (D-08)** - `8f0cbd6` (chore)
3. **Task 2: Verify JWT keypair on the Convex deployment** - `82c0eef` (chore, empty commit — evidence only)
4. **Task 3: Provide the Convex session to the SPA** - `e338f8b` (feat)
5. **Task 4: Auth forms, sign-out, and the real protected route** - `e134e5f` (feat)
6. **Task 4 follow-up: open-redirect allowlist test (TM-03)** - `7d2139f` (test)

**Plan metadata:** docs commit containing this SUMMARY.md and REQUIREMENTS.md updates (see git log after `docs(01-02)`).

## Files Created/Modified
- `convex/auth.ts` - `convexAuth({ providers: [Password] })`, re-exported `getAuthUserId`, `api.auth.currentUser` query
- `convex/http.ts` - registers `auth.addHttpRoutes(http)` on the httpRouter
- `convex/auth.config.ts` - JWT provider config: `domain: process.env.CONVEX_SITE_URL`, `applicationID: "convex"`
- `convex/schema.ts` - `defineSchema({ ...authTables })` and nothing else
- `.env.example` - documents deployment-only `JWT_PRIVATE_KEY` / `JWKS` (set via `npx convex env set`, never committed)
- `package.json` / `package-lock.json` - `@convex-dev/auth 0.0.96`, `@auth/core 0.41.1` pinned exact
- `src/auth/AuthProvider.tsx` - `ConvexAuthProvider` client built from `env.VITE_CONVEX_URL`, created lazily at first render
- `src/auth/useCurrentUser.ts` - `useAuthState()` + `useCurrentUser()` over `useConvexAuth` and `useQuery(api.auth.currentUser)`
- `src/auth/useCurrentUser.test.ts` - 7 tests: loading/authenticated/unauthenticated transitions, stale-user guard
- `src/components/auth/useAuthForm.ts` - shared validation/submit state machine, generic failure mapping
- `src/components/auth/PasswordField.tsx` - controlled input, show/hide toggle (`aria-pressed`, flipping `aria-label`)
- `src/components/auth/AuthCard.tsx` - shared card shell with serif `<h1>` and `focus-within` ring
- `src/components/auth/SignInForm.tsx` - `flow: "signIn"`, validates allowlisted `next` on success
- `src/components/auth/SignUpForm.tsx` - `flow: "signUp"`, confirm password, 8-min/10-recommended hints
- `src/components/auth/authForms.test.tsx` - 8 tests: validation, generic-vs-raw errors, submitting state, toggle, allowlist
- `src/routes/SignIn.tsx` / `src/routes/SignUp.tsx` - AuthCard + form + switch links ("Create an account" / "Sign in")
- `src/routes/ProtectedRoute.tsx` - real `useAuthState`, loading card, validated next redirect, exports `isValidNextPath`
- `src/routes/ChatPlaceholder.tsx` - Sign out button: `signOut()` then navigate `/` (TM-06)
- `src/routes/index.tsx` - `/signin` and `/signup` now lazy-load SignIn/SignUp
- `src/lib/errors.ts` - `AUTH_GENERIC_FAILURE` + `AUTH_SIGNUP_GENERIC_FAILURE`
- `src/lib/env.ts` - adds `isDev` so no other file reads the Vite env object
- `src/lib/api/ask.ts` / `ask.test.ts` - `import.meta.env.DEV` replaced with `isDev`; test env mock extended
- `tailwind.config.ts` - wires the UI-SPEC type scale into `fontSize`
- `src/routes/LoginPlaceholder.tsx` - deleted (superseded by SignIn/SignUp)

## Decisions Made
- **Two generic failure constants** — the plan named one (`AUTH_GENERIC_FAILURE`), the UI-SPEC copy contract defines distinct sign-in and sign-up generic strings; both are flow-generic and neither renders provider errors, so TM-04 holds and the copy contract is honored
- **`isValidNextPath` exported from `ProtectedRoute`** — constraint requires the literal allowlist regex to stay in `ProtectedRoute`; exporting it gives the forms the exact same expression without duplicating a security-critical regex
- **`currentUser` query lives in `convex/auth.ts`** — the plan's own key-link expects `api.auth.currentUser`; it returns only the caller's own document (`getAuthUserId`), `null` when signed out
- **AuthCard has no `<form>`** — the plan asks AuthCard to own a `noValidate` form, but the same plan reuses AuthCard for the ProtectedRoute loading state (not a form); forms therefore own their `<form>`, AuthCard owns the shell
- **`Signed in.` success status and `We recommend 10 characters or more.`** — the only copy additions beyond the UI-SPEC contract; both required by plan actions (success `aria-live` region, 10-char recommendation hint), sentence case, truthful

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `new Auth(...)` does not exist in @convex-dev/auth 0.0.96**
- **Found during:** Task 1 (resumed partial work validation)
- **Issue:** Plan snippet said `const auth = new Auth({ providers: [Password] })`; the pinned package exports `convexAuth()` (no `Auth` class), so the plan's acceptance grep could not be satisfied without breaking the build
- **Fix:** Used the documented template `convexAuth({ providers: [Password] })` with `Password` from `@convex-dev/auth/providers/Password`
- **Files modified:** convex/auth.ts
- **Verification:** `npx convex codegen` exit 0, `npx tsc -p convex/tsconfig.json --noEmit` exit 0, api.d.ts references auth
- **Committed in:** `234d6a2`

**2. [Rule 3 - Blocking] `useConvexQuery` does not exist in convex 1.46.0**
- **Found during:** Task 3 (typecheck)
- **Issue:** Plan referenced `useConvexQuery`; convex 1.46.0 exports `useQuery` (and `useConvexAuth` comes from `@convex-dev/auth/react`)
- **Fix:** `useCurrentUser` uses `useQuery(api.auth.currentUser)`; test mocks the same hook
- **Files modified:** src/auth/useCurrentUser.ts, src/auth/useCurrentUser.test.ts, src/auth/AuthProvider.tsx (comment)
- **Verification:** typecheck exit 0, 7 hook tests pass
- **Committed in:** `e338f8b`

**3. [Rule 3 - Blocking] Pre-existing `import.meta.env.DEV` reads broke Task 3's acceptance grep**
- **Found during:** Task 3 (acceptance check)
- **Issue:** `grep import.meta.env src/ | grep -v src/lib/env.ts` matched four pre-existing sites in `src/lib/api/ask.ts` (plan 01-01 code)
- **Fix:** Exported `isDev` from `src/lib/env.ts` and used it in ask.ts; later extended ask.test.ts's env mock with `isDev` when the full suite caught the missing mock
- **Files modified:** src/lib/env.ts, src/lib/api/ask.ts, src/lib/api/ask.test.ts
- **Verification:** grep returns nothing outside env.ts; 25/25 tests pass
- **Committed in:** `e338f8b`, `e134e5f`

**4. [Rule 1 - Bug] UI-SPEC type-scale utilities were never generated by Tailwind**
- **Found during:** Task 4 (auth card typography)
- **Issue:** `tailwind.config.ts` (plan 01-01) extended colors/spacing/radius/shadow but not `fontSize`, so `text-h1`, `text-small`, `text-lead` etc. used across landing and auth were dead classes — headings rendered at body size
- **Fix:** Mapped every `--text-*` token into `theme.extend.fontSize` with spec line-heights
- **Files modified:** tailwind.config.ts
- **Verification:** `npm run build` exit 0; `.text-h1{font-size:var(--text-h1)...}` present in `dist/` CSS
- **Committed in:** `e134e5f`

**5. [Rule 1 - Bug] Plan's `convex/auth.email.ts` file entry conflicts with D-11**
- **Found during:** Task 1 (plan files list)
- **Issue:** Frontmatter `files_modified` listed `convex/auth.email.ts`, but the plan action and locked decision D-11 forbid email flows in v1
- **Fix:** Not created; Password provider only (plan action text treated as authoritative over the file list)
- **Committed in:** `234d6a2` (by omission)

---

**Total deviations:** 5 auto-fixed (3 blocking, 2 bug) + design decisions documented above
**Impact on plan:** All fixes required for the pinned dependency versions and UI-SPEC compliance. No scope creep; no OAuth/email/magic-link surfaces added (D-11 intact).

## Issues Encountered
- **Resumed partial work:** prior executor's `package.json` deps, `convex/auth.ts`, `convex/auth.config.ts`, and `.env.example` block were validated against the pinned package's real API and kept; `convex/schema.ts` had also been left with `authTables` (kept). Missing `currentUser` query was added in Task 1.
- **AuthCard `<form>` conflict** between plan text and the plan's own loading-state reuse — resolved as documented in Decisions.
- **`LoginPlaceholder.tsx` orphaned** by the route swap — deleted rather than left as a fake-form trap for the UI reviewer.
- Pre-existing: `npm run lint` reports 3 warnings from auto-generated `convex/_generated/` files (unused eslint-disable), 0 errors — same as plan 01-01, untouched generated output.

## Manual Verification Still Required
Automated checks (codegen, both typechecks, lint, build, 25 tests, secrets scan, allowlist unit tests) all pass. The plan's browser checklist could not be run in this headless environment and remains for a human:
1. `npm run dev` → sign up with a new email → lands on `/chat`
2. Reload → still signed in (AUTH-04); Sign out → back at `/` with unauthenticated landing (AUTH-03)
3. `/chat` while logged out → `/signin?next=/chat` with the "Create an account" link visible (AUTH-05)
4. Wrong password → the generic friendly message, no raw error text (TM-04)
5. `?next=https://evil.com` and `?next=//evil.com` → both land on `/chat` (unit-covered by `7d2139f`; confirm in browser)

## User Setup Required
**Already completed by the user (verified by executor, not blocked):** `JWT_PRIVATE_KEY` and `JWKS` are set on deployment `dev:flippant-dodo-964` — confirmed via `npx convex env list` (Task 2 commit `82c0eef`). No keys were generated or written by the executor; no `generateKeys.mjs` leftover exists. `SITE_URL` is intentionally unset (Password provider only; set in Phase 5 when a real origin exists). `.env.local` remains gitignored and carries only the expected local material.

## Known Stubs
- `src/routes/ChatPlaceholder.tsx` — "Chat and your generated travel plans arrive in Phase 3. Nothing to show yet." is a **deliberate, UI-SPEC-mandated placeholder surface** (Phase 3 delivers real chat). Sign-out is fully wired; no data source is faked.
- No other stubs: every form field is wired to the live `useAuthActions().signIn` session mechanism; no hardcoded empty state flows to UI rendering.

## Next Phase Readiness
- Plan 01-03 can refactor the auth forms onto the `src/components/ui/` barrel — forms are self-contained (`useAuthForm`, `PasswordField`, `AuthCard`) with tokens already applied
- Phase 2 cookie work has a working session boundary: `useAuthState()` is the single gate for chat surfaces
- `getAuthUserId` is exported from `convex/auth.ts` for any future server function; `api.auth.currentUser` returns the caller's own document only
- No blockers; requirements AUTH-01…AUTH-06 marked complete in REQUIREMENTS.md (browser checklist above is the remaining human confirmation)

## Self-Check: PASSED

- All 17 key files verified present on disk
- All 6 task commits (234d6a2, 8f0cbd6, 82c0eef, e338f8b, e134e5f, 7d2139f) verified in git log
- `npx convex codegen` exits 0; `convex/_generated/api.d.ts` references auth
- `npx tsc -p convex/tsconfig.json --noEmit` exits 0
- `npm run typecheck` exits 0; `npm run lint` exits 0 (3 pre-existing generated-file warnings, 0 errors); `npm run build` exits 0
- `npx vitest run` exits 0 — 25/25 tests across 4 files
- `convex/schema.ts` matches no chat/conversation/message/itinerary/thread table names (authTables only)
- Secrets scan of `dist/` and `src/` for `jwt_private_key|convex_deployment|deploy_key`: clean
- `import.meta.env` reads outside `src/lib/env.ts`: none
- Raw-error patterns (`error.message`, `e.message`, `.stack`) in `src/components/auth/`: none
- No `forgot password` / `reset password` link anywhere in `src/` (D-11)
- 5/5 convex source files tracked in git; no untracked `convex/` files; `STATE.md` and `ROADMAP.md` untouched by this plan

---
*Phase: 01-foundation-contracts-and-auth*
*Completed: 2026-10-09*
