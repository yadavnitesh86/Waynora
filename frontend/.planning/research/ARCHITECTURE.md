# Architecture Research

**Domain:** AI-chat travel planning web frontend (Vite React SPA with Convex authentication and cookie-only chat persistence)
**Researched:** 2026-10-09
**Confidence:** HIGH for the frontend/backend boundaries and API contract; MEDIUM for browser-cookie capacity and retention values, which must be confirmed with tests in the target browsers

## Standard Architecture

### System Overview

Waynora should be a client-heavy React SPA with deliberately separated boundaries. React owns presentation and short-lived interaction state; a small API client owns the one FastAPI integration; a cookie store owns chat persistence; Convex owns authentication only; and the 2048 game is an isolated waiting-room feature. The browser must never pretend that the synchronous `/ask` call is a background job or that Convex is a chat database.

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Vite React SPA                               │
├───────────────────────┬───────────────────────┬──────────────────────┤
│ Router / route guards │ Chat feature          │ Waiting experience   │
│ Landing, auth, chat   │ Composer, messages,   │ Honest elapsed-time  │
│                       │ management, errors    │ copy + isolated 2048 │
├───────────────────────┴───────────────┬───────┴──────────────────────┤
│ Application services                  │ Convex client/provider       │
│ ask client + single-flight FSM       │ Auth session only             │
│ cookie codec/store + validation       │                              │
├──────────────────────────────────────┴───────────────────────────────┤
│ Browser persistence: versioned, chunked chat cookies                  │
│ No passwords, tokens, API keys, or server-side chat history           │
└──────────────────────────────────────────────────────────────────────┘
                         │                         │
                         │ POST /ask               │ auth protocol
                         ▼                         ▼
┌──────────────────────────────────┐   ┌──────────────────────────────┐
│ FastAPI + LangGraph agent        │   │ Convex Auth deployment         │
│ synchronous answer + thread_id   │   │ password auth/session storage  │
│ SQLite checkpointer by thread_id │   │ user/auth tables only          │
└──────────────────────────────────┘   └──────────────────────────────┘
```

The FastAPI contract is factual and narrow: `POST /ask` accepts `{ question: string, thread_id?: string }` and returns `{ answer: string, thread_id: string }`. The backend creates a UUID when `thread_id` is omitted, calls the long-running agent synchronously, and returns HTTP 500 with a generic detail on failure. The frontend should preserve the returned thread ID in the current chat and send it on later turns.

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `AppShell` / router | Mount providers, route landing/auth/chat, and enforce protected chat access | `BrowserRouter`, route elements, `ConvexAuthProvider` near the root |
| Auth boundary | Sign up, sign in, sign out, loading state, protected-route decision | `useAuthActions`, `useConvexAuth`, Convex Auth Password provider |
| Chat workspace | Display the active conversation, composer, assistant Markdown, history controls, and waiting state | Feature components plus local/context state; no direct cookie parsing in visual components |
| Chat controller | Orchestrate submit, one active request per conversation, success/failure/recovery transitions | Reducer or explicit state machine around one `fetch` and `AbortController` |
| API client | Serialize the exact `AskRequest`, call `/ask`, check status, parse the exact response | Native `fetch`; configurable `VITE_API_BASE_URL` or Vite `/api` proxy |
| Cookie repository | Load, validate, migrate, chunk, write, prune, and delete chat envelopes | `js-cookie` plus a custom versioned codec; Zod validation before use |
| Chat domain model | Define conversations, messages, thread IDs, timestamps, titles, and in-flight metadata | Pure TypeScript types and pure update functions |
| Waiting room | Communicate elapsed waiting honestly while request remains active | Time-based message rotation; no fake percentage or agent-progress claims |
| 2048 module | Run the playable waiting-room game independently of planning state | Pure reducer, input adapter, and presentational board; no game engine |
| Markdown renderer | Render untrusted AI answer text as safe readable content | `react-markdown` + `remark-gfm`; do not enable `rehype-raw` |
| FastAPI backend | Execute the actual agent and preserve multi-turn context | Existing `/ask` endpoint and LangGraph checkpointer; frontend does not rewrite it |
| Convex deployment | Authenticate users and maintain auth/session data | `@convex-dev/auth`; never write conversation history here |

## Recommended Project Structure

```
frontend/
├── convex/
│   ├── auth.ts              # Convex Auth server configuration
│   ├── auth.config.ts       # Auth provider/JWT configuration
│   ├── http.ts              # Convex Auth HTTP routes
│   └── schema.ts            # authTables; no chat-history tables
├── src/
│   ├── app/
│   │   ├── App.tsx          # provider composition and route tree
│   │   ├── routes.tsx       # landing/auth/chat route definitions
│   │   └── ProtectedRoute.tsx
│   ├── features/
│   │   ├── landing/         # marketing/agent explanation page
│   │   ├── auth/            # sign-up/sign-in forms and auth copy
│   │   ├── chat/            # workspace, composer, messages, chat switcher
│   │   ├── waiting/          # elapsed-time status and waiting shell
│   │   └── game2048/         # reducer, board, controls, and tests
│   ├── components/
│   │   ├── layout/           # app frame, navigation, responsive shell
│   │   └── ui/               # accessible bespoke primitives
│   ├── lib/
│   │   ├── api/askClient.ts  # FastAPI boundary and response parsing
│   │   ├── chat/             # domain types, reducer, request FSM
│   │   ├── persistence/      # cookie envelope, chunking, retention
│   │   ├── markdown.tsx      # safe renderer configuration
│   │   └── env.ts            # validated public Vite configuration
│   ├── styles/               # tokens, typography, global CSS
│   └── main.tsx              # Vite entry point and root providers
├── tests/
│   ├── cookieCodec.test.ts
│   ├── chatStateMachine.test.ts
│   └── game2048.test.ts
├── vite.config.ts
└── .env.local                # VITE_CONVEX_URL and VITE_API_BASE_URL only
```

### Structure Rationale

- **`features/`:** Keeps user-facing vertical slices together so chat, auth, waiting, and game can evolve without a global component dump.
- **`lib/api/`:** Makes the FastAPI contract testable independently of React and prevents components from inventing request fields.
- **`lib/persistence/`:** Centralizes the risky cookie boundary. Components receive typed state and actions rather than manipulating cookie names or JSON.
- **`lib/chat/`:** Keeps the long-running request lifecycle explicit and testable without a browser or network.
- **`features/game2048/`:** Isolates the game from chat state so game moves cannot mutate conversations or accidentally become fake progress.
- **`convex/`:** Remains a separate server boundary for auth. It must not become a second source of truth for browser-local chats.

## Architectural Patterns

### Pattern 1: Thin SPA shell with explicit service boundaries

**What:** Route components render features and invoke typed services. The API client, cookie repository, and Convex provider are the only integration boundaries. UI components do not call `fetch`, `Cookies.get`, or Convex auth actions indirectly through arbitrary prop chains.

**When to use:** This is the default pattern for every Waynora route, especially the protected chat route.

**Trade-offs:** A few small service modules add indirection, but they prevent backend-contract drift and make cookie/auth mistakes visible. A global state library is unnecessary for the current scope: auth state comes from Convex, persistent chat state comes from cookies, and request/game state is local to their features.

**Example:**

```typescript
export async function askWaynora(input: AskRequest): Promise<AskResponse> {
  const response = await fetch(`${apiBaseUrl}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: input.signal,
  });

  if (!response.ok) throw new AskError(response.status);
  return askResponseSchema.parse(await response.json());
}
```

The implementation may use a separate `RequestInit` argument instead of putting `signal` into the wire schema; the wire body must remain only `question` and optional `thread_id`.

### Pattern 2: Explicit single-flight request state machine

**What:** Each conversation has at most one active planning request. The controller transitions through explicit states rather than inferring lifecycle from a button's render state:

```
idle/draft
   │ submit valid question
   ▼
submitting ───────────────► failed (validation/network/backend error)
   │ request accepted
   ▼
running ──────────────────► succeeded (answer + thread_id)
   │ browser abort/unload/error
   ▼
interrupted/recoverable ──► idle after explicit user choice
```

`submitting` and `running` both disable the composer for that conversation. A controller-level `inFlight` guard is required in addition to disabled UI, because keyboard events, double clicks, React re-renders, or multiple component instances can otherwise start duplicate five-to-fifteen-minute runs. An `AbortController` may stop waiting for the browser response, but it does not cancel server-side agent execution; retry copy must state that a retry can start another expensive run.

**When to use:** Every `POST /ask` call. Do not add polling, fake job IDs, streaming, or progress events because the backend exposes none of them.

**Trade-offs:** The state machine is more deliberate than a single `isLoading` boolean, but it makes error recovery, reload detection, and duplicate prevention testable. It cannot guarantee cancellation of the backend computation, so the UI must distinguish local interruption from server cancellation.

**Example:**

```typescript
type PlanningState =
  | { kind: "idle" }
  | { kind: "submitting"; requestId: string }
  | { kind: "running"; requestId: string; startedAt: number }
  | { kind: "succeeded"; requestId: string }
  | { kind: "failed"; requestId: string; message: string }
  | { kind: "interrupted"; requestId: string; startedAt: number };

// Only the controller that owns the active request may dispatch its result.
// A requestId prevents a late response from an aborted/old fetch overwriting
// a newer conversation state.
```

### Pattern 3: Versioned, validated, chunked cookie repository

**What:** Persist a compact envelope rather than individual UI objects. A recommended logical envelope is:

```typescript
type ChatEnvelope = {
  version: 1;
  updatedAt: number;
  activeChatId: string | null;
  chats: ChatRecord[];
};

type ChatRecord = {
  id: string;
  title: string;
  threadId: string | null;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  inFlight?: {
    question: string;
    threadId: string | null;
    startedAt: number;
  };
};
```

Serialize and encode the envelope, split it into bounded chunks such as `waynora.chats.00`, `waynora.chats.01`, and a small metadata cookie containing version/count. Use a conservative per-cookie budget below the nominal ~4 KB limit because attributes, encoding overhead, and browser differences consume space. Write the complete new set before deleting obsolete chunks where practical; on any overflow, retain the last valid persisted envelope and return a visible overflow result rather than silently truncating messages.

Load is all-or-nothing: read metadata, require every expected chunk, reassemble, decode, parse JSON, validate with Zod, and only then expose the data to React. Invalid, incomplete, unknown-version, or corrupt data should be quarantined/deleted and replaced by a fresh empty store with a non-blocking recovery notice. Never render unchecked cookie JSON.

Retention is part of the repository contract, not a UI afterthought. Enforce a hard cap on chat count, message count, and chunk count (the stack research suggests starting around 10 chats, 50 total messages, and no more than three ~3.8 KB chunks). Prefer dropping the oldest low-value history according to an explicit policy and tell the user which history was removed. Do not silently grow cookies: browsers send same-origin cookies on requests, so oversized chat cookies create request overhead and can hit browser/server limits.

**When to use:** Every chat create, rename, delete, message append, active-chat switch, and submit-state persistence.

**Trade-offs:** Cookies satisfy the product constraint and survive reloads without a database, but they have low capacity, are browser-local rather than account-synchronized, and are sent with same-origin requests. The repository must therefore be aggressively bounded and must not store secrets or credentials.

### Pattern 4: Auth boundary separate from local chat identity

**What:** `ConvexAuthProvider` supplies the authenticated session and `ProtectedRoute` gates the chat route. Convex stores/serves auth data; the browser cookie repository stores chat data. A chat's backend `threadId` is an agent/checkpointer identifier, not a Convex user ID and not proof of authorization.

**When to use:** Sign-up, sign-in, sign-out, session restoration, and route protection.

**Trade-offs:** The split is faithful to the requirement and avoids putting chat history into Convex, but local chats are tied to the browser profile rather than automatically available on another device. The UI should describe this accurately and offer explicit chat deletion/clear controls. Do not silently clear local chats on logout unless product requirements later make that the chosen privacy policy.

**Example:**

```tsx
<ConvexReactClientProvider client={convexClient}>
  <ConvexAuthProvider client={convexClient}>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </ConvexAuthProvider>
</ConvexReactClientProvider>
```

The exact provider nesting should follow the installed Convex Auth API, but the boundary remains the same: auth session state is provided by Convex and is not copied into chat cookies.

## Data Flow

### Request Flow

```
[User enters question]
        │
        ▼
[ChatComposer validates non-empty input]
        │ dispatch SUBMIT; append optimistic user message
        ▼
[ChatController] ── checks one active request per chat
        │                 │
        │                 ├── persist question + inFlight marker
        │                 └── start elapsed-time clock / waiting shell
        ▼
[askClient.fetch] ── POST { question, thread_id? }
        │
        ▼
[FastAPI /ask] ── thread_id or UUID → LangGraph agent → AskResponse
        │
        ├── HTTP 500 ──► [FAILED] preserve composer/history; show retry warning
        │
        ▼
[validate {answer, thread_id}]
        │
        ▼
[ChatController SUCCESS]
  append assistant message; save returned threadId; clear inFlight marker
        │
        ▼
[CookieRepository.write] ── bounded envelope → chunk cookies
        │
        ▼
[ChatView renders Markdown answer]
```

The optimistic user message should be recorded before the network call, but it must remain distinguishable from an assistant answer and must not be duplicated if a late response is discarded. On error, preserve both the input and existing conversation; do not replace the conversation with a fabricated fallback plan.

### State Management

```
[ConvexAuthProvider]
       │ auth/session subscription
       ▼
[ProtectedRoute] ───────────────► landing/auth/chat route access

[CookieRepository]
       │ load + Zod parse
       ▼
[ChatStore/controller] ◄──── actions: create/switch/rename/delete/submit
       │                         │
       │                         ├── [askClient] → running FSM
       │                         └── [CookieRepository.write]
       ▼
[ChatWorkspace + WaitingShell]

[2048 reducer] ◄── keyboard/pointer actions
       │
       ▼
[2048 board]       (no writes to chat state; no progress semantics)
```

Keep elapsed time in a monotonic runtime value or `Date.now()` baseline, not a render count. Waiting copy can rotate at defined elapsed-time intervals, but the copy must only say that the request is still running or that the user can play while they wait. It must not claim that a particular specialist agent has completed.

### Key Data Flows

1. **Authentication:** Browser submits credentials through Convex Auth actions; Convex manages server-side credential handling and session tokens; the provider exposes auth state to route guards. The chat cookie store does not contain credentials or auth tokens.
2. **New conversation:** User creates a local chat record with a generated local ID and no backend thread ID. The first successful response supplies the backend `threadId`, which is stored on that record for subsequent turns.
3. **Continuation:** Composer sends the same chat's `threadId` with the new question. The backend's LangGraph checkpointer supplies conversation memory; the frontend does not reconstruct or send the full transcript to `/ask`.
4. **Reload/recovery:** On app startup, parse the cookie envelope. If a chat has an in-flight marker, show an honest interrupted/recovery state. Do not automatically replay the question, because the original server request may still be executing and replaying can create a second expensive run.
5. **Chat management:** Create, switch, rename, and delete operate on the local envelope and then persist through one repository API. A failed cookie write must surface a capacity notice and preserve in-memory state rather than pretending persistence succeeded.
6. **Answer presentation:** Treat `answer` as untrusted Markdown. Render with `react-markdown` and GFM, keep raw HTML disabled, and map tables/lists/links to accessible styled components.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Keep the SPA and single FastAPI endpoint. Focus on correctness: cookie codec tests, single-flight protection, auth route guards, timeout/reload messaging, and accessible responsive UI. The backend's SQLite checkpointer is acceptable for the initial deployment only if its operational limits are understood. |
| 1k-100k users | First measure backend agent latency, concurrency, SQLite checkpointer contention, and FastAPI error rates. Add backend job execution/queueing only as a deliberate contract change; do not fake it in the frontend. If chat history must become cross-device, change the product/storage requirement explicitly rather than quietly moving it to Convex. |
| 100k+ users | Separate public SPA hosting from API/agent workers, introduce an explicitly designed durable job/status protocol, and use a scalable checkpointer/store. Version the frontend API client and migrate away from cookie transcripts if product demand requires account-synced history. |

### Scaling Priorities

1. **First bottleneck:** Agent runtime and backend concurrency, not React rendering. A synchronous 5–15 minute request occupies server resources and can be duplicated by careless retry behavior. Instrument the backend and introduce a real job protocol before adding client polling.
2. **Second bottleneck:** Cookie payload/request overhead and browser limits. Keep envelopes bounded and measure actual serialized sizes; move to server-side history only through an explicit requirements decision.
3. **Third bottleneck:** Auth/session and deployment configuration. Keep `VITE_*` values public and environment-specific; all secrets and Convex auth key material remain on their respective servers.

## Anti-Patterns

### Anti-Pattern 1: Treating `/ask` as a normal short request

**What people do:** Use a five- or thirty-second timeout, allow retry on every network error, or render a progress bar with invented percentage/agent milestones.

**Why it's wrong:** The actual agent is synchronous and can take roughly 5–15 minutes. Browser abort does not cancel server execution, and retries can launch duplicate expensive runs. Fake progress violates the product's honesty requirement.

**Do this instead:** Use one guarded fetch with a long-running UI, elapsed-time messaging, an explicit retry warning, persisted in-flight metadata, and a request ID that prevents stale responses from mutating current state.

### Anti-Pattern 2: Putting chat history in Convex or auth cookies

**What people do:** Store conversations in Convex because it is already installed, or mix auth/session data with the chat persistence envelope.

**Why it's wrong:** Server-side chat storage is explicitly out of scope, and auth cookies/tokens have different security and lifecycle requirements. Mixing boundaries makes logout, privacy, and migration behavior ambiguous.

**Do this instead:** Keep Convex responsible for authentication only and keep local chat data in a versioned, bounded, validated chat-cookie repository.

### Anti-Pattern 3: Handing raw cookie JSON or AI Markdown to the DOM

**What people do:** Parse cookie values with unchecked `JSON.parse`, use `dangerouslySetInnerHTML`, enable `rehype-raw`, or trust an AI-provided link/protocol.

**Why it's wrong:** Corrupt/tampered browser data can crash the app or create invalid state; raw HTML and unsafe URL protocols create XSS risk.

**Do this instead:** Validate the complete envelope with Zod, discard/quarantine invalid versions, and render answers with `react-markdown` + `remark-gfm` while leaving raw HTML disabled.

### Anti-Pattern 4: Relying on a disabled button as the single-flight guard

**What people do:** Set `disabled={isLoading}` but leave submission logic unguarded.

**Why it's wrong:** Double events, keyboard submission, re-renders, or multiple component paths can still create two requests. A late first response can overwrite the second request's state.

**Do this instead:** Enforce one active request in the controller/reducer, associate results with a request ID, and test duplicate submit attempts at the service level.

### Anti-Pattern 5: Coupling 2048 to planning progress or chat persistence

**What people do:** Make game score a proxy for agent progress, reset the game when chat state changes, or serialize every game move into chat cookies.

**Why it's wrong:** It invents backend state and increases cookie payload without product value. It also makes the waiting UI fragile.

**Do this instead:** Keep a self-contained 2048 reducer and presentational board inside the waiting shell. Reset only on an intentional new game/session policy; do not persist it with chat unless a later requirement justifies that cost.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| FastAPI `/ask` | Native `fetch` POST from `askClient`; `VITE_API_BASE_URL` in production or Vite `/api` proxy in development | Exact Pydantic contract; synchronous; no streaming, job ID, polling, or cancellation; backend currently allows broad CORS without credentials |
| Convex Auth | `ConvexReactClient` + `ConvexAuthProvider`; Password provider actions and session hooks | Auth boundary only; follow the pinned `@convex-dev/auth` setup and keep auth secrets/server keys out of Vite variables |
| Browser cookie jar | `js-cookie` through the repository adapter | SameSite attribute required and `Secure` in HTTPS production; cookies are not a secure secret store and should contain no credentials |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `ChatComposer ↔ ChatController` | Typed actions/events | Controller owns duplicate prevention and input-to-request transition; composer owns editing and accessible submission affordances |
| `ChatController ↔ askClient` | Promise + request ID + `AbortSignal` | Client serializes only `{question, thread_id?}` and validates `{answer, thread_id}`; abort is local, not server cancellation |
| `ChatController ↔ CookieRepository` | Typed load/write results | Persist optimistic message and in-flight marker before request; clear marker and persist answer on success; surface overflow/write failure |
| `ChatController ↔ WaitingShell` | Read-only planning state and `startedAt` | Waiting shell communicates truth; it cannot dispatch fake agent milestones |
| `ChatWorkspace ↔ 2048 module` | Separate props/actions | Game has no authority over planning state, chat records, or cookie persistence |
| `ProtectedRoute ↔ Convex Auth` | Auth hook/provider state | Route guard handles loading/authenticated/unauthenticated; no manually copied auth token in chat state |
| React views ↔ Markdown renderer | Typed answer string | Treat answer as untrusted; safe component mapping and accessible tables/lists |

## Recommended Build Order

1. **Foundation and contract types:** Convert the skeleton to Vite + React + TypeScript, configure `VITE_CONVEX_URL`/`VITE_API_BASE_URL`, establish routing, and define the exact `/ask` request/response schemas.
2. **Convex authentication boundary:** Wire Convex Auth, `authTables`, provider/session hooks, sign-up/sign-in/logout, loading states, and the protected chat route. Verify that no chat data enters Convex.
3. **Pure persistence primitives:** Implement and test the versioned envelope, Zod validation, encoding/chunking, all-or-nothing reads, size limits, retention policy, stale-chunk cleanup, and visible overflow behavior before building chat controls on top.
4. **API client and request state machine:** Implement exact `POST /ask` serialization, response/error parsing, request IDs, single-flight guard, long-running fetch behavior, in-flight marker persistence, and interrupted/retry semantics.
5. **Vertical chat slice:** Build one protected chat with composer → optimistic user message → real backend answer → safe Markdown rendering → persisted thread continuation. This proves the core value before visual polish.
6. **Chat management and resilience:** Add create/switch/rename/delete, auto-title rules, reload recovery, backend/network error handling, and cookie-capacity notifications without losing user input/history.
7. **Waiting experience and 2048:** Add elapsed-time honest copy and the isolated reducer/UI game. Test keyboard, touch/pointer, focus, reduced motion, and that game state cannot affect the request FSM.
8. **Landing page and responsive polish:** Implement the premium travel/editorial shell, agent explanation, GitHub attribution, responsive layouts, accessibility, and non-essential motion after functional boundaries are stable.
9. **Integration verification:** Test multi-turn `thread_id` continuity against FastAPI, auth-protected navigation, cookie round trips/overflow/corruption, duplicate submission, long-wait recovery, safe Markdown, and production build configuration.

This order front-loads the irreversible boundaries—auth ownership, backend contract, cookie format, and long-running lifecycle—before presentation work. It also makes the first working vertical slice honest and testable rather than building a polished shell around mocked plans.

## Sources

- `.planning/PROJECT.md` — product boundaries, requirements, constraints, and explicit out-of-scope decisions; HIGH for project intent.
- `.planning/research/STACK.md` — recommended Vite/React/Convex/cookie/Markdown/testing stack and verified compatibility; HIGH for selected stack.
- `../main.py` — actual FastAPI `/ask` implementation, synchronous execution, UUID thread creation, CORS behavior, and generic HTTP 500 handling; HIGH.
- `../app/api/model.py` — actual Pydantic `AskRequest` and `AskResponse` schema; HIGH.
- https://docs.convex.dev/auth — official Convex Auth boundary and client-app guidance; HIGH as recorded in STACK research.
- https://labs.convex.dev/auth/setup — official provider/setup patterns and session handling; HIGH as recorded in STACK research.
- https://github.com/remarkjs/react-markdown — safe Markdown rendering and URL/raw-HTML behavior; HIGH as recorded in STACK research.

---
*Architecture research for: AI-chat travel planning web frontend (Waynora)*
*Researched: 2026-10-09*
