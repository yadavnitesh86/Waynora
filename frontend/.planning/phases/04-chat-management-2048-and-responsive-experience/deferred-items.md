# Deferred Items — Phase 04

Out-of-scope discoveries logged during plan execution. These are NOT part of any plan's deliverable; they are recorded so they are visible at ship time.

## Pre-existing lint warnings in Convex-generated files (logged 2026-10-14, plan 04-01)

`eslint . --max-warnings 0` reports 3 warnings, all "Unused eslint-disable directive (no problems were reported)":

- `frontend/convex/_generated/api.js` (1:1)
- `frontend/convex/_generated/dataModel.d.ts` (1:1)
- `frontend/convex/_generated/server.d.ts` (1:1)

These files are Convex code-generation output. No plan in any phase touches them, and the deviation rules' scope boundary puts pre-existing warnings in unrelated files out of scope. The plan's own files lint clean (scoped `eslint` over the 8 plan files exits 0).

**Suggested resolution:** regenerate the Convex files (`npx convex codegen` or the project's codegen step) so the emitted disable directives match the installed ESLint version, or add `convex/_generated` to the ESLint ignore list. Owner: whoever next runs the Convex codegen toolchain.
