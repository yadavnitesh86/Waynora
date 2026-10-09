# Feature Research

**Domain:** AI-powered multi-agent travel planning website (chat product with long-running generation)
**Researched:** 2026-10-09
**Confidence:** HIGH

**Scope anchor:** This research categorizes the v1 scope already fixed in `frontend/prompt.md` (landing page, Convex email/password auth, chat wired to real POST `/ask`, 5–15 min waiting UX with elapsed-time messages, embedded 2048, cookie-based chat history with size-limit handling, friendly error taxonomy, responsive + accessible). Anything not in that document is explicitly classified as v1.x / v2+ / anti-feature — it does not expand v1.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete. **Everything in this first table is already in the v1 document** — the research confirms the document's scope matches the market baseline for chat-first AI products.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Landing hero with clear value prop + primary CTA | Every AI product site (Mindtrip, Layla, Stardrift) opens with a one-line promise and a "plan" CTA | LOW | v1 doc: hero, "Plan my trip" CTA, secondary "how it works" CTA |
| Honest expectation-setting for generation time | AI-UX best practice: vague waits produce anxiety and abandonment; explicit ranges ("5–15 minutes") build trust (Deep Research / async-job patterns) | LOW | v1 doc states the message verbatim on landing + in waiting UI |
| How-it-works / agent transparency section | Chat-first travel tools explain their mechanism; multi-agent framing is Waynora's identity | LOW | v1 doc: 3 specialist agents + coordinator, explicitly no invented capabilities |
| Email/password signup, login, logout | Universal auth baseline; Layla and most competitors require accounts before planning | MEDIUM | v1 doc: Convex-backed, validation, loading/submission states, friendly credential errors |
| Session persistence + protected chat route | Users expect reloads to keep them logged in; unauthenticated users must never hit a dead chat | LOW–MEDIUM | v1 doc: use session approach supported by existing Convex config |
| Multi-line composer with predictable Enter behavior | ChatGPT/Claude convention: Enter sends, Shift+Enter newline | LOW | v1 doc requires predictable Enter without blocking line breaks |
| Distinct user/assistant messages + readable Markdown (headings, lists, tables) | Itineraries are structured day-by-day content; every chat product renders Markdown | MEDIUM | v1 doc: Markdown support, tables/lists, safe sanitized rendering |
| Chat sidebar: create / switch / rename / delete + auto titles from first message | ChatGPT/Claude sidebar is the mental model users bring | MEDIUM | v1 doc: full CRUD + auto titles, no forced naming dialog |
| Conversation persistence across reloads | Losing a 10-minute generated plan is the worst possible failure for this product | MEDIUM | v1 doc: versioned cookie storage, size-limit handling with user notification, never silent truncation |
| Visible waiting state during generation | 5–15 min synchronous waits are far beyond normal web tolerance; a bare spinner reads as a hang | MEDIUM | v1 doc: waiting indicator + elapsed-time indicator + rotating time-banded messages driven by elapsed time, variants per band, no consecutive repeats |
| Honest timeout handling with retry | At 15-min waits timeouts WILL happen; silently discarding the request is the #1 trust killer | MEDIUM–HIGH | v1 doc: distinguish processing/network/timeout/HTTP/malformed/app-error; explain, offer retry, never auto-retry (retry may start a second expensive agent run) |
| Friendly errors preserving user input | Losing a typed trip brief is unforgivable; recovery paths are the most common chat-product complaint | MEDIUM | v1 doc: 5-category taxonomy, preserve submitted message + history, retryable vs validation distinction |
| No raw backend errors / secrets in UI | Instant credibility + security failure otherwise | LOW | v1 doc: log diagnostics in dev, show friendly text only |
| Responsive layout + keyboard accessibility | Much travel research is mobile; keyboard access is baseline a11y | MEDIUM | v1 doc: all screens responsive; game arrows + swipe |
| Fast, non-generic landing | Comparisons penalize slow/template sites; the doc's design bar ("not a generic AI-generated SaaS template") is itself table stakes for credibility | MEDIUM | v1 doc: editorial travel identity, no decorative slop, minimal dependencies |
| 2048 fully functional (move, merge, score, best, win, game-over, restart) | A broken game is worse than no game | MEDIUM | v1 doc: 4×4, arrows + swipe, session best score, deterministic logic separated from UI, no heavy engine |
| Game isolation from chat | Game keystrokes must never submit messages, restart must never cancel the request, arrows must not fight the textarea | LOW–MEDIUM | v1 doc requires exactly this; classic embedded-game integration pitfall |

**Small gaps adjacent to table stakes (fold into v1 polish, not new scope):**

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Empty states (no chats yet, empty conversation) | Blank panes feel broken; every chat product has a friendly "start planning" state | LOW | One component, reuses landing copy |
| Composer disabled-state reason during active request | Users should know *why* send is off, not just that it is | LOW | Doc already requires preserving in-progress text while blocking duplicates |
| Page metadata (title, favicon, OG tags) | A production site without a favicon/tab title feels unfinished | LOW | Trivial; part of "production-oriented" mandate |

### Differentiators (Competitive Advantage)

None of these *add* v1 scope — they are the existing v1 features framed against the market, plus the strongest future bets.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Honest elapsed-time waiting narrative (time-banded rotating messages, no fake progress) | The industry is converging on "honest status, no invented progress" for long AI tasks (Deep Research pattern; UX guidance explicitly bans progress bars that sit at 99%). Waynora's message design implements the state of the art | MEDIUM | Already in v1. Keep it honest: never claim an agent finished, never promise a completion second, never show percentages |
| Playable 2048 during the wait | No surveyed AI travel planner (Mindtrip, Layla, Wanderlog, Stardrift, Stippl, Wonderplan, GuideGeek, SearchSpot, Voyaiger, ChatGPT, Gemini) embeds a game in its waiting UX — they use activity traces, spinners, or background notifications. A genuinely playful wait is memorable and shareable | MEDIUM | Already in v1. MEDIUM confidence on "nobody does this" (absence claim from ~12 surveyed products, not exhaustive) |
| Multi-agent transparency (three named specialists under a coordinator) | Competitors say "an AI plans your trip"; Waynora can show *how*. Most competitor "AI" is a single-prompt chatbot in a trench coat | LOW | Already in v1 (landing section). Constraint: represent only what the backend actually does |
| Cookie-local chat history (privacy angle: history never leaves the device) | "Your conversations stay in your browser" is a real privacy differentiator vs cloud-stored history — with the honest tradeoff that history is device-bound and can be cleared | MEDIUM | Already in v1 (cookie requirement). Marketing can mention it; docs must explain limits |
| Distinctive editorial travel design | Every surveyed competitor uses interchangeable SaaS-card aesthetics; a magazine-grade identity reads as trustworthy and premium | MEDIUM–HIGH | Already in v1 (design direction section); enforced by installed frontend skills |
| Persisted best score across sessions (v1.x) | Tiny addition that makes the game feel owned, not disposable | LOW | localStorage for game score only — does not violate the "no localStorage for chats" rule |
| Message copy button (v1.x) | Universal in ChatGPT/Claude/LibreChat; the single cheapest chat-UX credibility win | LOW | One button + clipboard write; natural first v1.x addition |
| Plan export / print-friendly view (v1.x) | Every travel competitor (Wonderplan PDF, Wanderlog export, Stardrift calendar sync) treats "take the plan with you" as essential; print-to-PDF is the cheap v1.x approximation | LOW–MEDIUM | `window.print()` + print stylesheet on the plan message |
| Password reset (v1.x) | Standard auth expectation once real users exist | MEDIUM | Needs Convex password-reset flow/email; deliberately not v1 |

### Anti-Features (Commonly Requested, Often Problematic)

Things to deliberately NOT build. The first group is explicitly prohibited by the v1 document; the second group is market-common but wrong for Waynora.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Fake progress bars / percentages | Progress bars feel informative during waits | Backend provides no progress events; a bar that crawls to 99% and stalls destroys trust and is flagged as a top anti-pattern in AI-UX literature | Elapsed-time indicator + honest rotating messages (already in v1) |
| Fabricated agent status ("Transport Agent done ✓") | Feels like a live activity feed | Backend does not report per-agent progress; claims would be lies | General honest waiting messages only (v1 doc prohibits this explicitly) |
| Fabricated / mock travel plans | Tempting for demos and tests | The doc mandates real API responses only; fake plans poison trust and testing | Real `/ask` integration; realistic long-request testing where backend is available |
| Promised completion times ("ready in 60 seconds") | Feels reassuring | Waits are genuinely variable (5–15 min); broken promises read as lies | Range-based expectation-setting on landing and in wait UI |
| Auto-retry loops on timeout | "Just keep trying for the user" | A browser timeout does not stop the server-side agent; auto-retry can start a second expensive run and duplicate cost | Explicit user-initiated retry with clear uncertainty messaging (v1 doc) |
| Server-side chat database (Convex chats) | "Just store chats in Convex, it's right there" | Directly contradicts the fixed storage architecture; changes the privacy story | Cookie-based storage per the document; Convex for auth/user data only |
| Streaming / job IDs / cancellation / progress events | Modern chat products stream | The Python `/ask` is synchronous; assuming capabilities that don't exist produces broken integration | Inspect `main.py`, integrate what exists, keep URL configurable |
| Booking / live pricing / maps integration | Table stakes for Mindtrip/Layla/Stardrift | Requires entirely different backend (GDS/partner APIs); frontend-only project cannot deliver it | Landing page must NOT promise booking or live prices; plan is research text |
| Fake testimonials / user counts / partner logos | Standard landing-page social proof | Fabricated proof on a personal project is dishonest and fragile | Real proof: agent architecture, what-you-receive section, honest time expectations, GitHub attribution |
| "Plan anywhere input" before signup (try-without-account) | Layla's paywall-after-planning annoys users; open-first tools score better | Doc mandates protected chat behind auth; free generation has real API cost per run | Auth-gated chat as specified; landing communicates value clearly instead |
| Heavy game engine or many games (solitaire, snake, wordle…) | "More engagement options" | Doc mandates lightweight, self-contained; more games = maintenance for zero planning value | One polished 2048; the wait rarely outlasts a few games |
| Secret-bearing or unprotected cookies | Convenient | Storing tokens/passwords in chat cookies is a security failure; missing SameSite/Secure invites abuse | Secrets only in Convex auth sessions; chat cookies validated, versioned, SameSite/Secure in HTTPS prod (v1 doc) |
| Raw tracebacks / provider error text in chat | Easier debugging in prod | Exposes infrastructure and keys | Friendly taxonomy + dev-only logging (v1 doc) |
| Unlimited chat retention in cookies | "Keep everything forever" | 4 KB per cookie limit; silent truncation loses plans | Explicit retention cap + user-visible limit notification (v1 doc) |
| Generic SaaS-template aesthetics (gradient blobs, glassmorphism, identical card grids) | Fast to build | The doc explicitly bans these; they read as low-effort AI output | Editorial travel identity via installed frontend skills |
| Markdown code-block syntax highlighting | Common in dev-tool chat products | Waynora's output is travel prose, not code; highlighting adds a dependency for near-zero value | Safe fenced-code rendering without highlighting (v2 candidate at most) |

## Feature Dependencies

```
[Landing page]
    └──CTA──> [Auth (signup/login)] ──gate──> [Chat interface]
                                                 │
                                                 ├──requires──> [POST /ask request lifecycle]
                                                 │                  ├──requires──> [Friendly error taxonomy]
                                                 │                  └──requires──> [Timeout + long-request handling]
                                                 │                                   └──enables──> [Waiting UX (messages + elapsed time)]
                                                 │                                     └──hosts──> [2048 game]
                                                 └──requires──> [Cookie chat persistence]
                                                                    ├──requires──> [Versioned chat data model]
                                                                    ├──requires──> [Auto titles from first message]
                                                                    └──enables──> [Chat sidebar CRUD]

[Safe Markdown rendering] ──requires──> [Sanitization] ──protects──> [Chat interface]
[2048 game logic (pure)] ──requires──> [nothing] ──isolated from──> [Chat composer + request lifecycle]
[Chat sidebar CRUD] ──requires──> [Cookie storage + size-limit handling]
```

### Dependency Notes

- **Waiting UX, 2048, and error handling all require the `/ask` request lifecycle**: design the request state machine (idle → sending → waiting → resolved/failed) first; everything else hangs off it.
- **2048 is hosted by, but isolated from, the waiting UX**: game module must not import chat code; chat keyboard handlers must ignore game events. Build game logic as a pure module so it's testable and can't break chat.
- **Chat sidebar requires cookie persistence**: the data model (IDs, titles, timestamps, version field) must exist before the sidebar; size-limit handling must exist before the sidebar can claim to "keep" chats.
- **Auto titles require first-message capture**: title derivation happens at first send, before the first response arrives — independent of backend latency.
- **Sanitization is a prerequisite of Markdown rendering**: never render assistant Markdown without an escaping/sanitizing renderer; XSS protection precedes pretty tables.
- **Landing honesty claims depend on backend reality**: the landing page may only promise what `main.py` actually does (sync `/ask`, no streaming/cancellation). Verify backend before writing marketing copy.
- **v1.x copy button conflicts with nothing** — pure addition. **v1.x password reset requires Convex email capability** — check what the existing Convex config supports before committing to it.

## MVP Definition

### Launch With (v1) — as fixed by the idea document

- [ ] Landing page: hero + CTAs, how-it-works, three specialist agents, what-you-receive, planning-time expectation, final CTA, "Made by YADAV NITESH" GitHub attribution (new tab, security attributes)
- [ ] Convex email/password auth: signup, login, logout, session persistence, protected chat, validation, loading states, friendly failures
- [ ] Chat interface: conversation area, multi-line composer, send, sidebar, new chat, loading states, safe Markdown with tables/lists, distinct message styling
- [ ] Real `/ask` integration: validate input → create chat → show user message → loading → wait for real response → render → save to cookies; prevent duplicate submissions
- [ ] Long-request handling: ~15-min timeout ceiling, six-state error distinction, honest waiting messages banded by elapsed time (0–1 … 12–15 min) with variants, immediate response display if early
- [ ] 2048: full rules, arrows + swipe, score + session best, win/lose, restart, isolated from chat controls
- [ ] Cookie chat history: versioned schema, sidebar CRUD, auto titles, manual rename, explicit size-limit handling with user notification, SameSite/Secure, no secrets
- [ ] Friendly error taxonomy preserving input + history, retry without duplicates, no fabricated results
- [ ] Responsive + accessible across landing/auth/chat/game
- [ ] Verification of all 17 documented workflows (lint, type-check, realistic long-request testing where possible)

### Add After Validation (v1.x)

- [ ] Message copy button — cheapest credibility win; add the moment chat works
- [ ] Persist 2048 best score (localStorage, game data only) — makes the game feel owned
- [ ] Print/export-friendly plan view — "take the plan with you" without a real export system
- [ ] Password reset — once real users exist and lost passwords occur
- [ ] Dark mode — common expectation, medium effort across a design system; do it after the light theme is excellent
- [ ] Chat search within history — trivial client-side over cookie data, only useful once history volume exists
- [ ] Markdown code-block highlighting — only if users actually paste code into plans (unlikely)

### Future Consideration (v2+)

- [ ] Regenerate response / edit message — requires backend conversation-memory semantics to be verified first; the doc says don't assume memory support
- [ ] Google OAuth — standard expectation but adds auth surface; after email/password proves stable
- [ ] i18n — travel products skew international; meaningful only with real international users
- [ ] Background generation + notification ("leave the tab, we'll tell you") — the industry-standard pattern for long AI tasks, but impossible without a backend job API (`/ask` is synchronous); requires backend changes first
- [ ] Shareable plan links, map views, calendar sync — the differentiators of Mindtrip/Stardrift/Wanderlog; all require server-side plan storage or external APIs
- [ ] Booking or live-pricing anything — different backend product entirely

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Real `/ask` integration + request lifecycle | HIGH | MEDIUM | P1 |
| Auth (signup/login/logout, protected chat) | HIGH | MEDIUM | P1 |
| Chat UI + Markdown rendering (sanitized) | HIGH | MEDIUM | P1 |
| Cookie chat persistence + sidebar CRUD + auto titles | HIGH | MEDIUM–HIGH | P1 |
| Waiting UX (elapsed-time messages, timeout, honest errors) | HIGH | MEDIUM–HIGH | P1 |
| 2048 game (isolated) | MEDIUM | MEDIUM | P1 |
| Landing page + design system | HIGH | MEDIUM–HIGH | P1 |
| Empty states / metadata / disabled-state reasons | LOW–MEDIUM | LOW | P1 (polish) |
| Message copy button | MEDIUM | LOW | P2 |
| Persisted game best score | LOW–MEDIUM | LOW | P2 |
| Print/export plan view | MEDIUM | LOW–MEDIUM | P2 |
| Password reset | MEDIUM | MEDIUM | P2 |
| Dark mode | MEDIUM | MEDIUM | P2 |
| Chat search | LOW–MEDIUM | LOW | P3 |
| Regenerate / edit message | MEDIUM | HIGH (backend-dependent) | P3 |
| OAuth, i18n, background jobs, sharing/maps/export systems | HIGH (at scale) | HIGH | P3 |

**Priority key:** P1 = v1 launch (per idea document) · P2 = v1.x · P3 = v2+

## Competitor Feature Analysis

| Feature | Mindtrip | Layla | Wanderlog | ChatGPT/Claude (chat baseline) | Waynora v1 approach |
|---------|----------|-------|-----------|-------------------------------|---------------------|
| Chat planning | Yes | Yes (conversational core) | AI bolted on, capped free tier | Core product | Yes — real multi-agent backend |
| Generation speed | Seconds–minutes | 20–30 min of back-and-forth | N/A (organizer) | Seconds (streaming) | 5–15 min per plan — must be owned, not hidden |
| Waiting UX | Spinner/progress | Conversational filler | N/A | Streaming tokens | Honest elapsed-time messages + 2048 (unique) |
| History storage | Cloud | Cloud | Cloud | Cloud (searchable, synced) | Cookie-local, device-bound (privacy tradeoff, documented) |
| History management | Workspace-level | Save requires signup | Trip-based | Sidebar CRUD + search + folders/projects | Sidebar CRUD + auto titles (search = v1.x) |
| Message actions | Chat actions | Chat actions | N/A | Copy, regenerate, edit, feedback, branches | Copy (v1.x), regenerate/edit (v2+, backend-dependent) |
| Booking / live prices | In-app (flights) | Partners | No | Via connected apps | Anti-feature — do not promise |
| Export plan | Collections/receipts | PDF via premium | Google Maps export / PDF (Pro) | Copy text | v1.x print view |
| Game in wait | No | No | No | No | Yes (2048) — differentiator |
| Account required pre-plan | Yes | Yes | No | Yes | Yes (protected chat, per doc) |

**Positioning takeaway:** Waynora cannot and should not compete on booking, live pricing, maps, or collaboration (all require different backends). Its honest long-wait experience + playful wait + agent transparency is a genuinely unoccupied niche among surveyed products. The competitive risk is not feature parity — it's execution quality of the wait itself, since 5–15 minutes is 10–50× longer than any surveyed competitor's plan generation.

## Sources

- AI travel planner landscape: iTechGuides "7 Best AI Trip Planners" (2026-08), travelanywhere.blog five-app comparison (2026-08), searchspot.ai assistant comparison (2026-05), anywayr.com six-tool comparison (2026-04), voyaige.to ten-tool review (2026-03), stardrift.ai planner comparison (2026-05) — HIGH confidence, multiple independent 2026 sources agree on the competitive set
- Long-wait AI UX: OpenAI Deep Research API guide (background mode, official docs); "The UX of Deep Research" (edwardbenson.com, 2025-04); "Slow AI: Designing User Control for Long Tasks" (Jakob Nielsen substack, 2025-10); "Designing for the Wait: UX Patterns for Reasoning Model Latency" (institutepm.com, 2026-07); aiuxplayground.com processing-time-estimates pattern; particula.tech long-running-task patterns (2025-12) — HIGH confidence; all converge on: honest ranges, no fake progress, background/notification pattern requires job APIs Waynora's backend lacks
- Chat UI conventions: PromptPlaybook interface guide; "Regenerate, Undo, Branch — Conversation Mechanics" (thepromptbench.com, 2026-05); ChatGPT/Claude interface deep-dives (mejba.me 2026, kindatechnical.com); LibreChat message-actions docs — HIGH confidence; copy/regenerate/edit/sidebar-CRUD/auto-titles are universal; branching is power-user only
- Product idea document: `frontend/prompt.md` (authoritative for v1 scope) — all v1 categorizations anchored to it

---
*Feature research for: Waynora — AI multi-agent travel planning website*
*Researched: 2026-10-09*
