# Roadmap: Waynora

## Overview

Waynora will be built as a five-phase vertical MVP: establish the React/Convex/API contracts and authentication, make cookie persistence safe before promising chat history, prove the real long-running chat flow, add chat management and the isolated 2048 waiting experience, then finish the editorial landing page and production verification. The order deliberately validates the expensive and irreversible contracts before visual polish.

## Phases

- [x] **Phase 1: Foundation, Contracts, and Auth** - Establish the typed SPA, exact backend boundary, safe Markdown, Convex auth, routing, and shared UI foundations. (completed 2026-10-10)
- [ ] **Phase 2: Cookie Persistence and Chat Domain** - Build bounded, validated conversation storage and pure chat management primitives.
- [x] **Phase 3: Real Chat and Long-Request Lifecycle** - Deliver the core authenticated chat slice against the actual FastAPI `/ask` endpoint with honest waiting and recovery. (completed 2026-10-13)
- [x] **Phase 4: Chat Management, 2048, and Responsive Experience** - Add sidebar management, the isolated waiting game, and cross-device interaction quality. (completed 2026-10-14)
- [x] **Phase 5: Editorial Landing, Hardening, and Verification** - Ship the premium public experience and validate security, deployment, accessibility, and all v1 workflows. (completed 2026-10-15)

## Phase Details

### Phase 1: Foundation, Contracts, and Auth

**Goal:** A typed, routed Waynora SPA can authenticate users and safely represent the exact backend and Markdown contracts.
**Mode:** mvp
**Depends on:** Nothing (first phase)
**Requirements:** [FOUND-01, FOUND-02, FOUND-03, FOUND-05, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, CHAT-04]
**Success Criteria** (what must be TRUE):

  1. The application starts as a typed React/Vite SPA with shared responsive tokens, route structure, and configurable public environment values.
  2. A user can sign up, log in, stay logged in after refresh, log out, and be redirected away from protected chat when unauthenticated.
  3. The typed API boundary accepts only the actual `/ask` request/response shapes, and the safe Markdown boundary rejects raw HTML/unsafe links.
  4. No private Convex credentials, passwords, API keys, or server-only values are exposed in browser code.

**UI hint:** yes
**Plans:** 3/3 plans complete

Plans:
**Wave 1**

- [x] 01-01: Scaffold Vite React TypeScript app, Tailwind tokens, routing, environment validation, API schemas, and safe Markdown boundary.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 01-02: Configure Convex Password authentication, session provider, signup/login/logout forms, and protected-route behavior.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 01-03: Build shared accessible shell primitives and verify foundation/auth contracts with unit and browser checks.

### Phase 2: Cookie Persistence and Chat Domain

**Goal:** Conversation data can be safely created, validated, bounded, recovered, and managed without entering Convex or silently losing itinerary content.
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** [PERSIST-01, PERSIST-02, PERSIST-03, PERSIST-04, PERSIST-05, PERSIST-09, PERSIST-10]
**Success Criteria** (what must be TRUE):

  1. Valid conversations serialize into a versioned cookie envelope with safe attributes, bounded chunks, and no secrets.
  2. Malformed, partial, oversized, or stale cookie data is rejected or recovered visibly without crashing or silently truncating a plan.
  3. Pure chat-domain functions support message updates, first-message title derivation, timestamps, thread IDs, failure preservation, and conservative in-flight metadata.
  4. Cookie and chat-domain tests cover normal, boundary, migration, overflow, corruption, and recovery cases.

**UI hint:** yes
**Plans:** 2/2 plans executed

Plans:

- [x] 02-01: Implement versioned Zod chat schemas, cookie codec/chunk repository, caps, pruning, recovery, and write notices.
- [x] 02-02: Implement pure conversation/title/message domain operations and exhaustive persistence boundary tests.

### Phase 3: Real Chat and Long-Request Lifecycle

**Goal:** As a signed-in traveler, I want to submit a real travel request and wait honestly for the synchronous backend, so that I receive the actual answer, can continue the thread, and recover safely from failure.
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** [CHAT-01, CHAT-02, CHAT-03, CHAT-05, CHAT-06, CHAT-07, CHAT-08, CHAT-09, WAIT-01, WAIT-02, WAIT-03, WAIT-04, WAIT-05, WAIT-06]
**Success Criteria** (what must be TRUE):

  1. A valid authenticated request immediately appears as a user message, reaches real `POST /ask`, validates the response, renders the actual answer, and retains the returned thread ID for follow-up.
  2. The controller enforces one active request per conversation, ignores stale results, cleans up resources, and supports a wait of approximately 15 minutes.
  3. Waiting UI shows elapsed time and varied honest time-banded messages without fake percentages or invented agent status.
  4. Network, timeout, HTTP, malformed, and unexpected failures preserve the prompt/history and provide explicit, non-automatic recovery without exposing raw diagnostics.

**UI hint:** yes
**Plans:** 3/3 plans complete

Plans:

**Wave 1**

- [x] 03-01-PLAN.md — Typed /ask client, request controller state machine, timeout/abort lifecycle, request IDs, and error taxonomy.

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-02-PLAN.md — Protected chat conversation vertical slice: composer, messages, safe Markdown, optimistic persistence, thread continuation.

**Wave 3** *(blocked on Wave 2 completion)*

- [x] 03-03-PLAN.md — Elapsed-time waiting shell; validate real-backend, long-request, stale-result, retry, and malformed-response behavior.

### Phase 4: Chat Management, 2048, and Responsive Experience

**Goal:** Users can manage their local conversations and use a polished, accessible 2048 waiting room without interference between game, chat, or request state.
**Mode:** mvp
**Depends on:** Phase 3
**Requirements:** [PERSIST-06, PERSIST-07, PERSIST-08, GAME-01, GAME-02, GAME-03, GAME-04, GAME-05, GAME-06, GAME-07, QUAL-04]
**Success Criteria** (what must be TRUE):

  1. Users can create, switch, rename, delete, and reload chats through a responsive history panel with sensible automatic titles and empty/recovery states.
  2. The waiting interface shows 2048 only during active waiting and the game supports standard movement, merging, scoring, win, game-over, restart, keyboard, and touch controls.
  3. Game input never submits chat, steals input from focused text controls, scroll-jacks mobile pages, or cancels the backend request.
  4. Landing/auth/chat/history/waiting/game surfaces remain usable on desktop, tablet, and mobile with keyboard and assistive technology support.

**UI hint:** yes
**Plans:** 3/3 plans complete

Plans:

- [x] 04-01: Build chat sidebar CRUD, auto-title UI, empty states, persistence notices, and responsive navigation.
- [x] 04-02: Implement pure deterministic 2048 reducer and accessible board/control UI with keyboard and touch input.
- [x] 04-03: Integrate waiting room, focus/reduced-motion behavior, mobile layouts, and cross-device interaction tests.

### Phase 5: Editorial Landing, Hardening, and Verification

**Goal:** Waynora is a truthful, premium, production-oriented experience whose public landing page and release checks match the real application capabilities.
**Mode:** mvp
**Depends on:** Phase 4
**Requirements:** [FOUND-04, LAND-01, LAND-02, LAND-03, LAND-04, LAND-05, LAND-06, QUAL-01, QUAL-02, QUAL-03, QUAL-05, QUAL-06, QUAL-07]
**Success Criteria** (what must be TRUE):

  1. The landing page uses the required frontend design skills and delivers a distinctive editorial travel identity with clear CTAs, honest timing, accurate agent architecture, useful plan expectations, attribution, and no fabricated claims.
  2. Customer-facing failures remain friendly and safe while hostile Markdown, unsafe URLs, malformed cookies, and secret/error leakage are covered by tests.
  3. Lint, type-check, unit, integration, responsive, accessibility, and documented workflow checks pass or have an explicitly documented external limitation.
  4. A production-like origin validates Convex auth, API CORS, and the long-request path; any proxy limitation is documented rather than hidden.

**UI hint:** yes
**Plans:** 3 plans

Plans:

- [x] 05-01: Apply `design-taste-frontend` and `high-end-visual-design` to build the editorial landing page, imagery, typography, CTAs, attribution, and metadata.
- [x] 05-02: Harden CORS/auth/env/security behavior and add adversarial Markdown, cookie, API, long-request, and error-path verification.
- [x] 05-03: Run full responsive/accessibility/release verification, fix introduced issues, and document deployment limitations and verified workflows.

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation, Contracts, and Auth | 3/3 | Complete   | 2026-10-10 |
| 2. Cookie Persistence and Chat Domain | 2/2 | Complete   | 2026-10-11 |
| 3. Real Chat and Long-Request Lifecycle | 3/3 | Complete   | 2026-10-13 |
| 4. Chat Management, 2048, and Responsive Experience | 3/3 | Complete   | 2026-10-14 |
| 5. Editorial Landing, Hardening, and Verification | 3/3 | Complete   | 2026-10-15 |
