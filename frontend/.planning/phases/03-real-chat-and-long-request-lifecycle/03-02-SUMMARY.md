---
phase: 03-real-chat-and-long-request-lifecycle
plan: 02
subsystem: chat
tags: [chat-surface, transcript, markdown, recovery, persistence, tdd, a11y]

# Dependency graph
requires:
  - phase: 02-cookie-persistence-and-chat-domain
    provides: conversation domain (markInFlight, markError, addMessage, deriveTitle, updateMessage), cookie repository (readConversations/writeConversations with evicted ids)
  - phase: 03-real-chat-and-long-request-lifecycle
    provides: RequestController state machine, RequestFailureKind/RecoveryKind + RECOVERY_COPY, useAskController adapter
  - phase: 01-foundation-contracts-and-auth
    provides: UI primitives (Button, TextField, ErrorText, Spinner, EmptyState, PageHeader), safe Markdown, axe harness, useDocumentTitle
provides:
  - The chat transcript: ol[aria-label="Conversation"] with You/Waynora captions, the one raised user card, flat assistant prose, and the in-flight footer
  - RecoveryBlock: one component, seven kinds, verbatim RECOVERY_COPY, deliberate Try again
  - The real Chat route: optimistic persistence, thread_id storage and reuse, seven recovery states, reload-recovery without auto-replay
  - TextArea primitive (the one authorized 03-02 primitive addition)
affects: [03-03 waiting shell and elapsed clock, 03-02 retry UI, any future transcript surface]

actuals:
  tokens: 48000
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Only the network boundary is faked in route tests: the real useAskController and request controller run underneath, so success/failure/retry assertions exercise the actual lifecycle instead of an echo of a mock"
    - "Terminal status application keyed on requestId in a ref, so one transition is applied exactly once regardless of React effect re-runs"
    - "A conversation ref mirrors state so async handlers read the freshest value without re-subscribing"
    - "route-level queries scoped with within(list) when the route h1 mirrors message text"

key-files:
  created:
    - src/components/ui/TextArea.tsx
    - src/components/ui/TextArea.test.tsx
    - src/components/chat/ChatComposer.tsx
    - src/components/chat/ChatComposer.test.tsx
    - src/components/chat/ChatThread.tsx
    - src/components/chat/ChatThread.test.tsx
    - src/components/chat/UserMessage.tsx
    - src/components/chat/AssistantMessage.tsx
    - src/components/chat/RecoveryBlock.tsx
    - src/components/chat/RecoveryBlock.test.tsx
    - src/components/chat/StorageNotice.tsx
    - src/routes/Chat.tsx
    - src/routes/Chat.test.tsx
  modified:
    - src/components/ui/index.ts (barrel gained TextArea)
    - src/components/ui/primitives.test.tsx (8 -> 9 primitives)
    - src/routes/index.tsx (ChatPlaceholder -> Chat)
    - src/test/a11y.test.tsx (chat route case follows the swap)
    - src/lib/chat/requestController.test.ts (03-01 validation debt)
  deleted:
    - src/routes/ChatPlaceholder.tsx

key-decisions:
  - "markInFlight preserves an existing metadata.error, so retry clears it explicitly via updateMessage({ metadata: { inFlight: true } }) — otherwise a retried message would keep rendering the previous failure block while a new request is live"
  - "StorageNotice's heading is a caption-weight <p>, not an <h2>/<h3>: the Phase 3 type table puts it at 13px, and a heading element between the route <h1> and the message captions has no real place in the outline"
  - "The route h1 mirrors the derived title, which equals the first user message; route tests therefore scope message lookups with within(list)"
  - "title derivation runs only when the conversation had zero user messages, so a second turn can never retitle the conversation (D-26)"

patterns-established:
  - "TDD with type-correct behavior-wrong RED scaffolds (carried from 03-01/02) so tests fail on their planned assertions, never on module resolution"
  - "Faking only the boundary under test (the network) rather than the hook the component consumes, so the test proves the wiring and not the mock"

requirements-completed: [CHAT-01, CHAT-02, CHAT-03, CHAT-05, CHAT-06, CHAT-07, CHAT-08, CHAT-09, WAIT-05, PERSIST-05, PERSIST-09, PERSIST-10]

# Coverage metadata (#1602)
coverage:
  - id: D1
    description: Composer copy and interaction — C-05/C-06/C-07/C-09 exact strings, Enter vs Shift+Enter, busy no-op, disabled-on-blank, C-08 role=status, aria-busy, focus retention
    requirement: CHAT-02
    verification:
      - kind: unit
        ref: src/components/chat/ChatComposer.test.tsx
        status: pass
    human_judgment: false
  - id: D2
    description: First submit slice — empty state copy, immediate user message, optimistic persistence with markInFlight, draft clear + focus retention, StorageNotice on eviction, thread_id present only when known
    requirement: CHAT-03
    verification:
      - kind: unit
        ref: src/routes/Chat.test.tsx
        status: pass
    human_judgment: false
  - id: D3
    description: Transcript semantics and message anatomy — ol[aria-label=Conversation], li in DOM order, no live region, You/Waynora captions, exactly one raised card, in-flight footer with C-15, reload-recovery, unknown-error-key fallback
    requirement: CHAT-07
    verification:
      - kind: unit
        ref: src/components/chat/ChatThread.test.tsx
        status: pass
    human_judgment: false
  - id: D4
    description: Recovery blocks — all seven kinds with verbatim RECOVERY_COPY headline/body, Try again firing onRetry once, aria-hidden glyph, no raw diagnostics
    requirement: WAIT-05
    verification:
      - kind: unit
        ref: src/components/chat/RecoveryBlock.test.tsx
        status: pass
    human_judgment: false
  - id: D5
    description: Answer and failure wiring — succeeded appends through Markdown and stores thread_id, follow-up reuses it, failed stores the kind key and preserves the prompt, retry re-sends the identical question, persisted in-flight renders reload-recovery with no replay
    requirement: CHAT-05
    verification:
      - kind: unit
        ref: src/routes/Chat.test.tsx
        status: pass
    human_judgment: false
  - id: D6
    description: Safe rendering of untrusted answers — raw script tag, javascript: URL, and onerror attribute all render inert; no script element and no javascript: href in the DOM
    requirement: CHAT-06
    verification:
      - kind: unit
        ref: src/routes/Chat.test.tsx
        status: pass
    human_judgment: false
  - id: D7
    description: Route integration and metadata — real Chat at /chat behind ProtectedRoute + Suspense, placeholder deleted, document title and meta description follow the conversation, PageHeader h1 shows the title, app.composition regression green
    requirement: CHAT-01
    verification:
      - kind: unit
        ref: src/test/a11y.test.tsx, src/app.composition.test.tsx
        status: pass
    human_judgment: false
  - id: D8
    description: Accessibility gate — axe core over the empty, failure, and busy composer states with zero critical/serious violations
    requirement: CHAT-07
    verification:
      - kind: a11y
        ref: src/routes/Chat.test.tsx
        status: pass
    human_judgment: false
  - id: D9
    description: Storage overflow never blocks a request — eviction surfaces StorageNotice and the ask still fires
    requirement: PERSIST-05
    verification:
      - kind: unit
        ref: src/routes/Chat.test.tsx
        status: pass
    human_judgment: false

# Metrics
duration: 95min
completed: 2026-10-13
status: complete
plan_head_before: c734266a8552236c036a28879d2fc3065b8101fc
plan_head_after: dda0f53
---

# Phase 03 Plan 02: Chat Surface Summary

**The real protected chat surface — composer, transcript, safe Markdown answers, seven recovery states, optimistic cookie persistence, thread continuation, and the placeholder's removal. Fully green: 282 tests, 24 files, tsc clean, eslint clean.**

## Performance

- **Duration:** 95 min wall clock (Task 1 completed in a prior session, then validated and committed here; Tasks 2–3 executed and closed out in this session)
- **Started:** 2026-10-13 (Task 1 groundwork from the preceding session)
- **Completed:** 2026-10-13
- **Tasks:** 3
- **Files modified:** 13 created, 5 modified, 1 deleted

## Accomplishments

- **TextArea primitive** — the one authorized addition: labelled multi-line input mirroring TextField's `useId`/`aria-describedby`/`aria-invalid` wiring exactly, auto-growing from 88px to 192px then scrolling internally (D-34). Joins the barrel as the ninth primitive.
- **ChatComposer** — owns its draft state, exact C-05/C-06/C-07/C-09 copy, Enter submits / Shift+Enter newlines / Enter-while-busy no-op, button disabled on blank or busy, C-08 `role="status"` only while busy, form `aria-busy`, draft cleared and focus retained after submit.
- **Transcript and message anatomy** — `ol[aria-label="Conversation"]` memoized against per-second props, `You`/`Waynora` captions, the one raised user card, flat assistant prose behind a hairline, the C-15 in-flight footer with a 16px Spinner. The list carries no live region (double-announcement rule).
- **RecoveryBlock** — one component, seven kinds, copy verbatim from `RECOVERY_COPY`, `role="alert"` headline via `ErrorText`, `aria-hidden` warning glyph so colour is never the sole signal, deliberate `Try again` secondary action.
- **Route wiring** — optimistic submit with `markInFlight`, succeeded appends through the **unchanged** Markdown component and stores the returned `thread_id`, failed stores the kind key with prompt and history untouched, retry re-sends the identical question, and a persisted in-flight message renders reload-recovery without ever auto-replaying.
- **Route integration** — the real Chat is live at `/chat` behind the preserved `ProtectedRoute` + lazy `Suspense`, `ChatPlaceholder.tsx` deleted, document title/meta follow the conversation title (C-01/C-02), and the `PageHeader` route h1 shows it (C-03).

## Task Commits

1. **Task 1: TextArea primitive + composer + first submit slice** — RED `c734266`, GREEN `8ff4271`
2. **Tasks 2–3: transcript, recovery, route integration** — `dda0f53`
3. **Unrelated, committed separately** — `f080bdd` (`app/Evals/trace_recorder.py`, a manual eval-prompt edit, kept out of the wave commits)

**Validation debt cleared in `8ff4271`** (left failing by the RED commit): TextArea readonly-ref typing, un-hoisted repository mocks in `Chat.test.tsx`, unused imports, `prefer-const` + unused params in `requestController.test.ts`, and the ui barrel count 8 → 9.

## Files Created/Modified

- `src/components/ui/TextArea.tsx` — the ninth primitive
- `src/components/chat/ChatComposer.tsx` — composer form with busy semantics
- `src/components/chat/ChatThread.tsx` — the labelled ordered transcript
- `src/components/chat/UserMessage.tsx` — caption, raised card, in-flight footer, recovery slot
- `src/components/chat/AssistantMessage.tsx` — caption, hairline, unchanged Markdown
- `src/components/chat/RecoveryBlock.tsx` — seven kinds, verbatim copy, deliberate retry
- `src/components/chat/StorageNotice.tsx` — `role="status"` PERSIST-05 notice, no action button
- `src/routes/Chat.tsx` — the route: state, persistence, controller wiring, metadata
- `src/routes/index.tsx` — `/chat` now lazy-loads the real Chat
- `src/routes/ChatPlaceholder.tsx` — **deleted**
- `src/test/a11y.test.tsx` — chat route case follows the swap
- `src/app.composition.test.tsx` — verified green unchanged against the real tree

## Decisions Made

- **Only the network boundary is faked in route tests.** The real `useAskController` and real `RequestController` run underneath, so a "succeeded appends the answer and stores the thread" assertion actually proves the wiring rather than an echo of a mocked hook. This replaced the earlier `useAskController` mock.
- **Terminal status application is keyed on `requestId` in a ref.** React may re-run an effect; without the guard an answer could be appended twice or a failure overwritten.
- **Retry clears the stale error key explicitly.** `markInFlight` spreads existing metadata, so it would preserve `metadata.error` and keep rendering the previous failure block while a new request is live. `updateMessage({ metadata: { inFlight: true } })` replaces the metadata outright.
- **Title derives only on the first user message** (D-26), so a second turn can never retitle the conversation.
- **StorageNotice's heading is a `<p>`**, not an `h2`/`h3`: the Phase 3 type table puts it at 13px caption size, and a heading element sitting between the route `<h1>` and the message captions has no real place in the outline.

## Deviations from Plan

### 1. [Rule 3 - Scope boundary] `src/test/a11y.test.tsx` also modified

- **Found during:** Task 3, step 2 (delete `ChatPlaceholder.tsx`)
- **Issue:** The plan's Task 3 file list does not include `a11y.test.tsx`, but that file imports `ChatPlaceholder` directly and renders it as the `/chat` route case. Deleting the placeholder breaks compilation and leaves the a11y suite unable to run.
- **Fix:** Import the real `Chat`, and update the route case's name and expected document title to the C-01 title (`New chat · Waynora`).
- **Files modified:** `src/test/a11y.test.tsx`
- **Verification:** a11y suite 15 tests green; the chat route case has zero critical/serious axe violations
- **Committed in:** `dda0f53`

### 2. [Rule 1 - Bug] Tree was red at Task 1 close-out, not green

- **Found during:** Task 1 validation (`npm run typecheck`, `npm run lint`, `npm test`)
- **Issue:** The RED commit `c734266` left six TypeScript errors, five ESLint errors, and one failing barrel test behind — so the plan's own verification commands could not pass even though Task 1's behaviour was correct.
- **Fix:** Readonly ref typing on `TextArea`, `vi.hoisted` for the repository mocks in `Chat.test.tsx`, unused imports removed, `prefer-const`/unused params in `requestController.test.ts`, barrel expectation 8 → 9 primitives.
- **Verification:** tsc exit 0, eslint 0 errors, full suite green
- **Committed in:** `8ff4271`

### 3. [Process] Tasks 2–3 committed as one commit rather than per-task test/feat pairs

- **Found during:** execution
- **Issue:** 03-01 established a "test commit then feat commit" rhythm per task. Tasks 2–3 were executed and committed as a single `dda0f53` because the two tasks share one test file (`src/routes/Chat.test.tsx`) and one implementation file (`src/routes/Chat.tsx`); splitting them would have produced a commit pair whose first half does not compile on its own (it imports `ChatThread` while `Chat.tsx` still renders the plain message list).
- **Verification:** Every behaviour is covered by a test written in the same session as the implementation; the full suite, tsc, and eslint are green at `dda0f53`.
- **Committed in:** `dda0f53`

### Not a deviation — intentionally absent

`WaitingShell`, `useElapsedClock`, and `waitingCopy.ts` appear in the UI-SPEC Component Inventory but **not** in this plan's file lists. They belong to 03-03 and are not part of 03-02's scope. The busy state is served here entirely by `ChatComposer`'s `aria-busy` + C-08 and `UserMessage`'s C-15 footer.

## Issues Encountered

- Route-level text queries matched twice once the `PageHeader` h1 began mirroring the derived title (which equals the first user message). Fixed by scoping message lookups with `within(list)` rather than loosening the assertions.
- Vitest cold start on this host is slow (10–35s per invocation); runs were given extended timeouts.
- axe reports one **moderate**, non-blocking `heading-order` finding on `/chat`: the route `<h1>` is followed by the `EmptyState`'s contracted `<h3>` (the primitive's title level is part of the Phase 1 contract, per the `ChatPlaceholder` composition note). It is surfaced in the test output, not swallowed, and does not fail the gate.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Ready for 03-03: the transcript, composer, and recovery blocks are the surfaces the waiting shell composes into. `Chat.tsx` already threads `status`, `activeMessageId`, and `stop` out of the controller, so the elapsed clock and band copy can attach without reworking the route.
- The `Stop waiting` control (C-14) and the six-band time-banded copy are **not** built here — they are 03-03's scope, and `handleStop` is not wired.
- No blockers.

---

*Phase: 03-real-chat-and-long-request-lifecycle*
*Completed: 2026-10-13*

## Self-Check: PASSED

- src/components/ui/TextArea.tsx — FOUND
- src/components/chat/ChatComposer.tsx — FOUND
- src/components/chat/ChatThread.tsx — FOUND
- src/components/chat/UserMessage.tsx — FOUND
- src/components/chat/AssistantMessage.tsx — FOUND
- src/components/chat/RecoveryBlock.tsx — FOUND
- src/components/chat/StorageNotice.tsx — FOUND
- src/routes/Chat.tsx — FOUND
- src/routes/ChatPlaceholder.tsx — CONFIRMED DELETED
- Commits 8ff4271, dda0f53 — ancestors of HEAD
- Full suite: 24 files, 282 tests passed
- npx tsc --noEmit: exit 0
- npx eslint: 0 errors
- 0 rehype-raw / dangerouslySetInnerHTML occurrences in src/components/chat/
- 0 ChatPlaceholder references in src/routes/
