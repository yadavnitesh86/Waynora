---
phase: 03-real-chat-and-long-request-lifecycle
status: human_needed
completed: 2026-10-13
requirements_verified: 14
requirements_total: 14
---

# Phase 03 Verification

**Goal:** As a signed-in traveler, I want to submit a real travel request and wait honestly for the synchronous backend, so that I receive the actual answer, can continue the thread, and recover safely from failure.

## Automated evidence (all green)

| Check | Result |
|-------|--------|
| Test suite | 318/318 pass (29 files) |
| Type check | `tsc --noEmit` exit 0 |
| Lint | 0 errors (3 pre-existing warnings in generated Convex files) |
| Production build | `npm run build` succeeds |
| Honesty grep | No percentage/progress/meter/specialist claims in chat rendering code |
| isDev gate | ErrorBoundary traceback gated behind `isDev`; production panel otherwise |

## Must-haves

All plan-level must_haves verified against code:

- **03-01:** request controller state machine, failure taxonomy with verbatim recovery copy, single-flight, stale-result rule, timeout/abort lifecycle — covered by unit suites (requestController, failure, useAskController).
- **03-02:** composer, transcript, safe Markdown (no `rehype-raw`/`dangerouslySetInnerHTML` in chat), seven recovery states, cookie persistence, thread continuation — covered by Chat/ChatThread/RecoveryBlock suites.
- **03-03:** waiting shell with M:SS readout and six-band elapsed-driven copy, Stop waiting wired to the controller (CR-01 fixed, `d3682fe`), request-scoped elapsed clock (CR-02 fixed, `d3682fe`), ErrorBoundary production panel, 9 route-level lifecycle tests (long-request, stale-result, retry, malformed, duplicate, timeout, stop-waiting, elapsed baseline).

## Requirement traceability

All 14 phase requirements (CHAT-01/02/03/05/06/07/08/09, WAIT-01…06) map to completed plans 03-01/02/03 and are satisfied by tested code. No orphans.

## Code review

`03-REVIEW.md` (standard depth, 31 files): 2 critical found → **both fixed** in `d3682fe` with regression tests. 5 warnings (WR-01…WR-05) remain open and documented — non-blocking: abort classification edge cases, IME composition guard, latent controller-recreation guard, option capture timing, lint tooling gap.

## human_verification (open — external limitations, NOT passed)

1. **Real backend round-trip:** FastAPI `:8000` unreachable in this environment (connection refused). Submit a real request against live `POST /ask` when the backend runs. *External limitation per AGENTS.md — never faked.*
2. **Browser walk of failure states:** offline → network recovery, reload mid-request → reload recovery, Stop waiting → "Waiting stopped.", Try again → deliberate resend.
3. **Production build visual check** of the ErrorBoundary panel (isDev gate is unit-tested; no human has viewed the production panel).

## Verdict

Status `human_needed`: every automated gate passes and the full lifecycle is proven by the suite; the three items above require a human with a running backend. No fabrication — nothing here is marked passed without evidence.
