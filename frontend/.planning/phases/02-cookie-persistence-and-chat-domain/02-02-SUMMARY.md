---
phase: 02-cookie-persistence-and-chat-domain
plan: 02
subsystem: chat-domain
tags: [chat, domain, pure-functions, immutability, failure-preservation, cookie-persistence]

# Dependency graph
requires:
  - phase: 02-cookie-persistence-and-chat-domain (plan 01)
    provides: Conversation/Message/CookieEnvelope types, readConversations/writeConversations repository, enforceCap retention
  - phase: 01-foundation-contracts-and-auth
    provides: vitest harness, Zod strictObject pattern, CUSTOMER_MESSAGES error taxonomy
provides:
  - Pure, framework-agnostic chat-domain operations (createConversation, createMessage, addMessage, updateMessage, deriveTitle, markInFlight, markError)
  - Failure preservation: markError keeps submitted content and existing metadata (PERSIST-09)
  - Conservative in-flight metadata: boolean flag plus timestamp (PERSIST-10)
  - Persistence-boundary integration tests proving domain + cookie repository round-trips
affects:
  - phase 03 (real chat) — consumes domain operations to wire chat state to POST /ask
  - phase 04 (chat management) — consumes deriveTitle and the conversation lifecycle for the sidebar
  - keyword: chat-domain, persistence, pure-functions

# Actuals (#2632) — pairs with the plan's `estimate` to calibrate future estimates.
# Same estimateTokens scale (chars/4 over the realized diff), never a harness token count.
# Realized diff includes the four TDD evidence artifacts; the code-only diff
# (src/lib/chat/) is 19,321 chars ≈ 4,830 tokens.
actuals:
  tokens: 12294
  tasks: 2
  commits: 4
  plan_head_before: 7cc1072a71c7dc422103040fdfeff18c56615a1f
  plan_head_after: 5cc9d947eabc8e576036254fbc2dc08f1d9047a7

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Pure domain module: every function takes state and returns new state; no DOM, no framework imports
    - Node-environment unit tests for pure functions (@vitest-environment node) — one fewer jsdom instance keeps the load-sensitive composition regression stable
    - Browser-semantics cookie-jar test double (named writes append, Max-Age<=0 deletes) reused from repository.test.ts for round-trip tests
    - RED-phase evidence records (TAP report + classifier-validated JSON) committed alongside each TDD red commit

key-files:
  created:
    - src/lib/chat/domain.ts
    - src/lib/chat/domain.test.ts
  modified: []

key-decisions:
  - "markInFlight records the in-flight timestamp on conversation.updatedAt: the 02-01 metadata schema is a strictObject with no timestamp field, so updatedAt is the only schema-valid slot for D-27's 'boolean flag and timestamp'; it also keeps the in-flight conversation newest in retention order"
  - "Domain tests run in the node environment: pure functions need no DOM, and dropping one jsdom instance keeps the full suite stable under parallelism"
  - "TDD RED commits include a type-correct, behavior-wrong scaffold so tests fail on their planned assertions rather than on module resolution (tdd.md #3770 INVALID_RED)"
  - "Task 2's GREEN is test-only: the domain + repository integration already worked; the RED failure was the plan's naive { cookie: '' } document stub, fixed with the browser-semantics cookie jar"

patterns-established:
  - "Immutable conversation lifecycle: addMessage/updateMessage/markInFlight/markError all spread to new objects and new message arrays"
  - "Title derivation: first user message, 50-char truncation, 'New chat' fallback (D-26)"
  - "Failure preservation: markError clears inFlight, attaches a customer-safe error, and preserves content and metadata (D-28)"

requirements-completed: [PERSIST-09, PERSIST-10]

coverage:
  - id: D1
    description: "Pure chat-domain operations module (createConversation, createMessage, addMessage, updateMessage, deriveTitle, markInFlight, markError) — all immutable and framework-agnostic"
    verification:
      - kind: unit
        ref: "src/lib/chat/domain.test.ts#chat domain operations"
        status: pass
    human_judgment: false
  - id: D2
    description: "Failure preservation across the cookie persist/read round-trip: submitted user message content and existing history survive markError"
    requirement: PERSIST-09
    verification:
      - kind: integration
        ref: "src/lib/chat/domain.test.ts#persistence boundary integration > preserves error state and the submitted message across persist/read round-trip (PERSIST-09)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Conservative in-flight metadata survives the persist/read round-trip (boolean flag plus timestamp), enabling a UI recovery state without auto-replay"
    requirement: PERSIST-10
    verification:
      - kind: integration
        ref: "src/lib/chat/domain.test.ts#persistence boundary integration > preserves in-flight state across persist/read round-trip (PERSIST-10)"
        status: pass
    human_judgment: false

# Metrics
duration: 49min
completed: 2026-10-11
status: complete
---

# Phase 2 Plan 02: Pure Chat Domain Operations Summary

**Immutable, framework-agnostic chat-domain lifecycle (create/add/update/title/in-flight/error) with failure-preserving markError and persistence-boundary round-trip tests through the cookie repository**

## Performance

- **Duration:** 49 min
- **Started:** 2026-10-11T03:51:37Z
- **Completed:** 2026-10-11T04:40:55Z
- **Tasks:** 2 (both TDD: RED → GREEN)
- **Files created:** 2 source files + 4 TDD evidence artifacts

## Accomplishments

- **Pure domain module with zero dependencies** — `src/lib/chat/domain.ts` exports the seven conversation-lifecycle operations. Every function takes state and returns new state: no mutation, no DOM access, no framework imports (D-29). Phase 3 can call them directly from chat state without a browser.
- **Title derivation per D-26** — first user message, truncated to exactly 50 characters, with "New chat" fallback for blank, whitespace-only, or missing user content.
- **Failure preservation per D-28 / PERSIST-09** — `markError` clears `inFlight`, attaches a customer-safe error string from `CUSTOMER_MESSAGES`, and preserves the submitted message content and existing metadata (including `threadId`). A failed request never loses the user's words.
- **Conservative in-flight metadata per D-27 / PERSIST-10** — `markInFlight` sets a boolean flag plus the marking time (on `updatedAt`, the schema-valid timestamp slot), so a reload can show a recovery state without auto-replaying.
- **End-to-end persistence proof** — five integration cases round-trip domain-produced conversations through `writeConversations`/`readConversations`: single conversation, in-flight state, error state, multiple conversations in retention order, and the empty state.
- **30 domain tests green; full suite 187/187; `tsc --noEmit` and `eslint` clean.**

## Task Commits

Each TDD task produced a RED commit followed by a GREEN commit:

1. **Task 1: Pure domain functions (TDD)** — `a3ccce4` (test, RED: 19 fail / 6 pass) then `baa9925` (feat, GREEN: 25/25)
2. **Task 2: Persistence boundary integration tests (TDD)** — `03e18ec` (test, RED: 4 fail / 26 pass) then `5cc9d94` (test, GREEN: 30/30)

**Plan metadata:** this SUMMARY's commit (docs).

_TDD gate compliance: every RED commit (`test(02-02):`) precedes its GREEN commit; the plan-level gate finds both `test(02-02):` and `feat(02-02):` commits in the git log. Both RED states were validated by the `check tdd-red-evidence` classifier with verdict `RED_EVIDENCE_OK` (records committed alongside the TAP reports)._

## Files Created/Modified

- `src/lib/chat/domain.ts` - the seven pure domain operations, importing only the `Conversation`/`Message` types from `../cookie/schema`.
- `src/lib/chat/domain.test.ts` - 30 tests: 25 unit tests (all seven functions, immutability, title edge cases, metadata preservation) + 5 persistence-boundary integration tests, running in the node environment with a browser-semantics cookie-jar double.
- `.planning/phases/02-cookie-persistence-and-chat-domain/02-02-red-task1-{tap.txt,record.json}` - Task 1 RED evidence (TAP report + classifier-validated record).
- `.planning/phases/02-cookie-persistence-and-chat-domain/02-02-red-task2-{tap.txt,record.json}` - Task 2 RED evidence.

## Decisions Made

- **In-flight timestamp lives on `conversation.updatedAt`.** D-27 requires in-flight state to carry "a boolean flag and a timestamp", but the frozen 02-01 `messageMetadataSchema` is a `strictObject` with only `inFlight`/`error`/`threadId` — a timestamp field there would be rejected at persistence time and dropped by the round-trip. `updatedAt` is the schema-valid slot, and bumping it also keeps the active conversation newest in retention order (protecting it from eviction). The plan's action spec ("metadata set to { ...existingMetadata, inFlight: true }") is followed exactly for the metadata itself.
- **Domain tests run in the node environment.** The operations are pure (D-29) and touch no DOM API; the integration tests stub `document` explicitly, which works identically in node. This is also one fewer jsdom environment in the full-suite run.
- **RED commits carry a behavior-wrong scaffold.** A test-only RED commit against a not-yet-existing module fails at import resolution, which tdd.md classifies as `fixture_or_load_failure` (INVALID_RED). The scaffold is type-correct but returns wrong values, so the RED failures are assertion failures on the planned behaviors — verified by the classifier.
- **Task 2's GREEN is a test-infrastructure fix, not production code.** The domain + repository integration already worked; the plan's prescribed naive `{ cookie: "" }` document stub cannot emulate browser cookie semantics (a plain object overwrites on assignment), which is what made the round-trip tests fail in RED. The GREEN commit swaps in the cookie-jar double established in `repository.test.ts`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `markInFlight`'s `now` parameter had no schema-valid destination**
- **Found during:** Task 1 (implementation design)
- **Issue:** The plan's action spec stores only `{ ...existingMetadata, inFlight: true }` in message metadata, leaving the signature's `now` parameter unused — but the repo's `tsconfig.json` sets `noUnusedParameters` and the ESLint recommended config's `no-unused-vars` has no `argsIgnorePattern`, so the literal signature fails both gates. D-27 simultaneously requires in-flight state to carry a timestamp, and the frozen 02-01 metadata schema (strictObject: `inFlight`/`error`/`threadId` only) has no timestamp field.
- **Fix:** Record the marking time on `conversation.updatedAt` — the only schema-valid timestamp slot — giving `now` its intended meaning while keeping the metadata exactly as the plan specifies. A test locks the behavior ("records the marking time on updatedAt (D-27 timestamp)").
- **Files modified:** `src/lib/chat/domain.ts`, `src/lib/chat/domain.test.ts`
- **Verification:** 25/25 domain tests pass; `tsc --noEmit` and `eslint` clean; round-trip tests confirm the timestamp persists.
- **Committed in:** `baa9925`

**2. [Rule 3 - Blocking] RED commits needed a runnable scaffold to produce valid RED evidence**
- **Found during:** Task 1 and Task 2 (RED phases)
- **Issue:** Committing only the test file (the 02-01 precedent) makes the suite fail at module resolution — a `fixture_or_load_failure` per tdd.md #3770, which is INVALID_RED and does not authorize GREEN.
- **Fix:** Each RED commit includes a type-correct, behavior-wrong `domain.ts` scaffold (Task 1) so the named target tests fail on their planned assertions. Both RED records were validated by `gsd-tools check tdd-red-evidence` with verdict `RED_EVIDENCE_OK` before the corresponding GREEN commit.
- **Files modified:** `src/lib/chat/domain.ts` (scaffold, replaced in GREEN), evidence records
- **Verification:** Classifier verdicts `RED_EVIDENCE_OK` (target test failed, exit 1, 19 and 4 failures respectively).
- **Committed in:** `a3ccce4`, `03e18ec`

**3. [Rule 2 - Missing critical] Domain test file needed the node environment to keep the full suite stable**
- **Found during:** Task 1 (full-suite verification)
- **Issue:** The pre-existing composition regression (`src/app.composition.test.tsx`) uses a 1-second `findByText` timeout and is load-sensitive: adding a 16th jsdom environment tipped it into intermittent failure under full-suite parallelism (it passes in isolation; the failure is unrelated to chat code — nothing imports `domain.ts`).
- **Fix:** Declared `@vitest-environment node` on `domain.test.ts`. Pure functions need no DOM, so this is technically correct, and removing the unnecessary jsdom instance keeps the full suite green (187/187).
- **Files modified:** `src/lib/chat/domain.test.ts`
- **Verification:** Full suite 187/187 passed; domain suite runs in 3s instead of 5s+.
- **Committed in:** `baa9925`

**4. [Rule 1 - Bug] The plan's naive `{ cookie: "" }` document stub cannot round-trip cookies**
- **Found during:** Task 2 (RED phase)
- **Issue:** The plan prescribes `vi.stubGlobal("document", { cookie: "" })`, but a plain object overwrites on assignment — every `setCookie` call replaces the previous one, so only the index cookie survives and all data shards are lost. The persist/read round-trip the tests assert is impossible under that stub (the same lesson 02-01 recorded for the repository tests).
- **Fix:** GREEN replaced the stub with the browser-semantics cookie jar established in `repository.test.ts` (named writes append, `Max-Age<=0` deletes, reads render the whole jar). No production code change was required — the integration already worked.
- **Files modified:** `src/lib/chat/domain.test.ts`
- **Verification:** All 5 integration cases pass; in-flight and error state survive the round-trip with content intact.
- **Committed in:** `5cc9d94`

---

**Total deviations:** 4 auto-fixed (1 Rule 1 - bug, 1 Rule 2 - missing critical, 2 Rule 3 - blocking)
**Impact on plan:** All fixes were correctness or tooling-gate requirements. No scope creep — no requirements added, no plan-mandated behavior changed. The domain contract is exactly the plan's seven signatures.

## Issues Encountered

- **Load-sensitive composition regression (pre-existing, out of scope).** `app.composition.test.tsx` fails intermittently under full-suite parallelism on this machine (environment setup alone takes 30-100s across 16 files) because its `findByText` timeout is 1s. It passes in isolation and is unrelated to this plan's code. The node-environment change (deviation 3) removed the tipping load; a future hardening should raise that timeout. Logged for the deferred-items register.
- **Vitest's `tap-flat` diagnostics are incompatible with the strict TAP parser.** The RED-evidence classifier's TAP adapter rejects vitest's multi-line YAML diagnostic blocks as non-TAP data. The committed evidence records therefore carry the TAP stream with diagnostic blocks stripped (plan, test names, and pass/fail status preserved); the complete unmodified reports are committed alongside as `*-tap.txt` artifacts.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 3 (real chat) can consume the domain operations directly: `createConversation` on the first request, `addMessage` for user/assistant turns, `markInFlight` while `POST /ask` is pending, `markError` on failure (content preserved per PERSIST-09), `deriveTitle` for the conversation list.
- `conversation.threadId` remains the backend-threading link — set via `updateMessage` after the first `/ask` response, and preserved by `markInFlight`/`markError`.
- Cookie capacity in real browsers remains unverified (carried from 02-01) — retention caps are sound on paper but need a live browser pass before release.

## Known Stubs

None — all seven functions are fully implemented against the plan's behavior spec; no placeholder values, empty constants, or unwired data sources.

## Threat Flags

None — no new network endpoints, auth paths, file access, or trust-boundary schema changes beyond the plan's threat model. T-02-07 (immutability) is mitigated by pure functions with immutability assertions; T-02-08 (in-flight metadata) stays a boolean flag plus timestamp with no request payloads; T-02-09 (conversation size) remains enforced by the repository's retention caps; T-02-10 (error state) uses only `CUSTOMER_MESSAGES` strings.

## Self-Check: PASSED

**Created files (7/7 verified on disk):**

- `src/lib/chat/domain.ts`, `src/lib/chat/domain.test.ts`
- `.planning/phases/02-cookie-persistence-and-chat-domain/02-02-SUMMARY.md`
- `.planning/phases/02-cookie-persistence-and-chat-domain/02-02-red-task1-record.json`
- `.planning/phases/02-cookie-persistence-and-chat-domain/02-02-red-task1-tap.txt`
- `.planning/phases/02-cookie-persistence-and-chat-domain/02-02-red-task2-record.json`
- `.planning/phases/02-cookie-persistence-and-chat-domain/02-02-red-task2-tap.txt`

**Commits (4/4 found in git log):** `a3ccce4`, `baa9925`, `03e18ec`, `5cc9d94`

**Verification evidence:**

- `npx vitest run src/lib/chat/domain.test.ts` → 30 tests, all passed
- `npx vitest run` → 16 files, 187 tests, all passed
- `npx tsc --noEmit` → clean
- `npx eslint src/lib/chat/` → clean
- `grep -c "react" src/lib/chat/domain.ts` → 0
- `gsd-tools check tdd-red-evidence` → `RED_EVIDENCE_OK` for both tasks

---
*Phase: 02-cookie-persistence-and-chat-domain*
*Completed: 2026-10-11*
