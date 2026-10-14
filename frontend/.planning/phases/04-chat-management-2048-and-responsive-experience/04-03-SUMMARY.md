---
phase: 04-chat-management-2048-and-responsive-experience
plan: 03
subsystem: ui
tags: [waiting-room, game-2048-integration, responsive-design, accessibility, axe-core, vitest, qual-04]

# Dependency graph
requires:
  - phase: 03-real-chat-and-long-request-lifecycle
    provides: WaitingShell with reserved game slot, useAskController waiting status, elapsed clock
  - phase: 04 (04-01)
    provides: Chat route with sidebar split, useConversations, responsive drawer/collapse behavior
  - phase: 04 (04-02)
    provides: deterministic 2048 engine + accessible Game2048 controller (keyboard/touch/d-pad, input isolation)
provides:
  - WaitingShell "Waiting lounge" that mounts Game2048 only while the request status is `waiting` (GAME-01)
  - Route-level proof that playing 2048 never touches the ask lifecycle (GAME-06): no submit, no abort, stop wiring intact
  - Responsive class-contract suite (Chat.responsive.test.tsx) for drawer/panel split, sticky composer, lg side-by-side lounge, reduced-motion contract
  - axe-core gates for the open history drawer, active waiting room with 2048, and win/game-over overlays
affects: [05-03 full responsive/release verification, human browser pass for QUAL-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Waiting-room decoration mounts behind a status-kind gate (isWaiting), never receiving request state
    - jsdom-verified responsive class contracts + matchMedia-stubbed viewport behavior (real-viewport pass stays human)

key-files:
  created:
    - src/routes/Chat.responsive.test.tsx
  modified:
    - src/components/chat/WaitingShell.tsx
    - src/components/chat/WaitingShell.test.tsx
    - src/routes/Chat.tsx
    - src/routes/Chat.test.tsx
    - src/components/chat/ChatSidebar.tsx
    - src/test/a11y.test.tsx

key-decisions:
  - "Game2048 mounts in WaitingShell behind an isWaiting prop fed with status.kind === 'waiting' from the route, so the board never appears during the brief submitting phase and unmounts with the shell on any terminal status"
  - "The waiting lounge card carries explicit honest copy ('Playing never affects your request') and receives zero request state — defence in depth for GAME-06 on top of the game's own input isolation"
  - "Responsive breakpoints stay keyed on the 04-01-locked md (768px) boundary — drawer below, collapsible persistent panel above, lg for the side-by-side lounge — rather than re-keying to the plan's 640/1024 numbers, which would have regressed 34 tested drawer/collapse behaviors for no functional gain"
  - "The reduced-motion contract is asserted from the real stylesheet on disk (globals.css read via node:fs) because vitest's default CSS handling mocks ?raw imports to an empty string"
  - "QUAL-04's automated portion is delivered (class contracts, viewport-driven behavior, reduced motion, axe); the real-viewport browser pass remains a human gate, so QUAL-04 is left unchecked in REQUIREMENTS.md"

patterns-established:
  - "Waiting-room game integration: a decoration component mounts behind a status-kind gate and is verified at both component and route level to be lifecycle-neutral"

requirements-completed: [GAME-01, GAME-06]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: 2048 board mounts in the waiting lounge only while the request is actively waiting; unmounts cleanly on success and on stop-abort with the answer/prompt preserved
    requirement: GAME-01
    verification:
      - kind: unit
        ref: src/components/chat/WaitingShell.test.tsx (3 new tests)
        status: pass
      - kind: integration
        ref: src/routes/Chat.test.tsx#Chat route waiting game integration (GAME-01, GAME-06) (4 tests)
        status: pass
    human_judgment: false
  - id: D2
    description: Game moves never submit a message or abort the in-flight request; Stop waiting still reaches the controller's abort with the game mounted
    requirement: GAME-06
    verification:
      - kind: integration
        ref: src/routes/Chat.test.tsx#game moves never submit a chat message or abort the in-flight request
        status: pass
      - kind: unit
        ref: src/components/chat/WaitingShell.test.tsx#triggers the abort handler on Stop waiting without game interference
        status: pass
    human_judgment: false
  - id: D3
    description: Responsive layout contracts — md drawer/desktop split with scrim and focus return, sticky composer, lg side-by-side lounge with fluid board, mobile-vs-desktop navigation behavior
    requirement: QUAL-04
    verification:
      - kind: unit
        ref: src/routes/Chat.responsive.test.tsx (9 tests)
        status: pass
    human_judgment: false
  - id: D4
    description: Real-viewport visual pass across 375px / tablet / desktop (drawer slide, scrim, collapse, focus return, game scaling)
    requirement: QUAL-04
    verification: []
    human_judgment: true
    rationale: "jsdom cannot compute real breakpoints; the human browser pass is owned by the end-of-phase human-verify gate (human_verify_mode: end-of-phase) and Phase 5 verification"
  - id: D5
    description: axe-core zero critical/serious violations on sidebar (open drawer over scrim), active waiting room with 2048 mounted, and win/game-over overlays
    requirement: GAME-01
    verification:
      - kind: unit
        ref: src/test/a11y.test.tsx#axe-core on chat history and waiting surfaces (4 tests)
        status: pass
    human_judgment: false

# Actuals (#2632)
actuals:
  tokens: 26000
  tasks: 3
  commits: 3

# Measured commits (#3968)
plan_head_before: 29c4cfd
plan_head_after: 5bb10b9

# Metrics
duration: 29min
completed: 2026-10-14
status: complete
---

# Phase 04 Plan 03: Waiting-Lounge 2048 Integration and Responsive Experience Summary

**Game2048 mounts inside WaitingShell's "Waiting lounge" strictly behind the active-waiting status gate (GAME-01), proven lifecycle-neutral at route level (GAME-06), plus responsive class-contract tests, an explicit reduced-motion guard, and four new axe-core gates covering the drawer, waiting room, and game overlays.**

## Performance

- **Duration:** 29 min
- **Started:** 2026-10-14T18:01:31Z
- **Completed:** 2026-10-14T18:30:23Z
- **Tasks:** 3 completed
- **Files modified:** 7 (1 created, 6 modified)

## Accomplishments

- `WaitingShell` gained an `isWaiting` prop; the route feeds it `status.kind === "waiting"`, so the 2048 board appears only during active waiting — never during the brief submitting phase, and it unmounts with the shell on success or stop-abort while the answer and prompt stay intact
- The lounge card is honest decoration: it carries explicit copy ("Playing never affects your request"), receives zero request state, and the Stop waiting button still wires straight to the controller's abort with the game mounted
- `Chat.responsive.test.tsx` (9 tests) pins the QUAL-04 contracts: centered container with the md sidebar/chat split and DOM-order h1 lead, sticky opaque composer, mobile-only hamburger with scrim (z-20 under the z-30 drawer) and desktop-only collapse toggle, Escape-close with focus return, mobile close-on-navigate vs desktop persistent panel (matchMedia-stubbed), lg side-by-side lounge with a fluid board, and the reduced-motion contract (globals.css override read from disk, transform-only 200ms ease-out drawer transition with `motion-reduce:transition-none`, `motion-reduce:animate-none` tiles)
- `a11y.test.tsx` now axe-audits the surfaces this phase ships: open history drawer over its scrim, the active waiting room with the 2048 board mounted, and the game's win and game-over overlays — zero critical/serious violations
- Full validation green: `tsc --noEmit` exit 0; `eslint .` 0 errors (3 pre-existing warnings in `convex/_generated`, untouched); `vitest run` 35 files / 448 tests passed (was 34/428 — +20 tests)

## Task Commits

Each task was committed atomically:

1. **Task 1: Integrate 2048 game into WaitingShell** - `feb2dd8` (feat)
2. **Task 2: Responsive polish & layout refinement** - `6b4be7b` (feat)
3. **Task 3: Comprehensive verification & accessibility audit** - `5bb10b9` (test)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/components/chat/WaitingShell.tsx` - Waiting lounge card embedding Game2048 behind the `isWaiting` gate; lg two-column grid, honest decoration copy
- `src/components/chat/WaitingShell.test.tsx` - 3 new tests: game gating on waiting, timer ticking through a game move, stop-abort without game interference
- `src/routes/Chat.tsx` - Passes `isWaiting={status.kind === "waiting"}` to WaitingShell
- `src/routes/Chat.test.tsx` - 4 new route tests: waiting-only mount with clean unmount on success/abort, zero request interference from game moves, axe on the waiting room
- `src/routes/Chat.responsive.test.tsx` - New 9-test responsive contract suite (layout classes, drawer toggle, viewport behavior, reduced motion)
- `src/components/chat/ChatSidebar.tsx` - Explicit `motion-reduce:transition-none` on the drawer slide
- `src/test/a11y.test.tsx` - 4 new axe gates (drawer, waiting room with 2048, win/game-over overlays) with hermetic ask/repository fakes

## Decisions Made

- **Status-kind gate, not a boolean off `busy`.** The board keys on `status.kind === "waiting"` specifically, honoring GAME-01's "actively waiting" wording; `busy` (which includes submitting) still controls the shell itself
- **Breakpoints stay on the 04-01 `md` (768px) boundary.** The plan sketched 640/1024 numbers; the shipped behavior (drawer below md, collapsible persistent panel from md, side-by-side lounge from lg) satisfies the same intent without re-keying 34 tested behaviors
- **Reduced-motion verified from disk.** `globals.css` is read with `node:fs` in the responsive test because vitest's default CSS handling mocks `?raw` imports to an empty string
- **QUAL-04 left unchecked in REQUIREMENTS.md.** Its automated evidence is delivered, but the real-viewport human browser pass (04-01 coverage D5, end-of-phase human-verify gate) is still open — recorded honestly rather than pre-marked

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `?raw` CSS imports resolve to an empty string under vitest**
- **Found during:** Task 2 (responsive test suite)
- **Issue:** `import globalsCss from "../styles/globals.css?raw"` returned `""` because vitest's default CSS handling mocks CSS module imports, so the reduced-motion override could not be asserted
- **Fix:** The test reads `src/styles/globals.css` from disk with `node:fs` (vitest cwd is the project root)
- **Files modified:** src/routes/Chat.responsive.test.tsx
- **Verification:** Reduced-motion contract test passes against the real stylesheet content
- **Committed in:** 6b4be7b

**2. [Plan detail - breakpoints] Drawer boundary kept at `md` (768px) instead of the plan's 640px mobile / 640–1024 tablet / >1024 desktop split**
- **Found during:** Task 2 (responsive refinement)
- **Issue:** The plan's breakpoint numbers diverge from the 04-01-locked and 34-test-verified `md` boundary; re-keying would churn tested drawer/collapse/matchMedia behavior with no functional difference for QUAL-04's intent
- **Fix:** Kept `md` as the drawer/panel boundary and `lg` for the side-by-side waiting lounge, satisfying drawer-on-mobile, collapsible-compact-sidebar-on-tablet, two-column-on-desktop; documented as this plan's breakpoint decision
- **Files modified:** none beyond Task 2's refinements
- **Verification:** Chat.responsive.test.tsx suite passes; no 04-01 tests regressed
- **Committed in:** 6b4be7b

---

**Total deviations:** 2 (1 blocking test-infra fix, 1 documented plan-detail divergence)
**Impact on plan:** No scope creep. The breakpoint divergence preserves the plan's responsive intent while protecting tested behavior; the `?raw` fix was required to verify a plan-mandated contract.

## Issues Encountered

- One drafted route test guessed the aborted-recovery copy ("Stopped while we were planning."); the real copy is "Waiting stopped." per `Chat.lifecycle.test.tsx` — corrected before the Task 1 commit
- `eslint . --max-warnings 0` exits 1 due to 3 pre-existing warnings in Convex-generated files (`convex/_generated/*`), untouched by this plan and previously logged to deferred items; scoped lint of all 7 plan files is clean (exit 0)

## User Setup Required

None - no external service configuration required.

## Known Stubs

None — no placeholder text, hardcoded empty values, or unwired data sources in the files created or modified.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes. The game state is in-memory only (never persisted to Convex, cookies, or localStorage beyond 04-02's numeric best score).

## Verification Results

Recorded from the final on-disk state (task commits `feb2dd8`, `6b4be7b`, `5bb10b9`):

- `node_modules/.bin/tsc.CMD --noEmit` → exit 0, no output
- `node_modules/.bin/eslint.CMD . --max-warnings 0` → 0 errors; 3 pre-existing warnings in `convex/_generated/*` (out of scope); scoped run over the 7 plan files → exit 0
- `node_modules/.bin/vitest.CMD run` (full suite) → Test Files 35 passed (35), Tests 448 passed (448)
- Plan-scoped runs: `WaitingShell.test.tsx` 14 passed; `Chat.test.tsx` 30 passed; `Chat.responsive.test.tsx` 9 passed; `a11y.test.tsx` 18 passed
- Static wiring checks: `WaitingShell.tsx` imports and renders `Game2048` behind `isWaiting`; `Chat.tsx` passes `isWaiting={status.kind === "waiting"}`; key_links pattern `Game2048|isWaiting` and `WaitingShell|status === 'waiting'` both verified
- Honesty checks: lounge copy states the game never affects the request; no progress/meter element or percentage text anywhere in the waiting shell (existing test still green); game receives no request state and no chat callbacks

## Next Phase Readiness

- Phase 04's automated scope is complete: sidebar CRUD (04-01), 2048 engine/UI (04-02), waiting-room integration + responsive/accessibility verification (04-03)
- Open human gates for the phase close: the real-viewport browser pass (drawer slide/scrim/collapse/focus return at 375px, tablet, desktop) under `human_verify_mode: end-of-phase`, and the pre-existing Phase 1 human items still listed in STATE.md
- GAME-01 and GAME-06 are fully test-verified and marked complete in REQUIREMENTS.md; QUAL-04 stays pending until the human viewport pass is recorded

## Self-Check: PASSED

- Created file exists: `src/routes/Chat.responsive.test.tsx` — present on disk and tracked
- Modified files exist: `src/components/chat/WaitingShell.tsx`, `src/components/chat/WaitingShell.test.tsx`, `src/routes/Chat.tsx`, `src/routes/Chat.test.tsx`, `src/components/chat/ChatSidebar.tsx`, `src/test/a11y.test.tsx` — all present and tracked
- Commits verified in git log: `feb2dd8`, `6b4be7b`, `5bb10b9`; `git rev-list --count 29c4cfd..HEAD` = 3, matching plan_head_before
- No stub patterns (`TODO`, placeholder text, empty-data rendering) introduced in any plan file
- No unexpected file deletions in any task commit (deletion check empty for all three)

---
*Phase: 04-chat-management-2048-and-responsive-experience*
*Completed: 2026-10-14*
