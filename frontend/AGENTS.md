<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

<!-- GSD:project-start -->
## GSD Project Guidance

- Read `.planning/PROJECT.md`, `.planning/STATE.md`, and the relevant phase artifacts before planning or executing work.
- Follow `.planning/ROADMAP.md` and keep every v1 requirement mapped to one phase.
- Preserve the exact FastAPI `/ask` contract: `POST /ask` with `{ question, thread_id? }` and `{ answer, thread_id }`.
- Keep Convex limited to authentication/user data; chat history must remain in validated, bounded browser cookies.
- Never fabricate travel plans, progress percentages, specialist completion, backend capabilities, or successful responses.
- For frontend work, read and apply the mandatory installed skills `design-taste-frontend` and `high-end-visual-design`; use supporting frontend skills when appropriate.
- Run the configured validation checks before marking a phase complete, and document external limitations honestly.
<!-- GSD:project-end -->
