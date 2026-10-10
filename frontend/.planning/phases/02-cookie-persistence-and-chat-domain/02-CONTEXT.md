# Phase 2: Cookie Persistence and Chat Domain - Context

**Gathered:** 2026-10-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 builds the versioned, validated, bounded browser-cookie persistence layer and pure chat-domain operations. It delivers the data model and storage engine that Phase 3 (real chat) and Phase 4 (chat management) will consume. It does not build the chat UI, sidebar, waiting room, or 2048 game; those belong to later phases.

</domain>

<decisions>
## Implementation Decisions

### Cookie data model and envelope
- **D-15:** Use a single versioned JSON envelope stored across multiple cookies (chunked) to respect the ~4 KB per-cookie limit. The envelope contains a version field, conversation metadata, and message data.
- **D-16:** The envelope version is an integer field (`version: 1`). Migration support: if an unrecognized version is encountered, reject the entire snapshot and start fresh rather than attempting partial migration.
- **D-17:** Cookie attributes are `SameSite=Lax` (or `Strict` if compatible with OAuth redirects in future), `Secure` in HTTPS production, `Path=/`, and a reasonable `Max-Age` aligned with retention policy. No `HttpOnly` (client JS must read/write).

### Chunking and size strategy
- **D-18:** Chunking uses a fixed maximum chunk size (target ~3.5 KB to stay safely under 4 KB with cookie overhead). An index cookie stores the chunk count and total size; data cookies store the chunks.
- **D-19:** When total data exceeds the retention cap, evict oldest conversations first (FIFO by last-updated timestamp). Never silently truncate an itinerary — if a single conversation exceeds the cap, reject it with a visible notice.
- **D-20:** The application enforces a reasonable retention cap (e.g., 20 conversations or ~50 KB total, whichever is hit first). When storage is full, the UI visibly notifies the user that a chat could not be persisted.

### Validation and recovery
- **D-21:** All cookie reads validate the complete snapshot through Zod schemas. Malformed, partial, or oversized data is rejected — the application falls back to an empty state rather than crashing or silently accepting invalid data.
- **D-22:** Recovery strategy: if the index cookie is valid but some data chunks are missing or corrupt, salvage the conversations that are intact and drop only the corrupted ones. Log the recovery action for debugging.
- **D-23:** Never put passwords, tokens, API keys, or secrets in cookies. Cookie data contains only conversation content, metadata, and thread IDs.

### Chat domain model
- **D-24:** A conversation has: `id` (string), `title` (string), `createdAt` (ISO timestamp), `updatedAt` (ISO timestamp), `messages` (array), and `threadId` (string, optional — set after first `/ask` response).
- **D-25:** A message has: `id` (string), `role` (`"user" | "assistant"`), `content` (string), `createdAt` (ISO timestamp), and optional `metadata` (e.g., `inFlight`, `error`, `threadId`).
- **D-26:** Title is derived from the first user message (truncated to ~50 chars). No naming dialog. If the first message is empty or whitespace, fall back to "New chat".
- **D-27:** In-flight request metadata is stored conservatively: only a boolean `inFlight` flag and a timestamp. On reload, if `inFlight` is true, the UI shows a recovery state (not auto-replay) and lets the user decide whether to retry.

### Failure preservation
- **D-28:** A failed request preserves the submitted user message and all existing conversation history. The message that was in-flight gets an error state attached, and the user can see what failed and choose to retry.
- **D-29:** The pure domain operations (create conversation, add message, update message, derive title, mark in-flight, mark error) are framework-agnostic and fully testable without React or browser APIs.

### the agent's Discretion

The exact chunk size, eviction order details, Zod schema internals, file naming, and test structure are implementation details. Choose the smallest stable approach that preserves the locked contracts above. Use `src/lib/cookie/` and `src/lib/chat/` as the directory structure unless there's a compelling reason to deviate.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Product and scope
- `.planning/PROJECT.md` — product purpose, core value, constraints, backend facts, and mandatory frontend skills.
- `.planning/REQUIREMENTS.md` — Phase 2 requirements PERSIST-01..05, PERSIST-09, PERSIST-10.
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, plans, and explicit phase boundary.
- `.planning/STATE.md` — current project state, accumulated decisions, and known blockers.

### Prior phase context
- `.planning/phases/01-foundation-contracts-and-auth/01-CONTEXT.md` — Phase 1 decisions D-01..D-14 that carry forward (especially D-03, D-09, D-12, D-13).

### Existing code
- `src/lib/api/ask.ts` — typed Zod schemas for the `/ask` contract; the `thread_id` field links to conversation threading.
- `src/lib/env.ts` — environment validation pattern (Zod strictObject + pickPublicEnv).
- `src/lib/errors.ts` — customer-safe error messages and error kinds.
- `src/components/ui/` — 8 accessible primitives that Phase 3+ will use for chat UI.
- `src/routes/ChatPlaceholder.tsx` — current empty chat route; will be replaced by Phase 3.

### Backend contract
- `../main.py` — actual FastAPI `/ask` route; `thread_id` is the threading mechanism.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/api/ask.ts`: Zod schemas (`askRequestSchema`, `askResponseSchema`) and `askBackend()` — the `thread_id` field is the link between conversations and backend threading.
- `src/lib/env.ts`: Zod validation pattern with `pickPublicEnv()` — replicate this strict-validation approach for cookie data.
- `src/lib/errors.ts`: `CUSTOMER_MESSAGES` and error kind taxonomy — reuse for cookie/storage error messages.
- `src/components/ui/`: 8 primitives (Button, TextField, ErrorText, Spinner, EmptyState, VisuallyHidden, SkipLink, PageHeader) — Phase 3+ will build chat UI on these.

### Established Patterns
- Zod `strictObject` for all boundary validation (env, API) — apply the same to cookie data.
- ESM-compatible TypeScript with Vite — no CommonJS patterns.
- `src/lib/` is the home for typed utilities and domain logic.
- Test files live alongside source (`*.test.ts`) with boundary tests for API contracts.

### Integration Points
- `src/routes/ChatPlaceholder.tsx` — will be replaced by the real chat route in Phase 3; Phase 2 provides the data layer it will consume.
- `src/auth/AuthProvider.tsx` — auth state is available; cookie persistence is independent of auth state.
- `src/lib/api/ask.ts` — `thread_id` from `/ask` responses maps to `conversation.threadId` in the domain model.

</code_context>

<specifics>
## Specific Ideas

- The two plans are clearly scoped in ROADMAP.md: 02-01 (cookie codec/chunk repository) and 02-02 (pure domain operations + tests).
- The phase is intentionally data-layer only — no UI components beyond what's needed for testing.
- Cookie persistence must survive browser reloads (PERSIST-08 is Phase 4, but the data model must support it).
- The `thread_id` from `/ask` responses is the backend threading mechanism — it must be stored and reused for follow-up messages.

</specifics>

<deferred>
## Deferred Ideas

- Chat sidebar UI, create/switch/rename/delete interface — Phase 4 (PERSIST-06, PERSIST-07, PERSIST-08).
- Real `/ask` execution, waiting room, 2048 game — Phases 3 and 4.
- Password reset, OAuth, email verification — v1.x/v2 per REQUIREMENTS.md.
- Compression of cookie data (could be added if chunking alone is insufficient) — agent's discretion within this phase.

</deferred>

---

*Phase: 2-Cookie Persistence and Chat Domain*
*Context gathered: 2026-10-10*
