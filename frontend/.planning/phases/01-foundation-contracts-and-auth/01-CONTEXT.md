# Phase 1: Foundation, Contracts, and Auth - Context

**Gathered:** 2026-10-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 1 establishes the typed React/Vite SPA foundation, shared responsive design tokens, route/auth shell, exact backend and Markdown contracts, and Convex-backed email/password authentication. It does not build the full chat experience, cookie repository, waiting room, 2048 game, or public landing-page polish; those belong to later phases.

</domain>

<decisions>
## Implementation Decisions

### Frontend foundation
- **D-01:** Use a React/Vite SPA rather than Next.js or another SSR framework; the current product is client-heavy and has no SSR requirement.
- **D-02:** Use TypeScript, Tailwind CSS tokens, React Router, and minimal purposeful dependencies consistent with the researched stack.
- **D-03:** Keep the project ESM-compatible and expose only public `VITE_*` environment values to browser code.
- **D-04:** Build reusable, accessible shell primitives now so landing, auth, chat, and waiting surfaces share one design system.

### Backend and Markdown contracts
- **D-05:** Treat the existing FastAPI contract as fixed: `POST /ask` with `{ question, thread_id? }` and `{ answer, thread_id }`; no streaming, polling, job IDs, cancellation, or fabricated progress contracts.
- **D-06:** Put request and response validation at the API boundary so later chat work cannot silently drift from `main.py`.
- **D-07:** Render assistant Markdown through `react-markdown` + `remark-gfm`, with raw HTML disabled and safe URL handling; do not add `rehype-raw` or `dangerouslySetInnerHTML`.

### Authentication and route behavior
- **D-08:** Use Convex Auth's documented Password provider for email/password authentication, with server-side password handling and exact package versions pinned during implementation.
- **D-09:** Convex owns authentication/session and genuinely user-related server data only; conversation history remains outside Convex.
- **D-10:** Protected chat routing must wait for auth state resolution before redirecting, avoiding an unauthenticated flash; signup/login/logout forms show validation, loading, and friendly failure states.
- **D-11:** Password reset, email verification, and OAuth are deferred because they require additional provider/deployment setup and are not part of v1.

### Visual and accessibility direction
- **D-12:** Apply the installed `design-taste-frontend` and `high-end-visual-design` skills to the shared foundation and later UI phases; avoid generic dashboard primitives, gradient-heavy SaaS patterns, excessive glass, and decorative blobs.
- **D-13:** Establish a premium travel/editorial visual language, but reserve final landing composition, imagery, and motion polish for Phase 5.
- **D-14:** Build keyboard navigation, visible focus, semantic landmarks, reduced-motion support, and responsive layout primitives as foundation behavior rather than a final retrofit.

### Claude's Discretion

The exact Vite minor versions, file naming, component styling mechanics, auth form copy, icon set, and whether a small optional dependency is justified are implementation details. Choose the smallest stable approach that preserves the locked contracts above and validate package compatibility before installation.

</decisions>

<canonical_refs>
## Canonical References

Downstream agents MUST read these before planning or implementing.

### Product and scope
- `.planning/PROJECT.md` — product purpose, core value, constraints, backend facts, and mandatory frontend skills.
- `.planning/REQUIREMENTS.md` — Phase 1 requirements FOUND-01..03, FOUND-05, AUTH-01..06, and CHAT-04.
- `.planning/ROADMAP.md` — Phase 1 goal, success criteria, plans, and explicit phase boundary.
- `prompt.md` — authoritative original product brief and acceptance expectations.

### Research
- `.planning/research/SUMMARY.md` — consolidated stack, architecture, pitfalls, and build-order decisions.
- `.planning/research/STACK.md` — researched React/Vite, Convex Auth, Markdown, env, and dependency recommendations.
- `.planning/research/ARCHITECTURE.md` — component boundaries and data-flow constraints.
- `.planning/research/PITFALLS.md` — auth, XSS, CORS, environment, and long-request risks to avoid.

### Existing backend and project
- `../main.py` — actual FastAPI `/ask` route and error behavior.
- `../app/api/model.py` — authoritative Pydantic request/response models if available during implementation.
- `convex/schema.ts` — current Convex schema baseline.
- `AGENTS.md` — Convex-specific guidance and project-level GSD constraints.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `convex/schema.ts`: existing empty `defineSchema({})` baseline; extend only as required by Convex Auth setup, never for chat history.
- `convex/_generated/`: existing Convex-generated support; regenerate through the Convex workflow rather than hand-editing generated files.
- `package.json`: existing Node/CommonJS skeleton with `convex ^1.46.0`; package scripts and module type will need deliberate migration for Vite.

### Established Patterns
- Convex is already the selected backend dependency and local AGENTS.md requires reading `convex/_generated/ai/guidelines.md` before Convex changes.
- The parent FastAPI app has a narrow synchronous route and generic customer-safe 500 detail; the frontend should preserve this separation.

### Integration Points
- Vite environment configuration connects the browser to the configurable parent FastAPI base URL.
- Convex provider/auth configuration connects route guards and forms to the deployment session.
- The typed API client and safe Markdown renderer become dependencies of Phase 3's chat vertical slice.

</code_context>

<specifics>
## Specific Ideas

- The visual identity should feel like a premium travel editorial/magazine rather than a default AI SaaS dashboard.
- The landing page must eventually show the three truthful specialist agents under the main travel agent and the “Made by YADAV NITESH” GitHub attribution.
- The user explicitly considers frontend-skill usage mandatory; the phase plan should name the skills rather than merely claiming design quality.

</specifics>

<deferred>
## Deferred Ideas

- Full landing-page composition, imagery, motion, agent storytelling, and attribution treatment — Phase 5.
- Cookie persistence and chat sidebar — Phase 2 and Phase 4.
- Real `/ask` execution, long-request waiting, retry semantics, and 2048 — Phases 3 and 4.
- Password reset, OAuth, email verification, export, background jobs, notifications, maps, booking, and live pricing — v1.x/v2 or out of scope per REQUIREMENTS.md.

</deferred>

---

*Phase: 1-Foundation, Contracts, and Auth*
*Context gathered: 2026-10-09*
