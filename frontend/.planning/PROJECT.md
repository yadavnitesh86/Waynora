# Waynora

## What This Is

Waynora is an AI-powered multi-agent travel planning website. Users describe a trip in a chat interface; a coordinated system of specialist agents (Destination Planner, Transport Agent, AccommodationWeather Agent) researches the trip under a main travel agent and returns a complete travel plan in roughly 5–15 minutes. The website pairs the long wait with an honest waiting experience and a playable 2048 mini-game, so waiting feels intentional rather than broken.

## Core Value

A user can submit a trip request from the chat, wait through the real 5–15 minute agent generation, and receive their actual AI-generated travel plan — presented clearly, persisted across reloads, without ever showing a fabricated plan.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Premium, distinctive travel-tech landing page with branding, agent explanation, and GitHub attribution ("Made by YADAV NITESH" → https://github.com/yadavnitesh86)
- [ ] Convex-backed authentication: signup, login, logout, protected chat, session persistence
- [ ] Chat interface wired to the real Python `POST /ask` endpoint (no mocked plans)
- [ ] Long-running request lifecycle supporting waits up to ~15 minutes with honest waiting messages
- [ ] Playable 2048 mini-game embedded in the waiting experience
- [ ] Cookie-based chat persistence with explicit size-limit handling and chat management (create/switch/rename/delete, auto-titles)
- [ ] Friendly error handling that preserves user input and conversation history
- [ ] Responsive (desktop/tablet/mobile), accessible, verified implementation

### Out of Scope

- Server-side chat history storage (Convex DB or any database for conversations) — requirement explicitly demands browser cookies
- Streaming responses / job IDs / progress events / cancellation — backend `/ask` is synchronous and exposes none of these; frontend must not fake them
- Rewriting the Python agent system — this is a frontend integration task; backend changes only if small and justified
- Mobile native apps — web responsive only
- Fake authentication or client-stored credentials — explicitly forbidden

## Context

- **Frontend skeleton (this repo, `frontend/`)**: `package.json` currently has only `convex ^1.46.0` as a dependency (`type: commonjs`, dev script `convex dev`). No React framework is installed yet — the UI framework must be chosen during Phase 1 consistent with the environment (Node-based, Windows).
- **Convex**: `convex/schema.ts` is an empty `defineSchema({})`; `_generated/` present. Convex handles authentication and user-related server data ONLY — never chat history.
- **Python backend (parent dir)**: FastAPI app (`main.py`) exposing `POST /ask` with `AskRequest {question, thread_id?}` → `AskResponse {answer, thread_id}`. Synchronous, non-streamed; LangGraph + AsyncSqliteSaver checkpointer provides conversation memory keyed by `thread_id`, and the response returns `thread_id` for continuation. CORS is wide open (`allow_origins=["*"]`). Errors surface as HTTP 500 with a generic detail string.
- **Local backend URL**: found in `main.py`/its config; must be provided via configurable env var (e.g. `NEXT_PUBLIC_API_BASE_URL` or the chosen framework's convention). Never hardcode production URLs or commit secrets.
- **Frontend skills (MANDATORY)**: Installed OpenCode skills at `C:\Users\yadav_alldafn\.config\opencode\skills` must actually be read and applied during UI phases. Primary: `design-taste-frontend`, `high-end-visual-design`. Supporting as direction dictates: `minimalist-ui`, `stitch-design-taste`, `gpt-taste`, `image-to-code`, `redesign-existing-projects`, `full-output-enforcement`. Using them is required, not optional, and applies to visual design, component architecture, accessibility, responsiveness, and implementation quality.
- **Design direction**: premium travel/editorial-magazine identity (maps, destinations, exploration). Forbidden: generic gradient SaaS template look, repetitive card grids, excessive glassmorphism/glow/blobs, filler AI marketing copy, decorative noise.
- **Agent architecture to represent honestly**: Destination Planner, Transport Agent, AccommodationWeather Agent, coordinated by the main travel agent. No invented capabilities, no fake per-agent progress.
- **GSD environment**: agents/subagent-skill payloads not installed for this runtime → research and roadmap were generated inline in this session. Frontend skills (above) ARE installed and mandatory.

## Constraints

- **Tech stack**: use the existing project setup (Convex ^1.46.0, Node, TypeScript) and add a UI framework/libraries only when justified; minimal, purposeful dependencies.
- **Backend contract**: follow the actual `/ask` schema from `main.py` — `{question, thread_id?}` → `{answer, thread_id}`; do not guess or invent fields.
- **Timeout budget**: frontend request lifecycle must tolerate ~15-minute waits; a browser-side timeout does NOT stop server-side execution — retries may start a second expensive agent run, so retry UX must communicate this.
- **Cookie limits**: ~4 KB per cookie; no unlimited cookies, no silent truncation; versioned structure, retention caps, graceful overflow with user notification.
- **Security**: `SameSite` (+`Secure` in HTTPS prod) cookie attributes; safe Markdown rendering (no script injection); validate data loaded from cookies; never put passwords/tokens/API keys in cookies; `NEXT_PUBLIC_*` vars are public by definition.
- **Single-flight rule**: one active planning request per conversation at a time; prevent duplicate submissions.
- **Honesty**: no fake progress percentages, no invented per-agent completion, no promised response times; messages communicate "still waiting" truthfully.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Cookie-based chat persistence (not Convex/DB) | Explicit user requirement; auth-only in Convex | — Pending |
| Multi-turn chat via backend `thread_id` | `main.py` + LangGraph checkpointer already support memory; response returns `thread_id` | — Pending |
| UI framework chosen in Phase 1 from existing skeleton | Only `convex` is installed; pick minimal React-based stack fitting Windows/Node env | — Pending |
| Mandatory use of installed frontend skills in UI phases | User emphasized this as critical to project quality | — Pending |
| Waiting messages driven by elapsed time (not render count) | Reliable under re-renders; rotates variants without consecutive repeats | — Pending |
| 2048 built as self-contained logic + UI (no game engine) | Lightweight, testable, no heavy dependency | — Pending |
| Sequential plan execution, coarse granularity | User config choice at init | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-09 after initialization*
