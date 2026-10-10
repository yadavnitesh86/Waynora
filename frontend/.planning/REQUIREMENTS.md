# Requirements: Waynora

**Defined:** 2026-10-09  
**Core Value:** A user can submit a trip request, wait through the real 5–15 minute agent generation, and receive the actual AI-generated travel plan without fabricated progress or results.

## v1 Requirements

Requirements for the initial release. Each maps to exactly one roadmap phase.

### Foundation and Design

- [x] **FOUND-01**: The application runs as a typed React/Vite SPA using the selected project stack and existing Convex dependency.
- [x] **FOUND-02**: The application exposes a configurable public backend base URL and does not hardcode production endpoints or secrets.
- [x] **FOUND-03**: The application has shared responsive design tokens and reusable layout primitives for landing, auth, chat, and waiting surfaces.
- [ ] **FOUND-04**: The UI applies the installed frontend design skills, especially `design-taste-frontend` and `high-end-visual-design`, and avoids generic SaaS visual patterns.
- [x] **FOUND-05**: The application provides accessible route structure, document metadata, page titles, focus states, and keyboard navigation foundations.

### Authentication

- [x] **AUTH-01**: A visitor can create an account using the configured Convex email/password authentication flow.
- [x] **AUTH-02**: A registered user can log in with validation, loading state, and friendly invalid-credential feedback.
- [x] **AUTH-03**: A logged-in user can log out and the UI returns to an unauthenticated state.
- [x] **AUTH-04**: An authenticated session persists across browser refresh using the supported Convex session mechanism.
- [x] **AUTH-05**: Unauthenticated visitors cannot access the chat route and receive a clear path to sign up or log in.
- [x] **AUTH-06**: Authentication configuration does not expose passwords, deployment credentials, API secrets, or private environment values to browser code.

### Landing Experience

- [ ] **LAND-01**: The landing page clearly communicates Waynora's AI-powered travel-planning value and includes a primary “Plan my trip” CTA.
- [ ] **LAND-02**: The landing page includes a secondary CTA explaining how Waynora works and a clear 5–15 minute generation expectation.
- [ ] **LAND-03**: The landing page accurately describes Destination Planner, Transport Agent, and AccommodationWeather Agent as specialists coordinated by the main travel agent.
- [ ] **LAND-04**: The landing page explains what users receive in a generated plan, the planning process, and why generation can take time.
- [ ] **LAND-05**: Waynora branding includes clickable “Made by YADAV NITESH” attribution linking to `https://github.com/yadavnitesh86` in a new tab with appropriate security attributes.
- [ ] **LAND-06**: The landing page has an editorial travel-inspired visual identity with meaningful imagery or composition, purposeful motion, responsive layouts, and no fabricated testimonials, users, partners, booking, or live-pricing claims.

### Chat and Backend Integration

- [ ] **CHAT-01**: An authenticated user can create a new chat and see a clear empty state before sending a message.
- [ ] **CHAT-02**: The chat composer accepts multi-line trip requests and Enter/Shift+Enter behavior is predictable and documented in the UI.
- [ ] **CHAT-03**: Submitting a valid request immediately displays the user's message before waiting for the backend.
- [x] **CHAT-04**: The client sends the exact backend contract `POST /ask` with `{ question, thread_id? }` and validates `{ answer, thread_id }` before displaying a response.
- [ ] **CHAT-05**: A returned `thread_id` is retained for supported follow-up messages in the same conversation.
- [ ] **CHAT-06**: Assistant responses render readable Markdown including lists and tables through a safe renderer with raw HTML disabled and safe link handling.
- [ ] **CHAT-07**: User and assistant messages are visually distinct, readable at long response lengths, and accessible to screen readers.
- [ ] **CHAT-08**: The UI prevents duplicate submissions while one request is active without discarding additional text the user is composing.
- [ ] **CHAT-09**: The client never fabricates a travel plan, agent result, progress event, or successful response when the backend fails.

### Request Lifecycle and Waiting Experience

- [ ] **WAIT-01**: The request lifecycle distinguishes idle, submitting, actively waiting, succeeded, network failure, timeout, HTTP failure, malformed response, and unexpected application failure states.
- [ ] **WAIT-02**: An active request remains supported for approximately 15 minutes, uses cleanup-safe timeout and abort handling, and does not use a normal short timeout that interrupts legitimate work.
- [ ] **WAIT-03**: The waiting UI shows an active indicator, honest elapsed time, the 5–15 minute expectation, and copy based on elapsed time rather than render count.
- [ ] **WAIT-04**: Waiting messages rotate through multiple non-repeating variants across time bands, especially after five minutes, without claiming specialist completion or fake percentage progress.
- [ ] **WAIT-05**: Timeout and interruption messaging explains that server-side execution may continue, preserves the submitted request, and requires deliberate user action before retrying.
- [ ] **WAIT-06**: The request controller ignores stale results after chat changes or unmount and cleans up timers, listeners, and abort resources.

### Chat Persistence and Management

- [ ] **PERSIST-01**: Conversations use a versioned, validated browser-cookie data model containing chat ID, title, timestamps, messages, roles, content, and backend thread ID where needed.
- [ ] **PERSIST-02**: Chat history is stored in browser cookies rather than Convex or another database, and custom cookies never contain passwords, tokens, API keys, or secrets.
- [ ] **PERSIST-03**: Cookie storage handles the approximately 4 KB per-cookie constraint through bounded chunking or an equivalent explicit strategy with safe cookie attributes.
- [ ] **PERSIST-04**: Cookie reads validate the complete snapshot, recover safely from malformed or partial data, and never crash the application or silently accept invalid data.
- [ ] **PERSIST-05**: The application enforces a reasonable retention and size cap, preserves useful recent chats, and visibly notifies the user when storage limits prevent persistence; it never silently truncates an itinerary.
- [ ] **PERSIST-06**: A user can create, switch between, rename, and delete chats from a responsive history sidebar or panel.
- [ ] **PERSIST-07**: A new chat receives a sensible short title derived from its first user message without requiring a naming dialog.
- [ ] **PERSIST-08**: Chat history survives browser reload when the cookie snapshot is valid and the UI clearly handles empty or recovered history.
- [ ] **PERSIST-09**: A failed request preserves the submitted user message and existing conversation history for recovery or deliberate retry.
- [ ] **PERSIST-10**: In-flight request metadata is handled conservatively across reloads so the UI does not replay an expensive server request automatically.

### 2048 Waiting Game

- [ ] **GAME-01**: The waiting interface contains a lightweight 4×4 2048 game only while an AI request is actively waiting.
- [ ] **GAME-02**: The game implements standard tile movement, merging, spawning, scoring, and best score tracking for the current game session.
- [ ] **GAME-03**: The game supports win and game-over states and provides a restart control.
- [ ] **GAME-04**: The game supports keyboard arrow controls on desktop and swipe/pointer controls on touch devices.
- [ ] **GAME-05**: Game logic is separated into deterministic, testable functions independent from React UI and chat state.
- [ ] **GAME-06**: Game controls do not submit chat messages, steal arrow keys from focused text inputs, scroll-jack the page, or cancel/restart the AI request.
- [ ] **GAME-07**: Game controls, status, score, restart, win, and game-over states are usable with keyboard and assistive technology.

### Error Handling, Security, and Quality

- [ ] **QUAL-01**: Customer-facing errors are concise and friendly; raw tracebacks, provider errors, infrastructure diagnostics, secrets, and API keys never appear in the UI.
- [ ] **QUAL-02**: Network, timeout, HTTP, malformed-response, validation, and unexpected failures provide appropriate recovery guidance without automatic expensive retries.
- [ ] **QUAL-03**: Cookie data, API responses, and user input are validated at boundaries, and hostile Markdown/URL fixtures cannot execute scripts or unsafe protocols.
- [ ] **QUAL-04**: Landing, authentication, chat, waiting, history, and game surfaces work responsively on desktop, tablet, and mobile.
- [ ] **QUAL-05**: Available linting, type-checking, unit tests, and integration checks run successfully, with pure cookie, chat-state, API-schema, and 2048 logic covered.
- [ ] **QUAL-06**: The documented workflows are verified, including landing, attribution, auth transitions, real `/ask` response rendering, long waits, elapsed messages, game controls, cookie reloads, chat CRUD, overflow handling, error recovery, accessibility, and absence of leaked secrets/errors.
- [ ] **QUAL-07**: The production-like request path is tested for CORS, authentication configuration, and timeout behavior; limitations of the hosting/proxy path are documented rather than hidden.

## v2 Requirements

Deferred until the v1 flow is validated or backend capabilities change.

### Auth and Convenience

- **V2-AUTH-01**: User can reset a forgotten password through a configured email provider.
- **V2-AUTH-02**: User can authenticate with Google or another OAuth provider.

### Planning and Distribution

- **V2-PLAN-01**: User can regenerate or edit a prior request with verified backend conversation semantics.
- **V2-PLAN-02**: User can copy, print, or export a generated plan.
- **V2-PLAN-03**: User can leave the page while generation continues and receive a completion notification through a background-job backend.
- **V2-PLAN-04**: User can search, share, or sync plans across devices.
- **V2-PLAN-05**: User can view maps, calendar integrations, booking, or live pricing.
- **V2-UX-01**: User can switch to a fully supported dark theme or another localized language.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Fake progress percentages or per-agent completion claims | The backend exposes no progress events; this would mislead users. |
| Mock or fabricated travel plans | The core value requires actual `/ask` responses. |
| Automatic retry loops | Browser timeout does not guarantee server cancellation and can create duplicate expensive runs. |
| Convex/database chat history | The product explicitly requires cookie-based conversation persistence. |
| Streaming, polling, job IDs, or cancellation | The existing backend is synchronous and provides none of these contracts. |
| Booking, live pricing, maps, or partner APIs | These require a separate backend/product integration scope. |
| Native mobile applications | v1 is a responsive web application. |
| Heavy game engines or multiple waiting games | A lightweight isolated 2048 game is the defined engagement feature. |
| Fabricated testimonials, user counts, or partner logos | Marketing must remain truthful and verifiable. |

## User Stories

- As a traveler, I can understand what Waynora does and start planning from the landing page.
- As a new user, I can create an account and reach a protected planning workspace.
- As a returning user, I can log in, refresh, and remain authenticated.
- As a traveler, I can submit a trip request and see my message immediately.
- As a traveler, I can honestly understand that planning is still waiting while the real backend works.
- As a waiting user, I can play 2048 without interrupting my request or chat composition.
- As a traveler, I can receive and read the actual generated itinerary as formatted Markdown.
- As a user recovering from failure, I can keep my prompt and conversation and choose whether to retry.
- As a returning user, I can reload, switch, rename, and delete my cookie-persisted chats.

## Acceptance Criteria

- A real authenticated request reaches the existing FastAPI `/ask` route with the exact documented payload and displays its actual response.
- A response thread ID supports a follow-up request in the same conversation.
- A request can remain in the waiting state for approximately 15 minutes without a normal short client timeout.
- Waiting copy is elapsed-time-driven, varied, honest, and contains no fake progress or agent completion claims.
- Timeout, network, HTTP, malformed-response, and unexpected failures preserve user input and show friendly recovery actions.
- Cookie persistence is versioned, validated, bounded, explicitly overflow-aware, and never silently truncates a plan.
- The 2048 game supports standard rules, keyboard/touch input, scoring, restart, win, and game-over without interfering with chat.
- Authentication, protected routing, logout, session refresh, responsive layouts, keyboard navigation, safe Markdown, and GitHub attribution work as specified.
- Automated checks plus realistic manual/integration verification cover the documented v1 workflows.

## Traceability

Updated during roadmap creation. Each v1 requirement maps to exactly one phase.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Complete |
| FOUND-02 | Phase 1 | Complete |
| FOUND-03 | Phase 1 | Complete |
| FOUND-04 | Phase 5 | Pending |
| FOUND-05 | Phase 1 | Complete |
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| AUTH-06 | Phase 1 | Complete |
| LAND-01 | Phase 5 | Pending |
| LAND-02 | Phase 5 | Pending |
| LAND-03 | Phase 5 | Pending |
| LAND-04 | Phase 5 | Pending |
| LAND-05 | Phase 5 | Pending |
| LAND-06 | Phase 5 | Pending |
| CHAT-01 | Phase 3 | Pending |
| CHAT-02 | Phase 3 | Pending |
| CHAT-03 | Phase 3 | Pending |
| CHAT-04 | Phase 1 | Complete |
| CHAT-05 | Phase 3 | Pending |
| CHAT-06 | Phase 3 | Pending |
| CHAT-07 | Phase 3 | Pending |
| CHAT-08 | Phase 3 | Pending |
| CHAT-09 | Phase 3 | Pending |
| WAIT-01 | Phase 3 | Pending |
| WAIT-02 | Phase 3 | Pending |
| WAIT-03 | Phase 3 | Pending |
| WAIT-04 | Phase 3 | Pending |
| WAIT-05 | Phase 3 | Pending |
| WAIT-06 | Phase 3 | Pending |
| PERSIST-01 | Phase 2 | Pending |
| PERSIST-02 | Phase 2 | Pending |
| PERSIST-03 | Phase 2 | Pending |
| PERSIST-04 | Phase 2 | Pending |
| PERSIST-05 | Phase 2 | Pending |
| PERSIST-06 | Phase 4 | Pending |
| PERSIST-07 | Phase 4 | Pending |
| PERSIST-08 | Phase 4 | Pending |
| PERSIST-09 | Phase 2 | Pending |
| PERSIST-10 | Phase 2 | Pending |
| GAME-01 | Phase 4 | Pending |
| GAME-02 | Phase 4 | Pending |
| GAME-03 | Phase 4 | Pending |
| GAME-04 | Phase 4 | Pending |
| GAME-05 | Phase 4 | Pending |
| GAME-06 | Phase 4 | Pending |
| GAME-07 | Phase 4 | Pending |
| QUAL-01 | Phase 5 | Pending |
| QUAL-02 | Phase 5 | Pending |
| QUAL-03 | Phase 5 | Pending |
| QUAL-04 | Phase 4 | Pending |
| QUAL-05 | Phase 5 | Pending |
| QUAL-06 | Phase 5 | Pending |
| QUAL-07 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 56 total
- Mapped to phases: 56
- Unmapped: 0 ✓

---
*Requirements defined: 2026-10-09*  
*Last updated: 2026-10-09 after roadmap creation*
