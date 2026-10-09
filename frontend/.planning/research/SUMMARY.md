# Project Research Summary

**Project:** Waynora
**Domain:** AI-powered multi-agent travel-planning chat SPA
**Researched:** 2026-10-09
**Confidence:** HIGH overall, with MEDIUM uncertainty around deployment timeouts and browser cookie capacity

## Executive Summary

Waynora is a client-heavy travel-planning web app whose core experience is an authenticated chat request that can take 5–15 minutes to complete. The backend contract is deliberately narrow and synchronous: the browser sends `{ question, thread_id? }` to FastAPI and receives `{ answer, thread_id }`. Experts should therefore build this as a thin React/Vite SPA with explicit service boundaries, not as a streaming chat, background-job UI, or server-rendered application. Convex should handle authentication only; browser cookies should hold bounded, validated local chat history; the 2048 game should remain an isolated waiting-room feature.

The recommended implementation is React 19 + Vite 8 + TypeScript + Tailwind 4, React Router, pinned Convex Auth Password provider, native `fetch`, Zod, `react-markdown`/`remark-gfm`, and a custom versioned/chunked cookie repository. Build the irreversible contracts first: exact API schemas, auth boundary, cookie format, safe Markdown pipeline, and a single-flight request state machine. Then prove one real end-to-end chat slice before investing in the premium editorial landing page.

The dominant risks are operational and trust-related rather than visual: proxy timeouts can terminate a still-running request, retries can duplicate expensive agent runs, cookies can overflow or corrupt, and fabricated progress would misrepresent the backend. Mitigate these with a deployment-path timeout spike, persisted in-flight state, explicit retry confirmation, request IDs/single-flight guards, all-or-nothing Zod-validated cookie snapshots, safe Markdown rendering, and elapsed-time copy with no fake percentages or per-agent completion claims.

## Key Findings

### Recommended Stack

Use a minimal ESM React SPA. React 19.3.0, Vite 8.3.4, React Router 8.4.0, Tailwind CSS 4.3.3, and TypeScript 7.0.2 fit the existing Node/Windows environment and the officially documented Convex Auth React/Vite path. Keep the existing Convex 1.46.0 dependency, pin beta `@convex-dev/auth` at 0.0.96 and `@auth/core` at 0.41.1, and downgrade TypeScript to 5.9.x only if tooling friction appears.

**Core technologies:**
- **React + Vite + TypeScript:** client-only presentation, fast development, typed domain/service code, and no unnecessary SSR runtime.
- **Convex Auth Password provider:** server-side email/password handling, session persistence, and protected routes; Convex must not store chats.
- **Tailwind CSS 4:** CSS-first design tokens for the premium editorial travel system without adopting generic dashboard primitives.
- **Native `fetch` + AbortController:** one exact synchronous `/ask` integration with no polling or invented job protocol.
- **Zod + custom cookie codec:** runtime validation for API responses and versioned, chunked, bounded browser chat persistence.
- **react-markdown + remark-gfm (raw HTML disabled):** safe rendering of untrusted itinerary Markdown, including tables and lists.
- **Vitest:** pure-logic tests for cookie chunking, chat/request state, 2048 rules, and Markdown security fixtures.

Use `VITE_API_BASE_URL` and `VITE_CONVEX_URL`; all `VITE_*` values are public. Self-host the chosen display/body fonts if the design phase retains the editorial pairing. Motion and icon libraries are optional polish, not architectural dependencies.

### Expected Features

The v1 scope in `PROJECT.md` is already aligned with the table stakes. Launch quality depends on completing the real flow, not expanding feature count.

**Must have (table stakes):**
- Premium landing page with clear value proposition, honest 5–15 minute expectation, agent explanation, CTAs, and GitHub attribution.
- Convex email/password signup, login, logout, session restoration, validation, loading/error states, and protected chat routing.
- Real chat with multiline composer, predictable Enter/Shift+Enter behavior, distinct user/assistant messages, safe Markdown tables/lists, and empty states.
- Exact `/ask` integration with optimistic user message, thread continuation, duplicate prevention, long-running waiting state, and response persistence.
- Friendly error taxonomy that preserves the submitted prompt and conversation, distinguishes timeout/network/backend/malformed failures, and never auto-retries.
- Versioned cookie chat history with create/switch/rename/delete, first-message auto-titles, hard size/retention limits, visible overflow/recovery notices, and no secrets.
- Fully functional isolated 2048 game with keyboard, pointer/swipe, score, win/game-over, restart, and accessibility support.
- Responsive, keyboard-accessible landing/auth/chat/game surfaces and production metadata.

**Should have (competitive):**
- Honest elapsed-time waiting narrative with rotating time-banded messages and no fabricated progress.
- Playable 2048 during the wait, a distinctive niche differentiator among surveyed travel and chat products.
- Truthful multi-agent transparency (Destination Planner, Transport Agent, AccommodationWeather Agent, coordinated by the main travel agent).
- Device-local chat privacy positioning, with its browser-bound/offline tradeoff documented.

**Defer (v1.x/v2+):**
- v1.x: message copy, persisted 2048 best score, print/export view, password reset, dark mode, and chat search.
- v2+: regenerate/edit, OAuth, i18n, background jobs/notifications, shareable links, maps, calendar sync, booking, and live pricing. These require backend or product-contract changes.

**Anti-features:** fake progress bars, fabricated agent statuses or plans, auto-retry loops, Convex chat storage, streaming/polling/job IDs the backend does not provide, fake testimonials, and generic SaaS visual patterns.

### Architecture Approach

Use explicit boundaries: route/auth shell, chat feature, waiting experience, isolated 2048 module, typed `/ask` client, chat controller/request FSM, cookie repository, safe Markdown renderer, and Convex Auth provider. React views should not directly fetch, parse cookies, or own auth protocol details. The controller owns one active request per conversation and correlates late results with a request ID. The cookie repository owns serialization, chunking, schema validation, migration, retention, and write failure reporting. The backend thread ID is an agent/checkpointer identifier, not a user identity.

**Major components:**
1. **App shell and routes** — compose Convex providers, landing/auth/chat routes, loading boundary, and protected-route redirect.
2. **Auth boundary** — Password provider, session state, signup/login/logout, and production auth configuration.
3. **Chat domain/controller** — typed conversations/messages, auto titles, optimistic updates, single-flight FSM, request IDs, retry/recovery semantics.
4. **API client** — exact request/response schemas, status parsing, configurable base URL, and no invented streaming/progress contract.
5. **Cookie repository** — versioned bounded envelope, chunk metadata, all-or-nothing reads/writes, Zod validation, migration, pruning, and notices.
6. **Waiting shell** — elapsed-time copy, stable `startedAt`, interruption/reload messaging, and no claims of backend progress.
7. **2048 feature** — pure reducer, input adapter, accessible board and controls; no authority over chat state or persistence.
8. **Markdown renderer/design system** — safe component mapping, accessible tables/links, and bespoke editorial travel styling.

### Critical Pitfalls

1. **Normal-request assumptions for `/ask`:** a 60-second browser/proxy timeout can fail while the server keeps working. Validate every deployment hop with a deliberately delayed request and do not enable unsafe POST retries.
2. **Duplicate expensive runs:** disabled buttons are insufficient. Enforce a controller-level single-flight guard, stable request IDs, persisted in-flight metadata, and deliberate retry confirmation; never auto-retry or replay after reload.
3. **Cookie overflow/corruption:** cookies are not a database. Use conservative chunk budgets and hard chat/message caps, write complete generations, validate every field, reject partial snapshots, and notify users instead of silently truncating.
4. **Untrusted Markdown and cookie data:** never use `dangerouslySetInnerHTML` or `rehype-raw`; preserve safe URL handling, validate cookie envelopes with Zod, and test hostile HTML/protocols.
5. **Lifecycle and input interference:** derive wait time from a stable timestamp, clean timers/listeners, ignore stale responses after chat changes, and scope 2048 keyboard/touch handling so it cannot steal textarea input or page scroll.
6. **Production auth/CORS drift:** verify Convex schema/config/http/JWT setup and explicit FastAPI origins/preflight against a production-like origin; `VITE_*` values cannot contain secrets.

## Implications for Roadmap

Based on the combined research, use five sequential phases. The first four can be implemented with focused vertical boundaries; the final phase proves deployment and quality rather than adding speculative features.

### Phase 1: Foundation, Contracts, and Auth Boundary
**Rationale:** Backend/API, auth, rendering, and deployment assumptions are irreversible contracts. Establish them before UI polish or chat state.
**Delivers:** Vite/React/TypeScript setup, Tailwind tokens baseline, routing, environment validation, exact `/ask` types, safe Markdown renderer, Convex Auth wiring, protected route, and signup/login/logout/session flows.
**Addresses:** Landing/auth prerequisites, protected chat, safe Markdown, responsive shell foundation.
**Avoids:** Wrong fields, `NEXT_PUBLIC_*` misconfiguration, fake auth, raw HTML/XSS, missing production Convex wiring, and unverified long-request deployment assumptions.
**Research flag:** **Needs targeted research/spike** for the chosen production host/proxy timeout, CORS, and Convex Auth production variables. Standard React/Vite/Markdown patterns can skip additional research.

### Phase 2: Persistence Codec and Chat Domain Primitives
**Rationale:** Cookie format and retention policy are risky, test-heavy boundaries that must exist before sidebar CRUD or optimistic chat updates.
**Delivers:** Typed chat envelope, Zod schemas, encoding/chunking, generation metadata, all-or-nothing load, migration/recovery, hard caps, pruning policy, write failure result, and pure chat update functions.
**Addresses:** Cookie chat persistence, create/switch/rename/delete foundations, auto-title data model, reload recovery.
**Uses:** `js-cookie`, Zod, Vitest, and the `lib/persistence`/`lib/chat` separation.
**Avoids:** Silent truncation, partial writes, corrupt JSON crashes, unbounded cookie headers, credential leakage, and chat data entering Convex.
**Research flag:** **Standard patterns with implementation validation required.** Deeper research is unnecessary, but real browser capacity tests are mandatory because exact quotas vary.

### Phase 3: Real Chat Vertical Slice and Long-Request Lifecycle
**Rationale:** This is the core value and the highest-cost failure surface. Prove one protected conversation against the real FastAPI backend before building broad management or marketing polish.
**Delivers:** Composer, optimistic user messages, exact `POST /ask`, thread continuation, controller FSM (`idle/submitting/running/succeeded/failed/interrupted`), single-flight/request IDs, elapsed waiting shell, timeout/network/backend/malformed error taxonomy, preserved input/history, explicit retry, safe assistant rendering, and in-flight cookie persistence.
**Addresses:** Real `/ask`, long waits, honest waiting messages, friendly errors, no fabricated plans/progress, and multi-turn conversations.
**Avoids:** Duplicate agent runs, stale responses, fake progress, short timeouts, automatic retries, lost prompts, and treating client abort as server cancellation.
**Research flag:** **Needs research/verification** for the actual production request path and proxy behavior. The frontend request FSM and React patterns are documented; the deployment timeout spike is not optional.

### Phase 4: Chat Management, Waiting Game, and Responsive Experience
**Rationale:** Once the request lifecycle is real, add the controls and differentiators that depend on it while keeping game state independent.
**Delivers:** Sidebar CRUD and auto-titles, empty/disabled states, reload ambiguity UI, isolated 2048 reducer/UI with keyboard/pointer/swipe controls, accessible waiting-room layout, mobile behavior, focus/reduced-motion handling, and polished chat/responsive surfaces.
**Addresses:** Full v1 chat management, 2048 differentiator, responsive/accessibility requirements, and the premium waiting experience.
**Implements:** `features/chat`, `features/waiting`, and `features/game2048` boundaries.
**Avoids:** Game stealing textarea/page input, timer leaks, game-as-progress claims, and coupling game state to cookies/request state.
**Research flag:** **Mostly standard;** skip broad research. Plan explicit cross-device accessibility testing for touch, pointer cancellation, keyboard focus, and mobile scroll.

### Phase 5: Editorial Landing, Deployment Hardening, and Verification
**Rationale:** Visual polish should sit on stable functional contracts, and production verification must cover the failure modes that local development hides.
**Delivers:** Distinctive editorial travel landing page, truthful agent architecture copy, CTAs/GitHub attribution, metadata, motion only where justified, production CORS/auth configuration, delayed-path test, security/adversarial Markdown tests, cookie boundary tests, long-wait/reload tests, and verification of the documented workflows.
**Addresses:** Landing-page requirements, responsive/a11y completion, production readiness, and all P1 polish.
**Uses:** Mandatory `design-taste-frontend` and `high-end-visual-design` skills, plus optional motion/font packages.
**Avoids:** Generic SaaS aesthetics, unverified claims, wildcard production CORS, and “looks done” failures.
**Research flag:** **Needs deployment-specific validation** rather than general research: select host, configure timeouts/origins, and test against a production-like URL.

### Phase Ordering Rationale

- Contracts precede components: exact FastAPI fields, Convex auth ownership, safe Markdown, and public environment variables prevent rework.
- Persistence precedes sidebar: CRUD cannot honestly promise durability until bounded cookie writes and corruption recovery work.
- The request FSM precedes waiting/game polish: waiting copy, retry semantics, timers, and 2048 hosting all depend on truthful request state.
- Real backend integration precedes landing claims: copy may only describe the actual three-agent architecture and synchronous behavior.
- Verification is a dedicated phase because localhost hides proxy timeouts, CORS, browser quotas, background-tab throttling, and production auth configuration.

### Recommended Build Order

1. Foundation/config, API schemas, route skeleton, and Markdown security contract.
2. Convex Auth and protected-route behavior.
3. Cookie codec, retention, migration, and pure domain tests.
4. Real `/ask` client plus single-flight request FSM and in-flight recovery.
5. One vertical chat conversation with thread continuation and safe response rendering.
6. Sidebar CRUD, auto titles, resilience, and capacity notices.
7. Honest waiting UX and isolated 2048 game.
8. Editorial landing/responsive/accessibility polish.
9. Production-path and adversarial integration verification.

## Decisions to Carry Forward

- Choose **React/Vite SPA**, not Next.js/SSR, unless SEO becomes a hard requirement.
- Keep **Convex auth-only** and **cookie-local chats**; do not quietly migrate storage to Convex.
- Use the real `/ask` contract and `thread_id`; do not invent streaming, job IDs, cancellation, polling, or progress events.
- Use a **versioned, validated, chunked, bounded cookie envelope** with visible overflow/recovery behavior.
- Use **native fetch** and a per-conversation single-flight controller; retries are explicit and may duplicate server work.
- Render AI output with **react-markdown + remark-gfm**, raw HTML disabled, and defense-in-depth sanitization if the pipeline expands.
- Build **2048 as pure reducer + UI**, entirely separate from chat persistence and request progress.
- Treat **honesty and editorial quality as product features**: no fake progress, fake plans, fake social proof, or generic SaaS template visuals.

## Risks and Mitigations

| Risk | Impact | Mitigation | Validation point |
|------|--------|------------|------------------|
| Proxy/ingress closes a 5–15 minute request | Core feature appears broken; server work may continue | Configure/read-test every hop, disable POST retries, preserve ambiguous in-flight state | Phases 1 and 5 |
| Duplicate runs after timeout/reload/double submit | Cost, load, duplicate answers | Single-flight guard, request IDs, persisted marker, explicit retry confirmation | Phase 3 |
| Cookie capacity or partial write | Lost plans and false persistence | Conservative chunks/caps, generation markers, all-or-nothing validation, user notices | Phase 2 and 5 |
| Auth/CORS production mismatch | Users cannot sign in or call backend | Pin Convex Auth, verify JWT/JWKS, explicit origins/preflight, production-like test | Phases 1 and 5 |
| XSS/unsafe external content | Security compromise | Safe Markdown defaults, no raw HTML sink, URL policy, hostile-content tests | Phases 1 and 5 |
| Timer/game lifecycle bugs | Misleading wait state and broken mobile/chat input | Stable timestamps, cleanup, stale-result guards, scoped pointer/keyboard handlers | Phase 4 |

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Versions and peer ranges were checked against npm; Convex Auth and Markdown behavior were checked against official documentation. Auth stability remains slightly lower because the package is beta. |
| Features | HIGH | v1 is anchored to `PROJECT.md`/`prompt.md`; multiple 2026 competitor and AI-wait UX sources agree on baseline expectations. The “no competitor embeds a game” claim is a useful but non-exhaustive absence finding. |
| Architecture | HIGH | FastAPI contract and project constraints are concrete; boundaries and data flow follow directly from the existing backend and explicit storage rules. Cookie quotas remain browser-dependent. |
| Pitfalls | HIGH | Browser, cookie, Markdown, CORS, Convex, and proxy guidance is supported by official documentation and the actual synchronous backend contract. Deployment-specific behavior is not yet tested. |

**Overall confidence:** HIGH for product direction and implementation boundaries; MEDIUM for production hosting behavior and exact cookie retention numbers.

### Gaps and Open Questions

- **Production host/proxy is undecided:** select it early and prove a delayed request survives the full path; document limits if the host cannot support 15 minutes.
- **Cookie quota policy needs target-browser evidence:** test encoded itinerary sizes, total domain limits, partial writes, and mobile Safari/Chromium behavior before fixing final caps.
- **Convex Auth beta behavior needs deployment verification:** confirm exact package setup, production JWT/JWKS variables, session reload, and logout semantics against the chosen deployment.
- **FastAPI CORS should be narrowed:** current `allow_origins=["*"]` is development-friendly but not a final production policy; decide whether credentials are required for the API.
- **Email verification/password reset are unresolved product choices:** defer both from v1 unless launch requirements change; password-only MVP needs a clear recovery policy.
- **Backend concurrency/SQLite checkpointer limits are not frontend-solvable:** measure latency and concurrent runs before scaling; a future job protocol is a deliberate backend/product change.

## Sources

### Primary (HIGH confidence)

- `.planning/PROJECT.md` — authoritative product goals, constraints, backend contract, and out-of-scope decisions.
- `main.py` and `app/api/model.py` — actual synchronous FastAPI `/ask` behavior and Pydantic request/response schemas.
- `.planning/research/STACK.md` — npm-verified versions, Convex Auth setup, Markdown security behavior, and stack alternatives.
- `.planning/research/ARCHITECTURE.md` — component boundaries, data flow, persistence model, scaling guidance, and build order.
- `.planning/research/PITFALLS.md` — risk analysis grounded in MDN, NGINX, FastAPI, Convex, and react-markdown documentation.
- Convex Auth official docs/labs setup — Password provider, auth tables, provider wiring, production variables, and client session model.
- react-markdown README — safe defaults, URL protocol handling, raw HTML behavior, and sanitization guidance.
- MDN Cookies and AbortController; NGINX `proxy_read_timeout`; FastAPI CORS — browser limits, client-abort semantics, proxy timeout behavior, and origin/preflight rules.

### Secondary (MEDIUM confidence)

- `.planning/research/FEATURES.md` — 2026 AI travel-planner comparisons, chat conventions, and long-running AI UX research synthesized against the fixed v1 scope.
- Long-running AI UX guidance and Deep Research patterns — honest ranges, elapsed status, and the requirement for a real job API before background notifications.

### Tertiary (LOW confidence / validate)

- Survey-based absence claim that no reviewed competitor embeds a game in the wait — promising positioning, but not exhaustive market proof.

---
*Research completed: 2026-10-09*
*Ready for roadmap: yes*
