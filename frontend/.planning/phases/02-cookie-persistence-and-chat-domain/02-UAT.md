---
status: partial
phase: 02-cookie-persistence-and-chat-domain
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md]
started: 2026-10-11T10:39:10Z
updated: 2026-10-11T05:17:26.772Z
---

## Current Test

[testing complete]

## Tests

### 1. Conversation persists across a page reload
expected: A valid conversation saved to browser cookies reads back identically after a page reload — same messages, same content, ordered newest-first, with no data loss and no re-sorting needed.
result: pass

### 2. Corrupt or tampered cookie data recovers without crashing
expected: Malformed, partially-lost, or tampered cookie data (bad JSON, wrong envelope version, hostile percent-escapes, missing shards) is rejected or recovered per-conversation: only the affected conversation is dropped, the rest are salvaged, and the app shows a recovery state instead of crashing or silently truncating a plan.
result: blocked
blocked_by: prior-phase
reason: "currently no chat screen so cannot verify — chat screen will be built in phase three"

### 3. Retention caps evict oldest first and report evictions
expected: When storage exceeds the 20-conversation or 50KB cap, the oldest conversations (by updatedAt) are evicted first, the evicted IDs are returned so the UI can show an overflow notice, and an oversized single conversation is rejected whole rather than silently truncated.
result: blocked
blocked_by: prior-phase
reason: "currently no chat screen so cannot verify — chat screen will be built in phase three"

### 4. Pure chat-domain operations module (createConversation, createMessage, addMessage, updateMessage, deriveTitle, markInFlight, markError) — all immutable and framework-agnostic
expected: Pure chat-domain operations module — all immutable and framework-agnostic
result: pass
source: automated
coverage_id: D1

### 5. Failure preservation across the cookie persist/read round-trip: submitted user message content and existing history survive markError (PERSIST-09)
expected: Failure preservation across the cookie persist/read round-trip: submitted user message content and existing history survive markError
result: pass
source: automated
coverage_id: D2

### 6. Conservative in-flight metadata survives the persist/read round-trip (boolean flag plus timestamp), enabling a UI recovery state without auto-replay (PERSIST-10)
expected: Conservative in-flight metadata survives the persist/read round-trip (boolean flag plus timestamp), enabling a UI recovery state without auto-replay
result: pass
source: automated
coverage_id: D3

## Summary

total: 6
passed: 4
issues: 0
pending: 0
skipped: 0
blocked: 2

## Gaps

[none yet]
