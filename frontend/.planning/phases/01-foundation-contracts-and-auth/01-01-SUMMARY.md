---
phase: 01-foundation-contracts-and-auth
plan: 01
subsystem: infra
tags: [react, vite, typescript, tailwind, zod, react-markdown, vitest, eslint]

# Dependency graph
requires: []
provides:
  - Vite + React + TypeScript SPA foundation with ESM toolchain
  - Design token system (tokens.css + tailwind.config.ts) locked to UI-SPEC
  - Public env validation module (VITE_API_BASE_URL, VITE_CONVEX_URL only)
  - Typed /ask API boundary with zod strictObject schemas
  - HTML-safe Markdown renderer (react-markdown + remark-gfm, no rehype-raw)
  - Route structure with lazy loading, ProtectedRoute, and 404
  - useDocumentTitle hook for per-route document titles
affects: [01-02, 02-cookie-persistence, 03-chat-slice, 04-2048, 05-landing]

# Tech tracking
tech-stack:
  added:
    - react ^18.3.1
    - react-dom ^18.3.1
    - react-router-dom ^6.30.0
    - zod ^3.24.0
    - tailwindcss ^3.4.17
    - postcss ^8.4.49
    - autoprefixer ^10.4.20
    - react-markdown ^9.0.1
    - remark-gfm ^4.0.0
    - vite ^6.0.7
    - vitest ^3.0.5
    - @testing-library/react ^16.2.0
    - @testing-library/jest-dom ^6.6.3
    - eslint ^9.18.0
    - typescript-eslint ^8.20.0
  patterns:
    - ESM Vite app with strict TypeScript (noUncheckedIndexedAccess, verbatimModuleSyntax)
    - Tailwind utility-first with design tokens as CSS custom properties
    - zod strictObject for API boundary validation (rejects unknown keys)
    - Discriminated union result type (AskResult) instead of thrown errors
    - React.lazy + Suspense for all non-critical routes
    - createBrowserRouter with nested route table

key-files:
  created:
    - src/lib/api/ask.ts
    - src/lib/api/ask.test.ts
    - src/lib/env.ts
    - src/lib/errors.ts
    - src/lib/useDocumentTitle.ts
    - src/components/Markdown.tsx
    - src/components/Markdown.test.tsx
    - src/routes/index.tsx
    - src/routes/Landing.tsx
    - src/routes/LoginPlaceholder.tsx
    - src/routes/ChatPlaceholder.tsx
    - src/routes/ProtectedRoute.tsx
    - src/routes/NotFound.tsx
    - src/layouts/RootLayout.tsx
    - src/styles/tokens.css
    - src/styles/globals.css
    - src/index.css
    - src/main.tsx
    - src/vite-env.d.ts
    - src/test/setup.ts
    - tailwind.config.ts
    - postcss.config.js
    - vitest.config.ts
    - eslint.config.js
    - .env.example
  modified:
    - package.json
    - tsconfig.json
    - tsconfig.node.json
    - vite.config.ts
    - index.html
    - .gitignore

key-decisions:
  - "Use z.strictObject for /ask schemas to reject unknown keys and prevent contract drift"
  - "AskResult discriminated union instead of thrown errors for all HTTP/network failures"
  - "env module uses lazy getter pattern: envError always available, env throws on first access"
  - "ProtectedRoute hardcodes isAuthenticated=false for Phase 1, replaced in plan 01-02"
  - "LoginPlaceholder uses useLocation to distinguish /signin vs /signup (no :mode param)"
  - "Markdown allowedElements whitelist excludes script, style, iframe, object, embed, form"

patterns-established:
  - "API boundary: zod strictObject schemas + discriminated union result types"
  - "Env validation: z.strictObject allowlist + lazy getter with envError for config panel"
  - "Route protection: ProtectedRoute wrapper with validated next param (open-redirect safe)"
  - "Markdown safety: react-markdown without rehype-raw, URL transform allowlist, allowedElements"
  - "Design tokens: CSS custom properties on :root, consumed via tailwind.config.ts theme.extend"

requirements-completed: [FOUND-01, FOUND-02, FOUND-03, FOUND-05, CHAT-04]

# Metrics
duration: 25min
completed: 2026-10-09
---

# Phase 1 Plan 1: Foundation, Contracts, and Auth Summary

**Vite + React + TypeScript SPA with design tokens, typed /ask boundary, safe Markdown renderer, and protected route structure**

## Performance

- **Duration:** 25 min
- **Started:** 2026-10-09T18:24:03Z
- **Completed:** 2026-10-09T18:49:00Z
- **Tasks:** 4
- **Files modified:** 33

## Accomplishments
- Migrated CommonJS skeleton to ESM Vite + React + TypeScript with strict tsconfig
- Built complete design token system locked to 01-UI-SPEC.md (color, type, spacing, radius, shadow)
- Implemented zod-validated /ask API boundary with discriminated union error handling
- Created HTML-safe Markdown renderer with URL transform and allowedElements whitelist
- Established route structure with lazy loading, ProtectedRoute, and 404 handling
- All 10 tests passing (6 API boundary + 4 Markdown security)

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate to Vite + React + TypeScript toolchain** - `5b17d6f` (feat)
2. **Task 2: Install Tailwind and build shared responsive design tokens** - `11c5db0` (feat)
3. **Task 3: Public env validation and the exact typed /ask boundary** - `e90a8c7` (feat)
4. **Task 4: Safe Markdown renderer, route structure, and document titles** - `9943765` (feat)

## Files Created/Modified
- `package.json` - ESM Vite app with all required dependencies and scripts
- `tsconfig.json` - Strict TypeScript config with project references
- `tsconfig.node.json` - Node project config for vite/vitest
- `vite.config.ts` - Vite config with React plugin and es2022 target
- `vitest.config.ts` - Vitest config with jsdom environment
- `eslint.config.js` - ESLint flat config with typescript-eslint
- `index.html` - HTML entry point
- `src/main.tsx` - React root with BrowserRouter
- `src/App.tsx` - RouterProvider with route table
- `src/index.css` - Tailwind directives + design tokens import
- `src/vite-env.d.ts` - Vite client types + ImportMetaEnv augmentation
- `src/test/setup.ts` - Vitest setup with @testing-library/jest-dom
- `src/styles/tokens.css` - Design tokens as CSS custom properties (locked to UI-SPEC)
- `src/styles/globals.css` - Focus ring, reduced motion, base body styles
- `tailwind.config.ts` - Tailwind config mapping tokens to theme.extend
- `postcss.config.js` - PostCSS with tailwindcss + autoprefixer
- `.env.example` - Public env var documentation
- `src/lib/errors.ts` - AskErrorKind, AskResult, CUSTOMER_MESSAGES
- `src/lib/env.ts` - publicEnvSchema, env with lazy getter, envError
- `src/lib/api/ask.ts` - askRequestSchema, askResponseSchema, askBackend
- `src/lib/api/ask.test.ts` - 6 tests covering serialization, parsing, malformed, http, abort
- `src/lib/useDocumentTitle.ts` - Document title hook with meta description
- `src/components/Markdown.tsx` - Safe Markdown renderer with react-markdown + remark-gfm
- `src/components/Markdown.test.tsx` - 4 tests for HTML stripping, URL safety, GFM tables, link attrs
- `src/routes/index.tsx` - createBrowserRouter with lazy routes and ProtectedRoute
- `src/routes/Landing.tsx` - Landing placeholder with token-styled copy
- `src/routes/LoginPlaceholder.tsx` - Sign-in/sign-up placeholder forms
- `src/routes/ChatPlaceholder.tsx` - Protected chat placeholder
- `src/routes/ProtectedRoute.tsx` - Auth guard with validated next param
- `src/routes/NotFound.tsx` - 404 page
- `src/layouts/RootLayout.tsx` - Skip link, main landmark, Outlet

## Decisions Made
- Used `z.strictObject` for both request and response schemas to reject unknown keys and prevent contract drift
- `askBackend` returns a discriminated union (`AskResult`) instead of throwing for HTTP/network failures
- `env` module uses lazy getter pattern: `envError` is always available for the config-error panel, `env` throws on first access
- `ProtectedRoute` hardcodes `isAuthenticated = false` for Phase 1; plan 01-02 replaces with real Convex auth
- `LoginPlaceholder` uses `useLocation().pathname` to distinguish `/signin` vs `/signup` (no `:mode` param in route)
- Markdown `allowedElements` whitelist excludes `script`, `style`, `iframe`, `object`, `embed`, `form`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed tsconfig.node.json project reference error**
- **Found during:** Task 1 (Vite toolchain migration)
- **Issue:** `noEmit: true` in tsconfig.node.json conflicted with project references (TS6310)
- **Fix:** Replaced `noEmit` with `composite: true` and `tsBuildInfoFile`
- **Files modified:** tsconfig.node.json
- **Verification:** `npm run typecheck` exits 0
- **Committed in:** `5b17d6f` (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed moduleResolution error in tsconfig.node.json**
- **Found during:** Task 1 (build verification)
- **Issue:** `resolveJsonModule` cannot be used with `moduleResolution: "classic"` (default)
- **Fix:** Added `moduleResolution: "bundler"` to tsconfig.node.json
- **Files modified:** tsconfig.node.json
- **Verification:** `npm run build` exits 0
- **Committed in:** `5b17d6f` (Task 1 commit)

**3. [Rule 3 - Blocking] Fixed CSS @import order in index.css**
- **Found during:** Task 2 (Tailwind installation)
- **Issue:** PostCSS warning: `@import must precede all other statements`
- **Fix:** Moved `@import` statements before `@tailwind` directives
- **Files modified:** src/index.css
- **Verification:** Build completes without CSS warnings
- **Committed in:** `11c5db0` (Task 2 commit)

**4. [Rule 1 - Bug] Fixed Markdown test assertion for raw HTML stripping**
- **Found during:** Task 4 (Markdown renderer)
- **Issue:** Test expected `getByText("Hello")` to find text, but react-markdown escapes raw HTML as text
- **Fix:** Changed test to verify no `<img>` element is rendered (security property) instead of text content
- **Files modified:** src/components/Markdown.test.tsx
- **Verification:** All 4 Markdown tests pass
- **Committed in:** `9943765` (Task 4 commit)

**5. [Rule 1 - Bug] Fixed LoginPlaceholder useParams to useLocation**
- **Found during:** Task 4 (route structure)
- **Issue:** LoginPlaceholder used `useParams<{ mode: "signin" | "signup" }>()` but routes don't have `:mode` param
- **Fix:** Changed to `useLocation().pathname` to determine sign-in vs sign-up mode
- **Files modified:** src/routes/LoginPlaceholder.tsx
- **Verification:** `npm run build` exits 0
- **Committed in:** `9943765` (Task 4 commit)

---

**Total deviations:** 5 auto-fixed (3 blocking, 2 bug)
**Impact on plan:** All auto-fixes necessary for correctness and functionality. No scope creep.

## Issues Encountered
- ESLint reports 3 warnings from `convex/_generated/` files (unused eslint-disable directives). These are auto-generated files not modified in this plan. 0 errors.

## User Setup Required
None - no external service configuration required. The app runs with `npm run dev` after copying `.env.example` to `.env.local` and filling in the two public URLs.

## Next Phase Readiness
- Foundation complete: Vite app builds, typechecks, lints, and tests pass
- Design token system ready for all subsequent UI work
- /ask boundary typed and tested for Phase 3 chat integration
- ProtectedRoute stub ready for plan 01-02 to wire real Convex auth
- Markdown renderer ready for Phase 3 chat message rendering
- No blockers for plan 01-02 (Convex Auth integration)

## Self-Check: PASSED

- All 16 key files verified present on disk
- All 4 task commits (5b17d6f, 11c5db0, e90a8c7, 9943765) verified in git log
- `npm run typecheck` exits 0
- `npm run lint` exits 0 (3 warnings from convex/_generated/, 0 errors)
- `npm run build` exits 0 and emits dist/
- `npx vitest run` exits 0 (10 tests passing)
- Only VITE_API_BASE_URL and VITE_CONVEX_URL read from import.meta.env
- No CONVEX_DEPLOY, deploy_key, or secrets in src/
- convex/schema.ts and convex/_generated/api.d.ts unchanged

---
*Phase: 01-foundation-contracts-and-auth*
*Completed: 2026-10-09*
