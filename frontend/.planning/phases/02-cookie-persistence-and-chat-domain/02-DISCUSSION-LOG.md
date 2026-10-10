# Phase 2: Cookie Persistence and Chat Domain - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-10
**Phase:** 2-Cookie Persistence and Chat Domain
**Areas discussed:** Cookie envelope & versioning, Chunking strategy, Retention & size caps, Chat domain model

---

## Discussion Summary

The user requested direct CONTEXT.md creation from roadmap plan details rather than interactive Q&A. Decisions were derived from:

- ROADMAP.md Phase 2 goal, success criteria, and plan descriptions
- REQUIREMENTS.md PERSIST-01..05, PERSIST-09, PERSIST-10
- Phase 1 CONTEXT.md decisions D-01..D-14 (carried forward)
- Existing codebase patterns (Zod validation, error taxonomy, UI primitives)

## Key Decision Areas

### Cookie Envelope & Versioning
- **Decision:** Single versioned JSON envelope, integer version field, reject-and-reset on unknown version
- **Rationale:** Simple, explicit, no partial migration complexity

### Chunking Strategy
- **Decision:** Fixed ~3.5 KB chunks with index cookie, FIFO eviction, visible notification on overflow
- **Rationale:** Stays safely under 4 KB limit, predictable behavior, no silent truncation

### Retention & Size Caps
- **Decision:** ~20 conversations or ~50 KB total cap, oldest evicted first, visible user notification
- **Rationale:** Reasonable for a travel planning chat, prevents unbounded growth

### Chat Domain Model
- **Decision:** Conversation (id, title, timestamps, messages, threadId) + Message (id, role, content, metadata)
- **Rationale:** Clean separation, framework-agnostic, fully testable

### the agent's Discretion
- Exact chunk size, Zod schema internals, file naming, test structure, directory layout details

## Deferred Ideas
- Chat sidebar UI — Phase 4
- Real `/ask` execution, waiting room, 2048 — Phases 3-4
- Compression (if chunking insufficient) — agent's discretion within this phase

---
