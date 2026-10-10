---
phase: 02-cookie-persistence-and-chat-domain
plan: 01
subsystem: persistence
tags: [cookie, zod, chunking, retention, recovery, document-cookie]

# Dependency graph
requires:
  - phase: 01-foundation-contracts-and-auth
    provides: Zod strictObject boundary-validation pattern, ask.ts thread_id contract, vitest/jsdom harness
provides:
  - Versioned cookie envelope schema (messageSchema, conversationSchema, cookieEnvelopeSchema) with z.strictObject
  - Chunked cookie codec (encodeEnvelope/decodeEnvelope/decodeEnvelopeSafe) with conversation-boundary sharding
  - Cookie repository (readConversations/writeConversations) with validation, recovery, and safe attributes
  - Retention caps (enforceCap/calculateTotalSize) with oldest-first eviction and returned evicted IDs
  - StorageResult type consumed by Phase 3/4 chat state and UI overflow notices
affects:
  - phase 03 (real chat) — consumes cookie domain types + StorageResult
  - phase 04 (chat management) — consumes evicted IDs for visible overflow notices
  - keyword: persistence, cookie, chat-domain

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Conversation-boundary sharding (not fixed windows) so one corrupt cookie costs one conversation
    - Index-cookie-last write ordering for partial-write detectability
    - Total-decode (decodeEnvelopeSafe) as the recovery boundary: never throws, drops per segment
    - Browser cookie jar test double with Max-Age=0 delete semantics and write-order spy

key-files:
  created:
    - src/lib/cookie/schema.ts
    - src/lib/cookie/codec.ts
    - src/lib/cookie/repository.ts
    - src/lib/cookie/retention.ts
    - src/lib/cookie/schema.test.ts
    - src/lib/cookie/codec.test.ts
    - src/lib/cookie/repository.test.ts
    - src/lib/cookie/retention.test.ts
  modified: []

key-decisions:
  - "Shard boundaries fall on conversation edges rather than fixed character windows; this is what makes D-22 salvage actually possible and keeps every shard under the 4 KB cookie limit"
  - "The index cookie stores a per-conversation segment map, not just a chunk count, so a lost shard can be attributed to exactly one conversation"
  - "decodeEnvelope (strict, throws) is kept for callers that want total correctness; repository uses decodeEnvelopeSafe (total, never throws)"
  - "getCookie returns null when decodeURIComponent throws — a tampered cookie is corrupt data, not a crash"
  - "Persisted conversation order is retention order (newest first), so every read returns conversations ordered the same way"
  - "The plan's stated dependency order was inverted in execution (retention before repository) because repository.ts imports enforceCap from retention.ts"

patterns-established:
  - "Cookie trust boundary: every read is validated by Zod strictObject before it enters application state"
  - "Recovery is per-segment: a corrupt or missing shard drops one conversation, reported via recovered:true and dropped:string[]"
  - "Retention never evicts silently: enforceCap always returns the IDs it dropped so the UI can notify"
  - "Cookie jar test double mirrors real browser semantics (append, Max-Age<=0 deletes), enabling write-order and attribute assertions"

requirements-completed: [PERSIST-01, PERSIST-02, PERSIST-03, PERSIST-04, PERSIST-05]

# Metrics
duration: 48min
completed: 2026-10-10
---

# Phase 2: Cookie Persistence and Chat Domain Summary

**Versioned, Zod-validated cookie persistence with per-conversation shard recovery, index-cookie-last writes, and 20-conversation/50KB retention caps that report every eviction**

## Performance

- **Duration:** 48 min (started 2026-10-10T18:20:55Z, completed 2026-10-10T19:08:33Z)
- **Tasks:** 3 completed
- **Files modified:** 8 created (4 source, 4 test)

## Accomplishments

- **Validated data model with no secrets possible by construction** — three `z.strictObject` schemas (`messageSchema`, `conversationSchema`, `cookieEnvelopeSchema`) where an unknown key is a parse error, so a password/token/API-key field cannot enter the cookie payload (D-23, PERSIST-01/02).
- **Chunked codec that survives partial corruption** — `encodeEnvelope` shards each conversation into its own cookie range (`waynora_chat_0`, `waynora_chat_1`, …) at ≤3500 bytes, with the index cookie holding a segment map. `decodeEnvelopeSafe` drops only the conversations whose shards were lost and salvages the rest (D-22, PERSIST-03).
- **Repository that never crashes on bad cookie data** — malformed index, unsupported version, hostile percent-escape, and missing shards all return an empty or partially-salvaged snapshot instead of throwing (D-21, PERSIST-04).
- **Retention caps with visible eviction** — `enforceCap` evicts oldest-by-`updatedAt` first under either 20 conversations or 50KB, rejects an oversized single conversation whole rather than truncating, and always returns the evicted IDs (D-19/D-20, PERSIST-05).
- **78 cookie tests green; full suite green at 157 tests** across 15 files.

## Task Commits

Each task was committed atomically, with TDD tasks split into RED then GREEN:

1. **Task 1: Zod schemas + chunk codec (TDD)** - `dfc39ae` (feat) after `81f1bab` (test)
2. **Task 2: Cookie repository with validation + recovery (TDD)** - `e758d26` (feat) after `f7b289b` (test)
3. **Task 3: Retention caps + eviction + write notices (TDD)** - `b80255d` (feat) after `a4b8fc5` (test)
4. **Follow-up:** `7e33342` (fix) — lint pass on the schema boundary tests

**Plan metadata:** (this SUMMARY's commit)

_TDD tasks each have a test commit followed by a feat commit, satisfying the RED/GREEN gate sequence._

## Files Created/Modified

- `src/lib/cookie/schema.ts` - `messageSchema` (id/role enum/content/datetime/optional metadata), `conversationSchema` (id/title/timestamps/messages/optional threadId), `cookieEnvelopeSchema` (`version: z.literal(1)`), plus inferred types `Message`/`Conversation`/`CookieEnvelope`.
- `src/lib/cookie/codec.ts` - `CHUNK_SIZE = 3500`, `COOKIE_PREFIX`, `INDEX_COOKIE`; pure `chunkString`/`joinChunks`; `encodeEnvelope`/`decodeEnvelope` (strict, throws) and `decodeEnvelopeSafe` (total, salvages per segment); `envelopeIndexSchema` + `parseEnvelopeIndex`.
- `src/lib/cookie/repository.ts` - `readConversations`/`writeConversations`/`StorageResult`; `COOKIE_MAX_AGE = 30d`, `COOKIE_ATTRIBUTES = "SameSite=Lax; Secure; Path=/"`; shard reads with corrupt-value tolerance, stale-shard cleanup, index-cookie-last write ordering.
- `src/lib/cookie/retention.ts` - `MAX_CONVERSATIONS = 20`, `MAX_TOTAL_BYTES = 50_000`; `calculateTotalSize` and `enforceCap` (oldest-first eviction, oversized conversation rejected whole, survivors returned newest-first).
- `src/lib/cookie/schema.test.ts` - 23 boundary tests: valid payloads, unknown keys, missing fields, wrong version, invalid role, empty id/title.
- `src/lib/cookie/codec.test.ts` - 24 tests: chunk/join boundaries, round-trips (including metadata + threadId), per-conversation sharding, corruption salvage, version rejection.
- `src/lib/cookie/repository.test.ts` - 17 tests: empty cookies, valid round-trip, malformed index, missing/corrupt shards, D-22 salvage, D-16 version rejection, hostile string, index-last ordering, attributes, stale-shard cleanup.
- `src/lib/cookie/retention.test.ts` - 14 tests: both caps, oldest-first order, oversized rejection, evicted IDs unique and complete.

## Decisions Made

- **Conversation-boundary sharding.** The plan called for a "single versioned JSON envelope stored across multiple cookies" but did not specify where shard boundaries fall. Fixed-size character windows would make D-22 salvage impossible, since one bad window poisons the entire envelope. Boundaries fall on conversation edges: each conversation is JSON-serialized independently and sharded, and the index cookie records a segment map. A corrupt shard now costs exactly one conversation. Cost is slightly unfilled shards; benefit is the recovery contract the plan required.
- **Two decode entry points.** `decodeEnvelope` stays strict (throws on any malformed input) as the plan's signature specified; the repository uses the additional `decodeEnvelopeSafe`, which is total and returns `{ ok, envelope, dropped, recovered, reason }`. The plan's repository action described exactly this behavior but only listed `decodeEnvelope` as the export.
- **`getCookie` treats an undecodable value as corrupt rather than throwing.** `decodeURIComponent` throws `URIError` on a malformed percent-escape, which a tampered cookie trivially provides. Returning null routes it through the existing malformed-data path instead of crashing (D-21).
- **Persisted and returned order is newest-first.** `enforceCap` returns survivors ordered by `updatedAt` descending, so a read-back after write surfaces the same order every time — Phase 3 can render the conversation list directly without re-sorting.
- **Execution order inverted for tasks 2 and 3.** The plan assigned repository (Task 2) before retention (Task 3), but `repository.ts` imports `enforceCap` from `retention.ts`. Retention was implemented and committed first so the repository GREEN phase had its dependency in place; both were completed within this plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `decodeURIComponent` crash on malformed cookie value**
- **Found during:** Task 2 (cookie repository implementation)
- **Issue:** `getCookie` called `decodeURIComponent` unguarded, so a cookie value with a malformed percent-escape (e.g. `%E0%A4%A`) threw `URIError` out of `readConversations`. A tampered or truncated cookie could take down the read path — exactly the crash D-21 forbids.
- **Fix:** Wrapped the decode in try/catch, returning null so the value is treated as a corrupt shard and handled by the existing recovery path. Added a regression test ("never throws on a hostile cookie string").
- **Files modified:** `src/lib/cookie/repository.ts`, `src/lib/cookie/repository.test.ts`
- **Verification:** Hostile-string test passes; full cookie suite green.
- **Committed in:** `e758d26` (part of Task 2 commit)

**2. [Rule 1 - Bug] Unsatisfied dependency order between Tasks 2 and 3**
- **Found during:** Task 2 GREEN phase
- **Issue:** Repository tests could not run because `repository.ts` imports `enforceCap` from `retention.ts`, which the plan scheduled one task later.
- **Fix:** Executed Task 3's retention implementation before Task 2's repository, preserving each task's own TDD cycle and atomic commit.
- **Files modified:** (none — ordering only)
- **Verification:** Both suites pass independently and together.
- **Committed in:** `b80255d`, `e758d26`

**3. [Rule 1 - Bug] Lint failures on schema boundary tests**
- **Found during:** Task 1 GREEN phase
- **Issue:** `const { createdAt: _omit, ...rest }` destructuring left unused variables, failing `eslint` (`no-unused-vars`). Two tests would have blocked `npm run lint`.
- **Fix:** Replaced with explicit payload objects, leaving the rejection assertions unchanged.
- **Files modified:** `src/lib/cookie/schema.test.ts`
- **Verification:** `npx eslint src/lib/cookie` clean.
- **Committed in:** `7e33342`

**4. [Rule 1 - Bug] Undersized byte-cap test fixture**
- **Found during:** Task 3 GREEN phase
- **Issue:** The "enforces MAX_TOTAL_BYTES" fixture asserted 6 conversations × 2500 chars would exceed 50,000 — actual total was 16,213, so the sanity assertion inside the test failed rather than the code under test.
- **Fix:** Resized the fixture to 4 × 25,000 characters. No production change.
- **Files modified:** `src/lib/cookie/retention.test.ts`
- **Verification:** Retention suite green.
- **Committed in:** `b80255d`

---

**Total deviations:** 4 auto-fixed (4 Rule 1 - bug)
**Impact on plan:** All fixes were correctness or tooling failures. No scope creep — no requirements added, no plan-mandated behavior changed. Next phase needs the plan's dependency order swapped (retention before repository).

## Issues Encountered

- The per-conversation sharding design changed `decodeEnvelope`'s body from the plan's literal "join chunks → parse JSON" to "rebuild each segment → validate → assemble envelope". Joining across conversation boundaries never produced a parseable envelope, because the payload is a concatenation of per-conversation JSON documents rather than one continuous envelope document. The strict function still throws on any malformed input, so its contract is unchanged.
- The repository test double needed real browser cookie semantics: a plain `{ cookie: "" }` object overwrites on assignment, which would make the "data chunks first, index last" ordering untestable. The implemented jar appends per named cookie and honours `Max-Age=0` as a delete, and a spy setter captures raw assignments for attribute assertions.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 3 (real chat) can consume `Conversation`/`Message`/`CookieEnvelope` types and `StorageResult` to wire chat state to `POST /ask`, including `conversation.threadId` for backend threading.
- Phase 4 (chat management) can consume `StorageResult.evicted` directly for the visible overflow notice (D-20), and `StorageResult.recovered` to surface the D-22 recovery state to the user.
- Cookie capacity in real browsers is still unverified — retention caps are sound on paper but need a live browser pass before release.
- **Not yet covered by this plan:** pure chat-domain operations (`src/lib/chat/domain.ts`, PERSIST-09/PERSIST-10) are plan 02-02.

## Self-Check: PASSED

**Created files (9/9 verified on disk):**

- `src/lib/cookie/schema.ts`, `src/lib/cookie/codec.ts`, `src/lib/cookie/repository.ts`, `src/lib/cookie/retention.ts`
- `src/lib/cookie/schema.test.ts`, `src/lib/cookie/codec.test.ts`, `src/lib/cookie/repository.test.ts`, `src/lib/cookie/retention.test.ts`
- `.planning/phases/02-cookie-persistence-and-chat-domain/02-01-SUMMARY.md`

**Commits (7/7 found in git log):** `81f1bab`, `dfc39ae`, `f7b289b`, `a4b8fc5`, `b80255d`, `e758d26`, `7e33342`

**Verification evidence:**

- `npx vitest run src/lib/cookie/` → 4 files, 78 tests, all passed
- `npx vitest run` → 15 files, 157 tests, all passed
- `npx tsc --noEmit` → clean
- `npx eslint src/lib/cookie` → clean
- No password/token/secret/apiKey fields in `src/lib/cookie/schema.ts` (matches are prose comments only)
- Cookie attributes confirmed present: `SameSite=Lax; Secure; Path=/; Max-Age=`

---

*Phase: 02-cookie-persistence-and-chat-domain*
*Completed: 2026-10-10*
