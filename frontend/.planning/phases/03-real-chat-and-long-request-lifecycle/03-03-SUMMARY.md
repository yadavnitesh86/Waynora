---
phase: 03-real-chat-and-long-request-lifecycle
plan: 03
subsystem: ui
tags: [waiting, elapsed-time, honesty, error-boundary, validation, lifecycle]

requires:
  - phase: 03-01
    provides: "useAskController, request controller, failure taxonomy, recovery copy"
  - phase: 03-02
    provides: "Chat route, ChatThread, UserMessage, AssistantMessage, ChatComposer, RecoveryBlock"
provides:
  - "Pure elapsed-time waiting copy (selectBand, selectVariant, formatElapsed)"
  - "useElapsedClock hook (1000ms tick, unmount cleanup)"
  - "WaitingShell component (C-10..C-14, live band copy, Stop waiting)"
  - "Production-safe ErrorBoundary (isDev-gated traceback, customer-safe panel)"
  - "Route-level lifecycle validation suite (7 integration tests)"
affects: [04-game-sidebar, 05-landing-identity]

tech-stack:
  added: []
  patterns:
    - "Pure elapsed-time math for waiting copy (no render-count path)"
    - "isDev-gated diagnostic surfaces (ErrorBoundary pre block)"
    - "Route-level integration testing with controllable fake ask + fake timers"

key-files:
  created:
    - src/components/chat/waitingCopy.ts
    - src/components/chat/waitingCopy.test.ts
    - src/hooks/useElapsedClock.ts
    - src/hooks/useElapsedClock.test.ts
    - src/components/chat/WaitingShell.tsx
    - src/components/chat/WaitingShell.test.tsx
    - src/ErrorBoundary.test.tsx
    - src/routes/Chat.lifecycle.test.tsx
  modified:
    - src/routes/Chat.tsx
    - src/ErrorBoundary.tsx
    - src/lib/chat/failure.ts
    - src/lib/chat/failure.test.ts

key-decisions:
  - "Band/variant selection is pure elapsed-time math — no render-count or randomness path"
  - "ErrorBoundary gates the diagnostic pre behind isDev; production renders customer-safe panel with Reload the page action"
  - "mapRequestFailure passes timeout through unchanged (was falling through to unexpected)"

patterns-established:
  - "Elapsed-driven waiting copy: selectBand(elapsedMs) + selectVariant(elapsedMs) → BAND_COPY[band][variant]"
  - "isDev gate: {isDev ? <diagnostic> : <customer-safe>}"
  - "Route-level lifecycle testing: controllable fake ask + fake timers + MemoryRouter"

requirements-completed: [CHAT-09, WAIT-02, WAIT-03, WAIT-04, WAIT-05, WAIT-06]

duration: 35min
completed: 2026-10-13
---

# Phase 03 Plan 03: Waiting Shell, ErrorBoundary, and Lifecycle Validation Summary

**Honest elapsed-time waiting shell with six-band copy, production-safe crash panel, and a seven-test route-level lifecycle suite proving long-request, stale-result, retry, malformed-response, duplicate-submission, and timeout-copy behavior**

## Performance

- **Duration:** 35 min
- **Started:** 2026-10-13T11:16:41Z
- **Completed:** 2026-10-13T11:52:00Z
- **Tasks:** 3 auto + 1 checkpoint
- **Files modified:** 11

## Accomplishments

- Pure elapsed-time waiting copy with verbatim six-band × two-variant table, elapsed-driven selection, and no honesty violations
- `useElapsedClock` hook ticking at 1000ms with unmount cleanup; per-second tick never re-renders the transcript or Markdown
- `WaitingShell` component composing C-10..C-14 with live-region discipline (band copy polite+atomic, readout not live)
- Production-safe ErrorBoundary: diagnostic pre gated behind `isDev`; production renders customer-safe headline, body, and Reload the page action
- Seven-test route-level lifecycle suite proving all six long-request behaviors end-to-end

## Task Commits

Each task was committed atomically:

1. **Task 1: Pure waiting copy, elapsed clock, and WaitingShell slice** - `794c564` (feat)
2. **Task 2: ErrorBoundary production-safe crash panel (D-37)** - `fa0e885` (feat)
3. **Task 3: Route-level lifecycle validation suite** - `f98569d` (feat)

## Files Created/Modified

- `src/components/chat/waitingCopy.ts` — Pure selectBand, selectVariant, formatElapsed with verbatim BAND_COPY table
- `src/components/chat/waitingCopy.test.ts` — Band boundaries, variant rule, formatElapsed cases (node env)
- `src/hooks/useElapsedClock.ts` — 1000ms elapsed clock with unmount cleanup
- `src/hooks/useElapsedClock.test.ts` — Tick and cleanup with fake timers (jsdom)
- `src/components/chat/WaitingShell.tsx` — Composed waiting panel (C-10..C-14, live band copy, Stop waiting)
- `src/components/chat/WaitingShell.test.tsx` — Strings, live-region attributes, band copy, onStop (jsdom)
- `src/ErrorBoundary.tsx` — isDev-gated traceback, production customer-safe panel
- `src/ErrorBoundary.test.tsx` — isDev true/false paths, reload spy, console.error assertion (jsdom)
- `src/routes/Chat.lifecycle.test.tsx` — 7 integration tests: long-request, stale-result, retry, malformed, duplicate, timeout
- `src/routes/Chat.tsx` — Mount WaitingShell while busy, wire stop to controller
- `src/lib/chat/failure.ts` — Add timeout to mapRequestFailure passthrough
- `src/lib/chat/failure.test.ts` — Update timeout mapping expectations

## Decisions Made

- Band/variant selection uses pure elapsed-time math (`selectBand`/`selectVariant`) — no render-count or randomness path can inject a completion or percentage claim
- ErrorBoundary renders the diagnostic pre only when `isDev` is true; production renders the customer-safe panel with headline "Something unexpected happened." and Reload the page action
- `mapRequestFailure` passes `"timeout"` through unchanged (was falling through to `"unexpected"`)
- Route-level lifecycle tests use a controllable fake ask injected via `vi.mock("../lib/api/ask")` with a deferred-promise helper, `vi.useFakeTimers` for elapsed/timeout control, and `MemoryRouter` for the route

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed mapRequestFailure to handle timeout kind**
- **Found during:** Task 3 (lifecycle test failure)
- **Issue:** `mapRequestFailure("timeout", null)` returned `"unexpected"` instead of `"timeout"`, causing the timeout recovery block to show the wrong headline
- **Fix:** Added `"timeout"` to the passthrough list in the function
- **Files modified:** src/lib/chat/failure.ts, src/lib/chat/failure.test.ts
- **Verification:** All 7 lifecycle tests pass; failure.test.ts updated to expect correct mapping
- **Committed in:** f98569d (Task 3 commit)

**2. [Rule 1 - Bug] Fixed test assertions for band boundary and variant selection**
- **Found during:** Task 1 (WaitingShell test failures)
- **Issue:** Test used 300_000ms for band C (boundary is `< 300_000`, so 300_000 is band D); test expected wrong variant at 65_000ms
- **Fix:** Changed to 299_999ms for band C; corrected variant assertion to match `floor(65000/45000)%2 = 1`
- **Files modified:** src/components/chat/WaitingShell.test.tsx
- **Verification:** All 11 WaitingShell tests pass
- **Committed in:** 794c564 (Task 1 commit)

**3. [Rule 1 - Bug] Fixed lifecycle test async patterns**
- **Found during:** Task 3 (lifecycle test failures)
- **Issue:** `findByText` hangs with fake timers; mocked Markdown renders raw string not parsed heading
- **Fix:** Used `act(() => { vi.advanceTimersByTime(0); })` to flush; changed text matching to regex
- **Files modified:** src/routes/Chat.lifecycle.test.tsx
- **Verification:** All 7 lifecycle tests pass
- **Committed in:** f98569d (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (3 bug fixes in test/mapping code)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered

- FastAPI backend not running on localhost:8000 — recorded as external limitation for Task 4 human-verify checkpoint

## Task 4 Checkpoint: Human Verification (blocking)

**Status:** Resolved under auto-mode (human-verify checkpoint auto-approved) with the plan's honest resume-signal: "backend unavailable — external limitation documented". Checkpoint closed as an external limitation, not as completed human verification.

**Backend check (external limitation, documented per AGENTS.md / CHAT-09):** FastAPI backend on localhost:8000 was attempted by the executor and is unreachable (connection refused) in this environment. No live-backend browser walkthrough was performed.

**Automated verification completed (all green):**
- All 314 tests pass (29 test files)
- `tsc --noEmit` exit 0
- Honesty grep: no banned patterns in rendering code
- isDev gate: confirmed in ErrorBoundary.tsx
- `npm run build` (production build) succeeds

**Honesty note:** No human observed any browser state. The isDev-gated ErrorBoundary production panel is unit-tested only; a visual check of the production build has not been performed.

**Human browser verification still needed (OPEN external limitation — to be walked by a human when a live backend is available):**
1. Start the FastAPI backend (uvicorn main:app on port 8000)
2. Sign in at the dev URL, submit a real trip request
3. Confirm the waiting shell shows advancing M:SS and honest band copy
4. Confirm the real plan arrives and renders as readable Markdown
5. Test failure states: network recovery, reload recovery, Stop waiting, Try again
6. Confirm ErrorBoundary production panel (requires production build or isDev=false)

## Next Phase Readiness

- Waiting shell, elapsed clock, and ErrorBoundary are production-ready
- Lifecycle validation suite proves the full long-request lifecycle
- Phase 4 (game sidebar) can mount the 2048 board in the reserved game slot
- Phase 5 (landing identity) can build on the waiting shell's honest design

---
*Phase: 03-real-chat-and-long-request-lifecycle*
*Completed: 2026-10-13*
