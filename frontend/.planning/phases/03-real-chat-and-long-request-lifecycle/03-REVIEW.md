---
phase: 03-real-chat-and-long-request-lifecycle
reviewed: 2026-10-13T12:59:29Z
depth: standard
files_reviewed: 31
files_reviewed_list:
  - src/ErrorBoundary.test.tsx
  - src/ErrorBoundary.tsx
  - src/components/chat/AssistantMessage.tsx
  - src/components/chat/ChatComposer.test.tsx
  - src/components/chat/ChatComposer.tsx
  - src/components/chat/ChatThread.test.tsx
  - src/components/chat/ChatThread.tsx
  - src/components/chat/RecoveryBlock.test.tsx
  - src/components/chat/RecoveryBlock.tsx
  - src/components/chat/StorageNotice.tsx
  - src/components/chat/UserMessage.tsx
  - src/components/chat/WaitingShell.test.tsx
  - src/components/chat/WaitingShell.tsx
  - src/components/chat/waitingCopy.test.ts
  - src/components/chat/waitingCopy.ts
  - src/components/ui/TextArea.test.tsx
  - src/components/ui/TextArea.tsx
  - src/components/ui/index.ts
  - src/components/ui/primitives.test.tsx
  - src/hooks/useAskController.test.ts
  - src/hooks/useAskController.ts
  - src/hooks/useElapsedClock.test.ts
  - src/hooks/useElapsedClock.ts
  - src/lib/chat/failure.test.ts
  - src/lib/chat/failure.ts
  - src/lib/chat/requestController.test.ts
  - src/routes/Chat.lifecycle.test.tsx
  - src/routes/Chat.test.tsx
  - src/routes/Chat.tsx
  - src/routes/index.tsx
  - src/test/a11y.test.tsx
findings:
  critical: 2
  warning: 5
  info: 3
  total: 10
status: issues_found
---

# Phase 3: Code Review Report

**Reviewed:** 2026-10-13T12:59:29Z
**Depth:** standard
**Files Reviewed:** 31
**Status:** issues_found

## Summary

All 31 in-scope files were read in full, with cross-file tracing into
`src/lib/chat/requestController.ts`, `src/lib/api/ask.ts`, `src/lib/chat/domain.ts`,
`src/lib/cookie/repository.ts`, `src/lib/env.ts`, `eslint.config.js`, and the phase
contracts (`.planning/REQUIREMENTS.md`, `03-UI-SPEC.md`, `03-03-PLAN.md`).

The lifecycle architecture itself is solid: the controller's single-flight rule,
stale-result rule, budget-timer cleanup, and request-id monotonicity are correctly
implemented and thoroughly tested; the failure taxonomy maps every
`AskErrorKind × abortSource` combination; recovery copy is verbatim and never leaks
diagnostics; the transcript carries no live region; hostile Markdown is inert.

However, **two blocking defects sit in exactly the seams the tests do not cover**:

1. The `Stop waiting` control is wired to the DOM global `window.stop()` instead of
   the controller's `stop()` — the D-32 escape hatch is a no-op in production, and
   the `aborted` state is unreachable from the UI.
2. The elapsed clock measures time **since route mount**, not since the request
   started — the "Elapsed" readout and the six-band waiting copy are wrong for
   essentially every real session (they can open directly at band D–F on a fresh
   request).

Verification evidence: `npm run typecheck` clean, `npm run lint` 0 errors,
`npx vitest run` **314/314 passing**. Passing tooling and tests do not catch either
defect — `lib.dom.d.ts` declares `stop()`, so tsc and eslint both accept the
mis-wiring, and no test submits after a delay or clicks `Stop waiting` at route
level.

## Critical Issues

### CR-01: `Stop waiting` calls the DOM global `window.stop()`, not the controller's `stop()`

**File:** `src/routes/Chat.tsx:52` (missing destructure) and `src/routes/Chat.tsx:246`
**Issue:**
`useAskController` is destructured as `const { status, submit } = useAskController(...)`
— `stop` is never pulled out. The WaitingShell prop is then written as
`<WaitingShell elapsedMs={elapsed} onStop={stop} />`. Because `lib.dom.d.ts` declares
`declare function stop(): void;` (verified at `node_modules/typescript/lib/lib.dom.d.ts:38830`),
TypeScript resolves the free identifier `stop` to `window.stop`, so this compiles and
passes lint (typescript-eslint disables `no-undef`; `eslint.config.js` has no
react-hooks or custom undefined-vars rule).

At runtime, clicking **Stop waiting** executes `window.stop()` — the browser's
"stop loading this page" API — which aborts nothing. The `fetch` keeps running, the
budget timer keeps counting, status stays `waiting`, and the message stays in-flight
until the 20-minute timeout finally fires. Consequently:
- D-32 / WAIT-05's "deliberate escape hatch" is dead in the shipped app.
- `mapRequestFailure("abort", "user") → "aborted"` and the `aborted` recovery copy
  ("Waiting stopped.") are unreachable through any UI path.
- STATE.md:144 explicitly records this as a contract: "C-14 `Stop waiting` wired to
  the controller's `stop()`".

`tsc`, `eslint`, and all 314 tests pass — the only tests covering this control assert
that `WaitingShell` invokes its `onStop` prop (`WaitingShell.test.tsx:81`), which it
does; the prop itself is wired to the wrong function.

**Fix:**
```tsx
const { status, submit, stop } = useAskController({
  conversationId: conversation.id,
});
```
(`onStop={stop}` at line 246 then resolves to the hook's `stop`, which delegates to
`controller.stop()`.) Add a route-level regression test that submits, clicks
`Stop waiting`, settles the fake ask with `{ ok: false, kind: "abort" }`, and asserts
the `Waiting stopped.` recovery block renders.

### CR-02: Elapsed clock measures time since route mount, so the readout and band copy are wrong for every request

**File:** `src/hooks/useElapsedClock.ts:11-17` (baseline captured at mount), consumed at `src/routes/Chat.tsx:77`
**Issue:**
`useElapsedClock()` runs unconditionally for the lifetime of the `Chat` route:
`startedAt` is fixed at route mount and the interval ticks from then on. The value is
fed straight into `<WaitingShell elapsedMs={elapsed} />`, which labels it **"Elapsed"**
directly beside "Plans usually take 5 to 15 minutes." and uses it to select the band
copy.

The clock is never started when a request starts and never reset between requests.
Consequences in real usage (any session where submit does not happen within the first
second of mount):
- User reads history for 4 minutes, then submits: the shell immediately shows
  `Elapsed 4:00` and band B/C copy ("Gathering destination ideas.") for a request
  that is 0 seconds old.
- Second turn after a long browsing session can open directly at band D/E/F
  ("This is taking longer than usual. Keep waiting, or stop and try again.") for a
  request that just started.
- After an earlier failed/stopped turn, a later retry inherits the accumulated
  mount time.

This is an honesty defect, not cosmetics: `03-UI-SPEC.md:256` contracts
`submitting` → "Waiting shell with elapsed `0:00`, band A", and WAIT-03 requires an
**honest** elapsed time. `03-UI-SPEC.md:323`: "The panel is honest at every elapsed
second." (Note: `03-03-PLAN.md:152` itself specified "milliseconds since mount", so
the plan contradicts the UI-SPEC it cites — the implementation followed the wrong one.
UI-SPEC is the binding contract.)

Tests miss this because `Chat.lifecycle.test.tsx` advances fake timers only *after*
submit, so mount time and request time coincide (`elapsed === 0` at line 135).

**Fix:** Start (and reset) the baseline when the request starts, not when the route
mounts. Either:
```tsx
// useElapsedClock.ts — active-gated clock with a per-request baseline
export function useElapsedClock(active: boolean): number {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!active) { setElapsed(0); return; }
    const startedAt = Date.now();
    setElapsed(0);
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    return () => clearInterval(id);
  }, [active]);
  return elapsed;
}
```
…or move the hook inside `WaitingShell` so its mount coincides with the waiting state.
Either way, add a route test that advances fake timers **before** submitting and
asserts the shell opens at `0:00` / band A. (This also stops the currently-constant
per-second re-render of `Chat` while idle.)

## Warnings

### WR-01: The rejection path never maps the abort source — a rejecting `ask` reports `unexpected` for stop/timeout

**File:** `src/lib/chat/requestController.ts:170-175`
**Issue:** The success path maps failures through
`mapRequestFailure(result.kind, activeAbortSource)`, but the `.catch()` path hardcodes
`failure: "unexpected"` and ignores `activeAbortSource` entirely. `askBackend`
happens to resolve `{ ok:false, kind:"abort" }` on abort, so production is safe today
— but the controller's contract accepts any `ask` (the JSDoc at line 61 advertises
injectability, and the `.catch` exists precisely because rejections are expected).
Any `ask` that rejects with an `AbortError` (the common fetch-wrapper pattern) turns
a deliberate user Stop into "Something unexpected happened." instead of
"Waiting stopped.", and a 20-minute budget abort into `unexpected` instead of
"This request took too long." — wrong customer-facing copy for the two most
important lifecycle events, and `activeAbortSource` becomes dead state.
**Fix:** Inspect the rejection before classifying:
```ts
.catch((err) => {
  if (disposed || requestId !== activeRequestId) return;
  const isAbort = err instanceof Error && err.name === "AbortError";
  emit({
    kind: "failed",
    requestId,
    failure: isAbort
      ? mapRequestFailure("abort", activeAbortSource)
      : "unexpected",
  });
})
```

### WR-02: Abort during response-body read is classified as `malformed`, not `abort`

**File:** `src/lib/api/ask.ts:47-55` (cross-file — called by the reviewed lifecycle)
**Issue:** The `fetch` call site checks for `AbortError` (line 31), but the
`await response.json()` call has its own bare `catch` that returns
`{ ok:false, kind:"malformed" }` for **any** error. If the user clicks Stop (or the
budget timer fires) after response headers arrive but while the body is still being
read — a narrow but real window, and exactly the path a `Stop waiting` click after
CR-01 is fixed can hit — the user gets "We received a response we couldn't read."
instead of "Waiting stopped." / "This request took too long.".
Secondary robustness note: the abort check is `err instanceof DOMException && err.name === "AbortError"`,
which fails for cross-realm/polyfilled abort errors and would then misreport an abort
as a `network` failure ("Check your connection").
**Fix:**
```ts
} catch (err) {
  if (err instanceof Error && err.name === "AbortError") {
    return { ok: false, kind: "abort", message: CUSTOMER_MESSAGES.abort };
  }
  ...
  return { ok: false, kind: "malformed", message: CUSTOMER_MESSAGES.malformed };
}
```
and use the same `err.name === "AbortError"` check at line 31 instead of the
`instanceof DOMException` conjunction.

### WR-03: Enter during IME composition submits the partially composed text

**File:** `src/components/chat/ChatComposer.tsx:22-30`
**Issue:** `handleKeyDown` fires on `e.key === "Enter" && !e.shiftKey` with no
`e.nativeEvent.isComposing` check (verified: `isComposing`/`nativeEvent` appear
nowhere in `src/`). For a Japanese/Chinese input method, the Enter that *commits* a
composition also reports `key === "Enter"`, so the composer submits whatever
half-typed text is in the draft, clears the draft, and refocuses — the user loses the
text they were composing and sends a truncated request to a 15-minute backend job.
`preventDefault()` also swallows the commit, leaving the IME in a broken state.
**Fix:**
```ts
if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
  e.preventDefault();
  handleSubmit();
}
```
(Same guard belongs on the form's submit path if it becomes reachable from a
composition session.)

### WR-04: `appliedRequestIdRef` is never reset when the controller is recreated — first terminal status after a conversation change is silently dropped

**File:** `src/routes/Chat.tsx:65, 176-183`
**Issue:** The one-shot guard is `appliedRequestIdRef.current === status.requestId`.
`useAskController` disposes and **recreates** its controller on `conversationId`
change, and `requestId` restarts at `1` for every controller instance
(`requestController.ts:78`). The Chat-level guard keeps its old value, so the first
terminal status of the new controller (`requestId: 1`) matches and is skipped: the
answer is never appended, the message stays `inFlight` forever, and no recovery block
appears — a permanently stuck transcript.

Latent today because Phase 3 never changes `conversation.id` (the comment at
`Chat.tsx:29-33` says multi-conversation is Phase 4), but `useAskController` is
explicitly built, documented, and tested for conversation switching (WAIT-06,
`useAskController.test.ts:125`), and `Chat.tsx` passes `conversationId` for exactly
that purpose. Phase 4 will inherit this bug silently.
**Fix:** Reset the guard whenever the conversation (and therefore the controller)
changes:
```ts
useEffect(() => {
  appliedRequestIdRef.current = 0;
}, [conversation.id]);
```
(or key the guard on a controller-generation counter exposed by the hook).

### WR-05: `ask` / `timeoutMs` options are captured at first render and silently ignored afterwards

**File:** `src/hooks/useAskController.ts:38-47, 56-65`
**Issue:** The controller is created once from `options?.ask` / `options?.timeoutMs`
and both effects are keyed only on `[conversationId]`. A caller that passes an inline
closure — `useAskController({ ask: (req, sig) => myAsk(req, sig, token) })` — keeps
the **first render's** closure forever; state/props captured in it go stale with no
error and no lint warning (`eslint.config.js` has no
`eslint-plugin-react-hooks`, so `exhaustive-deps` never runs). The public interface
(`UseAskControllerOptions`) gives no indication the values are first-render-only.
Current `Chat.tsx` passes neither, so nothing breaks today, but the hook is
documented as the general adapter and tests inject `ask`.
**Fix:** Either (a) include `ask`/`timeoutMs` in the effect deps and recreate the
controller when they change (preserving dispose semantics), or (b) read them through
a ref updated each render (`optionsRef.current = options`) and have `submit` use
`optionsRef.current.ask`, and document the choice in the interface JSDoc.

## Info

### IN-01: Misleading variant-math comments in `WaitingShell.test.tsx`

**File:** `src/components/chat/WaitingShell.test.tsx:26, 45`
**Issue:** Line 26 says "band A variant 1 at 0ms" but asserts variant **0**
("Reading your request."). Line 45 says `900000/45000 = 20 % 2 = 0 -> variant 1`
(arithmetic and label both wrong — `20 % 2 = 0`, and the asserted string *is*
variant 0). The assertions are correct; only the comments lie, which is actively
misleading when someone later "fixes" the test to match its comment.
**Fix:** Correct the comments to "band A variant 0 at 0ms" and
"`20 % 2 = 0 -> variant 0`".

### IN-02: Lint/typecheck config cannot catch identifier or hook-dependency defects (root cause of CR-01/WR-05)

**File:** `eslint.config.js:1-10`
**Issue:** The flat config enables only `@eslint/js` recommended +
`typescript-eslint` recommended. `typescript-eslint` disables `no-undef` (TypeScript
already resolves identifiers — including DOM globals like `stop()`), and there is no
`eslint-plugin-react-hooks`, so both the undefined-identifier class of bug in CR-01
and the stale-dependency class in WR-05 are invisible to the repo's stated
validation checks (`npm run lint`, `npm run typecheck`).
**Fix:** Add `eslint-plugin-react-hooks` (`recommended` rules catch missing deps) and,
optionally, `no-undef`-equivalent coverage for value positions tsc accepts (a
`no-restricted-globals` rule listing `stop`, `close`, `focus`, etc.).

### IN-03: `StorageNotice` mounts already populated, so its `role="status"` may never be announced

**File:** `src/components/chat/StorageNotice.tsx:12-27`, rendered conditionally at `src/routes/Chat.tsx:249`
**Issue:** The notice is conditionally inserted with its full content present at
insertion time (`{showStorageNotice ? <StorageNotice /> : null}`). Screen readers
generally do **not** announce a live region whose content exists when the region
itself enters the DOM — the exact scenario PERSIST-05 wants announced. This is a
soft a11y gap (the notice is visually prominent and non-blocking by design), not a
contract violation on paper (`role="status"` is correctly used, never `alert`).
**Fix:** Keep the live region mounted and swap its content:
```tsx
<div role="status" className={showStorageNotice ? "mb-lg ..." : "sr-only"}>
  ...copy...
</div>
```
so the announcement fires when the text changes.

---

_Reviewed: 2026-10-13T12:59:29Z_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: standard_
