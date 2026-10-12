---
phase: 03-real-chat-and-long-request-lifecycle
plan: 01
subsystem: chat
tags: [request-lifecycle, failure-taxonomy, abort-controller, timeout, react-hook, tdd]

# Dependency graph
requires:
  - phase: 02-cookie-persistence-and-chat-domain
    provides: conversation domain (markInFlight, markError, addMessage), cookie repository, retention order
  - phase: 01-foundation-contracts-and-auth
    provides: askBackend /ask contract, AskResult/AskErrorKind, safe Markdown, UI primitives
provides:
  - RequestFailureKind/RecoveryKind taxonomy with mapRequestFailure and the verbatim seven-entry RECOVERY_COPY table
  - Framework-agnostic RequestController state machine (single-flight, 20-minute budget, request IDs, stale-result rule)
  - useAskController React adapter (status mirroring, unmount and conversation-change disposal)
affects: [03-02 chat surface, 03-03 waiting shell, recovery UI, retry logic]

actuals:
  tokens: 12500
  tasks: 3
  commits: 7

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Framework-agnostic core + thin React adapter: the controller is node-testable with no React/DOM imports; the hook only mirrors emissions"
    - "abortSource set before abort() so timeout and user-stopped aborts map to distinct honest failure kinds"
    - "Stale-result rule: every result carries its submit-time requestId; results after dispose() or for superseded requests are dropped silently"

key-files:
  created:
    - src/lib/chat/failure.ts
    - src/lib/chat/failure.test.ts
    - src/lib/chat/requestController.ts
    - src/lib/chat/requestController.test.ts
    - src/hooks/useAskController.ts
    - src/hooks/useAskController.test.ts
  modified: []

key-decisions:
  - "REQUEST_TIMEOUT_MS = 1_200_000 (20 minutes) — deliberately above the 15-minute expectation so legitimate work is never interrupted (WAIT-02)"
  - "abortSource ('timeout' | 'user' | null) is captured before abort() fires, so the budget timer and the Stop control produce distinct failure kinds via mapRequestFailure (WAIT-05)"
  - "The hook clears controllerRef in its cleanup so a fresh idle controller is created per conversation — the old controller is disposed, never reused (WAIT-06)"
  - "RECOVERY_COPY strings are verbatim from the UI-SPEC failure table (em-dashes preserved); CUSTOMER_MESSAGES in src/lib/errors.ts remains the untouched data-layer source of truth"

patterns-established:
  - "TDD with type-correct behavior-wrong RED scaffolds (tdd.md #3770): tests fail on planned assertions, never on module resolution"
  - "Controller emissions are synchronous; React state observes the final emission of a synchronous dispatch (submitting -> waiting), so tests assert the observable sequence plus the single ask call that proves the submitting emission"

requirements-completed: [CHAT-08, CHAT-09, WAIT-01, WAIT-02, WAIT-06]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: Failure taxonomy with verbatim customer-safe recovery copy (six failure kinds, seven recovery entries, abort-source distinction)
    requirement: WAIT-05
    verification:
      - kind: unit
        ref: src/lib/chat/failure.test.ts
        status: pass
    human_judgment: false
  - id: D2
    description: Request controller state machine — single-flight, submitting/waiting/succeeded/failed transitions, 20-minute timeout budget, user stop, stale-result drop, timer cleanup, request-id monotonicity
    requirement: WAIT-02
    verification:
      - kind: unit
        ref: src/lib/chat/requestController.test.ts
        status: pass
    human_judgment: false
  - id: D3
    description: useAskController React adapter — idle start, status mirroring, unmount disposal with late-result drop, conversation-change disposal with idle reset, stop() delegation
    requirement: WAIT-06
    verification:
      - kind: unit
        ref: src/hooks/useAskController.test.ts
        status: pass
    human_judgment: false

# Metrics
duration: 120min
completed: 2026-10-12
status: complete
plan_head_before: 68fdee7a85dfc8aa36e8d08a80ab3ad9ce56bde4
plan_head_after: 34fd4a64d5b29a6dde2d9dc06c19bd573568b921
---

# Phase 03 Plan 01: Request Lifecycle Core Summary

**Failure taxonomy with verbatim recovery copy, a framework-agnostic request controller (single-flight, 20-minute budget, stale-result rule), and the useAskController React adapter — fully TDD, 42 new tests**

## Performance

- **Duration:** 120 min wall clock (includes a system crash, two subagent-session resets, and an inline continuation)
- **Started:** 2026-10-12T12:00Z
- **Completed:** 2026-10-12T14:05Z
- **Tasks:** 3
- **Files modified:** 6 (all created)

## Accomplishments

- Failure taxonomy: `RequestFailureKind` (network/timeout/http/malformed/unexpected/aborted), `RecoveryKind` (+reload-recovery), `mapRequestFailure` with abort-source distinction, and the verbatim seven-entry `RECOVERY_COPY` table with `RECOVERY_ACTION_LABEL`
- Request controller: framework-agnostic state machine with `REQUEST_TIMEOUT_MS = 1_200_000`, single-flight submit, monotonically increasing request IDs, timeout/user-stop abort distinction, stale-result drop after dispose or supersession, and a timer cleared on every exit path
- `useAskController` hook: mirrors controller emissions into React state, disposes on unmount (in-flight request aborted, late results dropped), and disposes + resets to idle on conversation change

## Task Commits

Each task was committed atomically (TDD: test commit then feat commit):

1. **Task 1: Failure taxonomy and verbatim recovery copy** - `ce99d97` (test), `64c7c01` (feat)
2. **Task 2: Request controller state machine** - `0c7efc1` (test), `79a9bcc` (feat)
3. **Task 3: useAskController React adapter hook** - `8d873a8` (test), `8d8dec8` (feat)
4. **Type fixes** - `34fd4a6` (fix)

**Plan metadata:** final docs commit (docs: complete plan)

## Files Created/Modified

- `src/lib/chat/failure.ts` - Failure taxonomy, abort-source mapping, verbatim recovery copy
- `src/lib/chat/failure.test.ts` - 15 tests: every AskErrorKind x abortSource combination, all seven copy keys
- `src/lib/chat/requestController.ts` - Controller state machine (no React, no DOM)
- `src/lib/chat/requestController.test.ts` - 22 tests: single-flight, sequences, timeout, user stop, stale drop, timer cleanup, request IDs
- `src/hooks/useAskController.ts` - React adapter hook
- `src/hooks/useAskController.test.ts` - 5 tests: idle, full success sequence, unmount disposal, conversation change, stop delegation

## Decisions Made

- 20-minute budget (not 15) so a legitimate slow generation is never cut off by the client
- The persisted `metadata.error` stores the RequestFailureKind key; the reload-recovery kind is derived at render time from `metadata.inFlight`, never stored
- The hook creates the controller lazily on first render and re-creates it (not reuses) on conversation change, so a stale controller can never serve a new conversation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TS2554 in requestController.test.ts re-entrant wrapper**
- **Found during:** Task 3 close-out (plan-level `npx tsc --noEmit`)
- **Issue:** The re-entrant wrapper called the deferred ask with `(request, signal)`, but `createDeferredAsk()` returns a zero-argument function
- **Fix:** Delegate with `ask()` (the deferred ask settles the same promise either way); wrapper parameters underscore-prefixed as intentionally unused
- **Files modified:** src/lib/chat/requestController.test.ts
- **Verification:** tsc --noEmit exit 0; 22 controller tests pass
- **Committed in:** 34fd4a6

**2. [Rule 1 - Bug] Unused import in useAskController.test.ts**
- **Found during:** Task 3 close-out (plan-level `npx tsc --noEmit`)
- **Issue:** `RequestStatus` import left behind after the test was restructured
- **Fix:** Removed the unused import
- **Files modified:** src/hooks/useAskController.test.ts
- **Verification:** tsc --noEmit exit 0
- **Committed in:** 34fd4a6

**3. [Execution - Runtime] Subagent instability → inline continuation**
- **Found during:** Task 3 dispatch
- **Issue:** The first executor completed Tasks 1-2 (4 commits) before a system crash; the continuation executor's session reset twice with zero progress
- **Fix:** Reconciled via git state (commits + ledger intact, Task 1-2 tests green), then executed Task 3 and the close-out inline per the workflow's runtime fallback
- **Verification:** Full suite 229 tests green; tsc clean

**Test-design note (not a deviation):** the controller's `submitting` emission is synchronous inside `submit()`, so React state (batched) cannot observe it at ask-dispatch time. The hook test asserts the observable contract — one ask call (proof the submitting emission fired), `waiting` status after dispatch, `succeeded` with answer/threadId after resolution.

---

**Total deviations:** 3 (2 Rule 1 type fixes, 1 execution/runtime adaptation)
**Impact on plan:** None on scope. All plan behaviors shipped as specified.

## Issues Encountered

- System crash and two subagent-session resets during Wave 1; recovered via git reconciliation and inline execution (no work lost, no duplicate commits)
- Vitest cold-start on this host is slow (~10-35s per invocation); test runs were given extended timeouts

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for 03-02: the controller, failure taxonomy, and hook are the exact contracts the chat surface consumes (`useAskController` status drives the composer busy state, the transcript recovery blocks, and the waiting shell)
- No blockers

---
*Phase: 03-real-chat-and-long-request-lifecycle*
*Completed: 2026-10-12*

## Self-Check: PASSED

- src/lib/chat/failure.ts — FOUND
- src/lib/chat/failure.test.ts — FOUND
- src/lib/chat/requestController.ts — FOUND
- src/lib/chat/requestController.test.ts — FOUND
- src/hooks/useAskController.ts — FOUND
- src/hooks/useAskController.test.ts — FOUND
- Commits ce99d97, 64c7c01, 0c7efc1, 79a9bcc, 8d873a8, 8d8dec8, 34fd4a6 — all ancestors of HEAD
- Full suite: 19 files, 229 tests passed
- npx tsc --noEmit: exit 0
