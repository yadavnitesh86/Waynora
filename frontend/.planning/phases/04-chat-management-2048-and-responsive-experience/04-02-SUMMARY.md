---
phase: 04-chat-management-2048-and-responsive-experience
plan: 02
subsystem: ui
tags: [game-2048, deterministic-engine, react, typescript, accessibility, keyboard-controls, touch-gestures, vitest]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: locked design tokens, UI primitives (Button), axe-core harness, validation setup
  - phase: 03-real-chat-and-long-request-lifecycle
    provides: WaitingShell with the reserved game slot this component will mount into
provides:
  - "Pure deterministic 2048 engine (initGame/moveGame/spawnRandomTile/canMove/hasWon) with seeded-RNG support"
  - "Accessible ARIA-grid GameBoard with Tile, win/game-over role=status overlays, and restart controls"
  - "Game2048 controller: keyboard (arrows/WASD), touch swipes, mobile d-pad, localStorage best score, input isolation"
affects: [04-waiting-experience-integration, 04-responsive-polish, phase-05-editorial-identity]

# Tech tracking
tech-stack:
  added: []
  patterns: ["pure-engine-under-thin-react-reducer", "focus-scoped-game-keyboard-with-typing-guard", "test-seams-rng-and-initial-state"]

key-files:
  created:
    - src/lib/game/2048/engine.ts
    - src/lib/game/2048/types.ts
    - src/components/game/Game2048.tsx
    - src/components/game/GameBoard.tsx
    - src/components/game/Tile.tsx
  modified:
    - tailwind.config.ts
    - src/test/setup.ts
    - src/app.composition.test.tsx

key-decisions:
  - "Engine keeps a module-level monotonic tile-id counter: ids only, so values/positions/scores/outcomes stay pure functions of (state, direction, rng)"
  - "Game2048 exposes rng and initialState props as explicit test seams so win/game-over scenarios are testable without playing hundreds of moves"
  - "Keyboard play is doubly isolated: handler attaches to the focused board container AND ignores keys while any input/textarea/select is active (GAME-06)"
  - "Tile color ramp reuses only locked palette tokens; tokens.css untouched"
  - "Best score persists to localStorage key waynora:2048:best with try/catch fallback to session-only"

patterns-established:
  - "Domain game logic lives in src/lib/game/<name>/ as pure functions with node-environment tests"
  - "Component test seams via optional injectable props (rng, initialState) rather than module mocking"

requirements-completed: [GAME-02, GAME-03, GAME-04, GAME-05, GAME-06, GAME-07]

# Metrics
duration: 86min
completed: 2026-10-14
---

# Phase 4 Plan 02: 2048 Engine and Accessible Game UI Summary

**Pure deterministic 2048 engine (seeded RNG, standard scoring, win/game-over detection) plus an accessible ARIA-grid React board with keyboard/WASD, touch-swipe, and mobile d-pad input, strict typing-input isolation, and localStorage best-score tracking.**

## Performance

- **Duration:** 86 min
- **Started:** 2026-10-14T10:45:19Z
- **Completed:** 2026-10-14T12:11:20Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Deterministic 4x4 engine with slide/merge for all four directions, standard 2048 scoring, single-merge-per-move rule, no-op detection, sticky win flag, and injectable RNG for seeded tests (GAME-02, GAME-05).
- Accessible board: role=grid with 16 labelled gridcells, focusable container, role=status win overlay ("Keep Going" / "New Game") and game-over overlay ("Try Again") (GAME-03, GAME-07).
- Input isolation: arrows/WASD act only on the focused board, are ignored while any input/textarea/select has focus, and preventDefault only fires for handled game keys; touch swipes plus an sm:hidden 56px direction pad; board uses touch-action: none (GAME-04, GAME-06).
- Current/best score with localStorage persistence that degrades gracefully when storage is unavailable.
- 48 new tests (32 engine, 16 component incl. two axe-core passes); full suite green: 34 files / 428 tests.

## Task Commits

Each task was committed atomically:

1. **Task 1: Pure deterministic 2048 game engine** - `86343a1` (feat)
2. **Task 2: Accessible Board, Tiles, and Game Overlays** - `375c80c` (feat)
3. **Task 3: Interactive controller and input isolation** - `5859897` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified

- `src/lib/game/2048/types.ts` - Direction, Tile, Grid, GameState, Rng types.
- `src/lib/game/2048/engine.ts` - Pure engine: initGame, moveGame, spawnRandomTile, moveGrid, moveLeft/Right/Up/Down, canMove, isGameOver, hasWon.
- `src/lib/game/2048/engine.test.ts` - 32 node-environment unit tests (slides, merges, cascades, scoring, win, game over, determinism).
- `src/components/game/Tile.tsx` - Value-driven color ramp from locked tokens; one-shot tile-in / tile-merge scale pops (200ms ease-out, motion-reduce guarded).
- `src/components/game/GameBoard.tsx` - ARIA grid, touch-action: none, role=status win/game-over overlays with restart controls.
- `src/components/game/Game2048.tsx` - Controller: reducer over the pure engine, keyboard/touch/d-pad handlers, score board, localStorage best score, polite score live region.
- `src/components/game/Game2048.test.tsx` - 16 interaction/ARIA/axe/persistence tests.
- `tailwind.config.ts` - Added tile-in and tile-merge keyframes/animations (transform/opacity only).
- `src/test/setup.ts` - In-memory Storage shim when jsdom lacks localStorage (guarded for node-env suites).
- `src/app.composition.test.tsx` - findBy timeout raised 1s → 10s (load tolerance; see deviations).

## Decisions Made

- **Tile-id counter in the engine.** A module-level monotonic counter generates tile ids; it affects ids only, never values, positions, scores, or outcomes, so game logic remains deterministic and testable (tests never assert on ids).
- **Test seams as props.** `Game2048` accepts optional `rng` and `initialState` props. This keeps component tests deterministic and makes win/game-over overlay states reachable without simulating hundreds of moves; no module mocking needed.
- **Double keyboard isolation.** The keydown handler lives on the board container (so it fires only while the board is focused) and additionally ignores events while `document.activeElement` is an input/textarea/select — defence in depth for GAME-06.
- **Palette-only tile colors.** Tile colors reuse existing locked tokens (surface/accent-soft/line/focus/danger/accent/ink); `tokens.css` was not modified.
- **Best score storage.** `localStorage["waynora:2048:best"]`, wrapped in try/catch — privacy modes or blocked storage degrade to session-only scoring rather than crashing. Game state is never persisted to Convex or cookies (per project constraints; the plan only requires best-score persistence).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] jsdom/vitest exposes no `window.localStorage`**
- **Found during:** Task 3 (best-score persistence tests)
- **Issue:** `window.localStorage` is literally `undefined` in this vitest+jsdom setup, so persistence could not be tested (and any test touching storage crashed).
- **Fix:** Added a minimal in-memory `Storage`-conformant shim to `src/test/setup.ts`, installed only when `window` exists and `localStorage` is missing.
- **Files modified:** src/test/setup.ts
- **Verification:** persistence + storage-failure tests pass; full suite green.
- **Committed in:** `5859897`

**2. [Rule 3 - Blocking] Composition regression test flaked under added suite load**
- **Found during:** Task 3 (full-suite verification)
- **Issue:** `src/app.composition.test.tsx` awaited landing copy with the default 1000ms findBy timeout. With this plan's added jsdom-heavy suites it failed consistently under full-suite parallelism (a pre-existing load sensitivity documented in STATE.md, triggered deterministically by the new tests).
- **Fix:** Raised the await timeout to 10s with an explanatory comment; regression semantics unchanged.
- **Files modified:** src/app.composition.test.tsx
- **Verification:** full suite 34 files / 428 tests pass repeatedly after the change.
- **Committed in:** `5859897`

---

**Total deviations:** 2 auto-fixed (2 blocking-infrastructure)
**Impact on plan:** Both were test-environment infrastructure fixes required to verify plan-mandated behavior (persistence, whole-suite green). No product scope changes.

## Issues Encountered

- Three wrong test expectations during authoring (engine `moveDown` stacking order, a direction-helper fixture that had no vertical pair, and component RIGHT-move expectations that forgot two tiles merge at the wall). The engine was correct in all three cases; the assertions were corrected before the task commits.
- The first `src/test/setup.ts` shim referenced `window` unconditionally, breaking five node-environment suites; fixed with a `typeof window !== "undefined"` guard before committing.

## Verification

Configured validation checks (run exactly as configured):

- `npm run typecheck` (tsc --noEmit) → exit 0, no errors.
- `npm run lint` (eslint .) → 0 errors; 3 pre-existing warnings in `convex/_generated/*.d.ts` (unused eslint-disable directives — unrelated to this plan, untouched).
- `npm test` (vitest run) → `Test Files 34 passed (34)`, `Tests 428 passed (428)`.
- Plan-scoped: `vitest run src/lib/game/2048/engine.test.ts` → 32 passed; `vitest run src/components/game` → 16 passed (includes axe-core with no critical/serious violations).

Acceptance spot-checks from the plan frontmatter:

- Engine exports `initGame`, `moveGame`, `spawnRandomTile`, `Direction`, `GameState` — verified in `engine.ts` (plus `moveLeft/moveRight/moveUp/moveDown`, `canMove`, `isGameOver`, `hasWon`).
- `Game2048.tsx` imports `moveGame|initGame` from the engine (key_links pattern verified).
- GAME-06 isolation verified by tests: arrow keys ignored while a textarea is focused; non-game keys not consumed (`Enter` default preserved); `touch-action: none` present on the board.

## Known Stubs

None — no placeholder text, hardcoded empty values, or unwired data sources in the files created or modified.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes. The only new persistence is a numeric best score in first-party localStorage (explicitly required by GAME-02; no user content, tokens, or conversation data).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `Game2048` is ready to mount into `WaitingShell`'s reserved game slot (04-03/next plan): it is a self-contained `<section>` with no router or chat dependencies and never touches the ask controller.
- Remaining Phase 04 scope: waiting-shell integration (GAME-01 — game only while a request is actively waiting) and responsive/QUAL-04 polish verification.

## Self-Check: PASSED

- Key files exist on disk: engine.ts, types.ts, Game2048.tsx, GameBoard.tsx, Tile.tsx, Game2048.test.tsx (all `Test-Path` → True).
- Commits found in git log: `86343a1`, `375c80c`, `5859897`.
- Acceptance spot-checks verified (engine exports, key_links pattern, GAME-06 isolation tests).
- Plan-level verification re-run: typecheck 0 errors, eslint 0 errors, vitest 428/428 passed.

---
*Phase: 04-chat-management-2048-and-responsive-experience*
*Completed: 2026-10-14*
