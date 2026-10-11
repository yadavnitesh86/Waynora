# Deferred Items — Phase 02 Plan 02 (02-02)

Out-of-scope discoveries logged during 02-02 execution. Not fixed here
(deviation scope boundary: pre-existing issues in unrelated files).

| # | Found during | Item | Why out of scope | Recommendation |
|---|--------------|------|------------------|----------------|
| 1 | Task 1 full-suite verification | `src/app.composition.test.tsx` ("renders AuthProvider over App without a nested \<Router\>") fails intermittently under full-suite parallelism on this machine: its `findByText` timeout is the testing-library default (1s), and jsdom environment setup across 16 files takes 30–100s, so the main thread can be blocked past the timeout. Passes in isolation (~1.3s); unrelated to chat code (nothing imports `src/lib/chat/`). | Pre-existing fragility in a Phase 1 regression test; fixing it would modify an unrelated file. | Raise the `findByText` timeout (e.g. `findByText(/Plan a trip worth the wait/i, {}, { timeout: 10_000 })`) in a future hardening pass. 02-02 removed one unnecessary jsdom instance (pure domain tests run in the node environment), which restored full-suite stability (187/187). |
| 2 | Task 1 RED evidence | Vitest's `tap-flat` reporter emits multi-line YAML diagnostic blocks that the strict TAP parser (used by `gsd-tools check tdd-red-evidence`) rejects as non-TAP data. | Tooling incompatibility, not a product issue. | Evidence records carry the TAP stream with diagnostic blocks stripped (plan, test names, pass/fail preserved); complete unmodified reports are committed alongside as `02-02-red-task{1,2}-tap.txt`. |
