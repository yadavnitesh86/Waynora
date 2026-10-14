---
phase: 04-chat-management-2048-and-responsive-experience
plan: 04-01
subsystem: ui
tags: [react, typescript, cookie-persistence, conversation-management, accessibility, responsive-design]

# Dependency graph
requires:
  - phase: 02-cookie-persistence-and-chat-domain
    provides: readConversations/writeConversations repository, Conversation schema, newest-first retention order (D-20)
  - phase: 03-real-chat-and-long-request-lifecycle
    provides: useAskController keyed on conversationId, submit/stop/retry lifecycle, WaitingShell
provides:
  - useConversations hook owning the conversation list, active selection, cookie persistence, and auto-titling
  - ChatSidebar + ConversationItem history UI (rename, delete confirmation, mobile drawer, desktop collapse)
  - Multi-conversation chat route with switch-safe request lifecycle
affects: [04-02, 04-03, QUAL-04, WaitingShell game integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Route-level conversation store hook whose mutations compose synchronously through a ref mirror
    - Deferred first-submit dispatch so a controller re-key cannot abort the request it owns
    - Reload-faithful store-backed repository fake for persistence tests

key-files:
  created:
    - src/hooks/useConversations.ts
    - src/hooks/useConversations.test.ts
    - src/components/chat/ConversationItem.tsx
    - src/components/chat/ConversationItem.test.tsx
    - src/components/chat/ChatSidebar.tsx
    - src/components/chat/ChatSidebar.test.tsx
  modified:
    - src/routes/Chat.tsx
    - src/routes/Chat.test.tsx

key-decisions:
  - "Active conversation id is local React state with fallback to the newest conversation (an explicit 04-CONTEXT option), not a ?c= query param — the route carries no router dependency and its tests render bare"
  - "A rename touches the conversation (updatedAt advances) so retention treats an edited chat as most recently used; blank renames are rejected at the input and again in the hook"
  - "The ask controller stays keyed on conversationId; the first submit of an empty history defers its dispatch one commit so the fresh controller owns the request instead of the re-init aborting it"
  - "The terminal-status guard is keyed on (conversationId, requestId) because a fresh controller restarts requestId at 1 after a switch"
  - "The sidebar empty state uses paragraphs rather than the EmptyState h3 to avoid adding heading-order findings ahead of the route h1"
  - "Timestamps render in UTC with an explicit timeZone, matching the stored toISOString values, so the list is identical on every machine"

patterns-established:
  - "Conversation mutations compose synchronously via a ref mirror, so create + first-message in one event handler both see each other"
  - "The sidebar owns rename and delete-confirm state, so switching selection cancels a stranded edit"
  - "Escape never closes the drawer while an inline edit owns the keyboard"

requirements-completed: [PERSIST-06, PERSIST-07, PERSIST-08]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: useConversations hook — load/create/select/rename/delete/sync with cookie persistence, newest-first order, auto-title derivation, and retention eviction reporting
    requirement: PERSIST-06
    verification:
      - kind: unit
        ref: src/hooks/useConversations.test.ts (21 tests)
        status: pass
    human_judgment: false
  - id: D2
    description: ChatSidebar + ConversationItem history UI — list, active highlight, inline rename with validation, delete confirmation, mobile drawer, desktop collapse
    requirement: PERSIST-06
    verification:
      - kind: unit
        ref: src/components/chat/ChatSidebar.test.tsx + ConversationItem.test.tsx (34 tests, incl. 2 axe gates)
        status: pass
    human_judgment: false
  - id: D3
    description: Auto-title derived from the first user message, exactly once, never overwriting an explicit rename
    requirement: PERSIST-07
    verification:
      - kind: unit
        ref: src/hooks/useConversations.test.ts#derives the auto-title from the first user message and moves the conversation to the top
        status: pass
    human_judgment: false
  - id: D4
    description: Route integration — switching updates the thread, create resets to the empty composer, rename/delete persist across a simulated reload, switching aborts the in-flight request
    requirement: PERSIST-08
    verification:
      - kind: integration
        ref: src/routes/Chat.test.tsx#Chat route (multi-conversation management) (7 tests)
        status: pass
    human_judgment: false
  - id: D5
    description: Responsive drawer and desktop collapse behavior, scrim, focus return, real-viewport layout
    requirement: QUAL-04
    verification: []
    human_judgment: true
    rationale: "jsdom cannot exercise real viewport breakpoints, the drawer slide, the scrim, or focus return; a human browser pass across desktop/tablet/mobile is required (04-03 owns the full responsive gate)"

# Actuals (#2632) — same scale as the plan estimate (chars/4 over the realized diff)
actuals:
  tokens: 22838
  tasks: 3
  commits: 3

# Measured commits (#3968)
plan_head_before: 39f71ccde65f40b18b1695556884638d23b3fb39
plan_head_after: 0edfc1e7f66bc79df9413fb8d482b42616eccca5

# Metrics
duration: 62min
completed: 2026-10-14
status: complete
---

# Phase 04 Plan 01: Multi-Conversation Chat Management Summary

**Conversation history sidebar with create/switch/rename/delete persisted through the cookie repository, auto-titling from the first user message, and a responsive drawer/collapse layout wired into the chat route without disturbing the Phase 3 request lifecycle**

## Performance

- **Duration:** 62 min
- **Started:** 2026-10-14T05:38Z
- **Completed:** 2026-10-14T06:45Z
- **Tasks:** 3 completed
- **Files modified:** 8 (6 created, 2 modified)

## Accomplishments

- `useConversations` loads the cookie snapshot once on mount (sorted newest first, newest activated, empty snapshot never written), and its create/select/rename/delete/sync mutators persist the whole list through `readConversations`/`writeConversations` and compose synchronously inside one event handler
- `ChatSidebar` + `ConversationItem` deliver the history UI: chat-history nav landmark, New chat primary action, scrollable saved-chats list with active `aria-current` and UTC date/time, inline rename (Enter saves, Escape cancels, blank rejected with `role="alert"`), inline delete confirmation with focus moved to the destructive action, mobile overlay drawer (scrim, Escape, focus handling) and a desktop collapse toggle with `aria-expanded`
- `Chat.tsx` renders the active conversation beside the sidebar in a responsive split (main column first in DOM order so the route h1 leads the outline), with switching, creating, and deleting routed through the hook and the ask controller still keyed on the conversation id so a switch aborts any in-flight request and drops its late result (WAIT-06)
- 81 new/updated route-and-component tests plus 21 hook tests; the full 380-test suite (32 files) passes, with all 19 pre-existing Chat tests unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: useConversations multi-conversation hook** - `ca4f510` (feat)
2. **Task 2: ConversationItem + ChatSidebar history UI** - `7df6045` (feat)
3. **Task 3: Wire multi-conversation management into the route** - `0edfc1e` (feat)

**Plan metadata:** final docs commit (below)

## Files Created/Modified

- `src/hooks/useConversations.ts` - Conversation list/selection/persistence/auto-title owner for the route
- `src/hooks/useConversations.test.ts` - 21 unit tests: CRUD, ordering, validation, eviction reporting
- `src/components/chat/ConversationItem.tsx` - One conversation row: browse, inline rename, delete confirmation
- `src/components/chat/ConversationItem.test.tsx` - 18 tests incl. blank-rename validation, Escape, focus
- `src/components/chat/ChatSidebar.tsx` - History landmark, New chat action, list, empty state, drawer/collapse
- `src/components/chat/ChatSidebar.test.tsx` - 16 tests incl. 2 axe gates and stranded-edit cancellation
- `src/routes/Chat.tsx` - Multi-conversation route: sidebar split, switch-safe lifecycle, deferred first submit
- `src/routes/Chat.test.tsx` - 7 new multi-conversation tests incl. reload simulation; 19 existing tests kept

## Decisions Made

- **Active selection is local state with newest fallback**, not a `?c=<id>` query param — an explicit alternative in 04-CONTEXT, and the route has no router dependency to build on
- **Renaming advances `updatedAt`**, so retention (D-20) treats an edited conversation as most recently used; the sidebar re-sorts it to the top
- **The ask controller keeps its conversationId key**; instead of weakening WAIT-06 disposal, the first submit of an empty history defers its dispatch one commit so the fresh controller owns the request
- **The applied-terminal-status guard is keyed on (conversationId, requestId)** because a fresh controller restarts requestId at 1 after a switch — a requestId-only guard would swallow the next conversation's first result
- **UTC timestamp rendering** with an explicit `timeZone`, matching the stored `toISOString` values, so list times are machine-independent
- **Paragraph-only sidebar empty state** (no h3) to avoid adding heading-order findings ahead of the route h1, following the precedent StorageNotice set

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] `evictedIds` added to the hook API**
- **Found during:** Task 3 (route integration)
- **Issue:** With persistence delegated to the hook, the route lost the write result it used to detect retention eviction — the PERSIST-05 StorageNotice would have gone permanently silent
- **Fix:** The hook reports the ids evicted by the most recent write; the route surfaces the notice when the active conversation is among them
- **Files modified:** src/hooks/useConversations.ts, src/routes/Chat.tsx
- **Verification:** "shows StorageNotice when writeConversations evicts the active conversation" passes unchanged; `useConversations.test.ts` eviction test passes
- **Committed in:** ca4f510 (hook), 0edfc1e (route)

**2. [Rule 1 - Bug] First submit of an empty history defers its dispatch**
- **Found during:** Task 3 (route integration)
- **Issue:** The ask controller is keyed on conversationId. The submit that creates the first conversation re-keys the controller in the same tick; dispatching against the old controller had the request aborted by that very re-init — the user message would hang in a permanent waiting state
- **Fix:** `pendingSubmitRef` holds the request until the commit where the new conversation is active, then dispatches on the fresh controller; a second Enter before dispatch is swallowed by the same guard
- **Files modified:** src/routes/Chat.tsx, src/routes/Chat.test.tsx
- **Verification:** "creates its first conversation on the first submit of an empty history" passes (ask called exactly once, answer lands, title derived); "includes thread_id only when…" and follow-up tests still pass
- **Committed in:** 0edfc1e

**3. [Rule 1 - Bug] Terminal-status guard re-keyed to (conversationId, requestId)**
- **Found during:** Task 3 (route integration)
- **Issue:** Fresh controllers restart requestId at 1. A requestId-only guard blocked the second conversation's first result after a switch (id 1 already applied for the first conversation), so answers would never render
- **Fix:** The guard records both the conversation id and the request id
- **Files modified:** src/routes/Chat.tsx
- **Verification:** "switches conversations and updates the rendered thread" plus the answer/retry suites pass; double-application is still prevented
- **Committed in:** 0edfc1e

**4. [Rule 3 - Blocking] Reload-faithful repository fake with per-test re-applied implementations**
- **Found during:** Task 3 (test updates)
- **Issue:** The per-test `mockWriteConversations` override (eviction case) outlived its test because `clearAllMocks` does not restore implementations, so later tests wrote nothing to the fake store and the reload assertions read stale data
- **Fix:** A store-backed read/write pair re-applied in `beforeEach`, plus an `afterEach` restoring spies
- **Files modified:** src/routes/Chat.test.tsx
- **Verification:** Reload tests fail against the old setup and pass with the fix; full suite green twice on the final state
- **Committed in:** 0edfc1e

---

**Total deviations:** 4 auto-fixed (2 missing critical, 2 bug/blocking fixes surfaced by the integration)
**Impact on plan:** All four were required for correct multi-conversation operation of the new integration; no scope creep — no new features beyond the plan's task list.

## Issues Encountered

- `npx vitest` hung in this environment; the local `node_modules/.bin/vitest.CMD` binary runs the suite normally (used throughout)
- One full-suite run reported a single failure in `src/app.composition.test.tsx` under heavy load; the test passes in isolation and the immediate full-suite re-run on the same code was green (32 files / 380 tests) — recorded as load flakiness on this OneDrive-synced filesystem, not a code defect
- `eslint . --max-warnings 0` reports 3 pre-existing warnings in Convex-generated files (`frontend/convex/_generated/*`) untouched by this plan; scoped lint of the plan's 8 files is clean. Logged to `deferred-items.md` as out of scope

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 04-02 (2048 engine) and 04-03 (device-adaptive controls) build directly on this route: `WaitingShell` remains strictly gated on `busy`, so the game can be inserted into the waiting phase without touching conversation state
- The sidebar owns its own drawer state; the game's keyboard/touch isolation (GAME-06) must attach inside `WaitingShell` so arrow keys never reach the composer
- QUAL-04's full responsive gate (real viewport passes for drawer, collapse, and focus return) is deliberately deferred to human verification — jsdom cannot prove it

## Verification Results

Recorded from the final on-disk state (task commits `ca4f510`, `7df6045`, `0edfc1e`):

- `node_modules/.bin/tsc.CMD --noEmit` → exit 0, no output
- `node_modules/.bin/eslint.CMD . --max-warnings 0` → 0 errors; 3 warnings, all pre-existing in Convex-generated files outside this plan's diff (scoped run over the plan's 8 files: exit 0)
- `node_modules/.bin/vitest.CMD run` (full suite) → Test Files 32 passed (32), Tests 380 passed (380), 132.75s
- Plan's four test files → 4 passed (4), 81 tests passed (81), 12.42s
- Static wiring checks: `useConversations.ts` imports and calls `readConversations`/`writeConversations`; `Chat.tsx` renders `ChatSidebar` and keeps `WaitingShell` behind `busy ?`

## Self-Check: PASSED

- Created files exist: `src/hooks/useConversations.ts`, `src/hooks/useConversations.test.ts`, `src/components/chat/ConversationItem.tsx`, `src/components/chat/ConversationItem.test.tsx`, `src/components/chat/ChatSidebar.tsx`, `src/components/chat/ChatSidebar.test.tsx` — all present on disk and tracked
- Modified files exist: `src/routes/Chat.tsx`, `src/routes/Chat.test.tsx` — present and tracked
- Commits verified ancestors of HEAD: `ca4f510`, `7df6045`, `0edfc1e` — `git rev-list --count 39f71cc..HEAD` = 3, matching the ledger-recorded plan base
- No stub patterns (`TODO`, placeholder text, empty-data rendering) introduced in any plan file
- No unexpected file deletions in any task commit (`git show --diff-filter=D` empty for all three)

---
*Phase: 04-chat-management-2048-and-responsive-experience*
*Completed: 2026-10-14*
