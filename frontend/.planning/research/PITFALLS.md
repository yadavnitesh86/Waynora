# Pitfalls Research

**Domain:** AI-chat travel planning web frontend with a synchronous long-running FastAPI request, cookie-persisted chats, Convex authentication, and an embedded 2048 game
**Researched:** 2026-10-09
**Confidence:** HIGH for browser, cookie, Markdown, CORS, and Convex constraints; MEDIUM for deployment-specific proxy behavior because the production proxy/host has not yet been selected

## Critical Pitfalls

### Pitfall 1: Treating a synchronous `/ask` call like a normal API request

**What goes wrong:**
The UI applies a conventional 30–60 second fetch timeout, or a reverse proxy closes the connection while the Python agent is still working. The user sees an error even though the backend may continue consuming resources. A naïve retry then starts another 5–15 minute agent run. A proxy may also have its own connect, read, idle, request, or upstream retry limits that are shorter than the product's real wait.

**Why it happens:**
Browser examples usually assume short requests. FastAPI's synchronous response has no job ID, stream, progress event, or cancellation contract. Intermediaries are often configured for ordinary web requests; for example, NGINX documents a default `proxy_read_timeout` of 60 seconds between reads. A request that emits no response bytes for several minutes is therefore vulnerable even if the browser is willing to wait.

**How to avoid:**
- Treat the request as one long-lived operation, not polling or streaming.
- Confirm every hop's timeout and idle behavior (browser, Vite/prod proxy, ingress, CDN, hosting platform, Uvicorn/Gunicorn) supports the maximum wait, or explicitly document that the platform cannot support the contract.
- Do not add an application timeout shorter than the supported 15-minute budget. `AbortController` may stop client observation, but it is not server-side cancellation.
- Persist an in-flight envelope (`question`, conversation/thread identifier, started-at, and request status) before calling `/ask`, so reloads can explain the ambiguous state instead of silently losing it.
- Test a deliberately delayed endpoint through the exact production path, not only against localhost.

**Warning signs:**
Requests consistently fail at a fixed time such as 60 or 100 seconds; browser Network shows `(failed)` while backend logs continue; users receive a response after navigating away; or a deployment returns 502/504 without the Python endpoint logging a completed response.

**Phase to address:**
Phase 1 — API contract and deployment-path spike; Phase 3 — production request lifecycle.

---

### Pitfall 2: Duplicate expensive retries and submissions

**What goes wrong:**
Double-clicking Send, pressing Enter while the first submit is being handled, retrying after a client timeout, or reloading and blindly resubmitting can launch multiple independent agent runs for the same conversation. Responses may arrive out of order, duplicate messages may be persisted, and backend/provider cost and load multiply.

**Why it happens:**
The frontend cannot infer whether a lost connection means the server stopped. A promise rejection is not proof that the server did not execute. React re-renders can also recreate handlers or state unless the active-request guard is held outside the transient render path.

**How to avoid:**
- Enforce the project single-flight rule per conversation: disable submit controls and reject a second send while an active request exists.
- Use a stable client request token/idempotency key in frontend state for correlation even if the current backend ignores it; do not claim server idempotency unless the backend implements it.
- Never automatically retry `/ask` after timeout, network failure, tab wake, or route remount. Offer an explicit “I understand this may start another run” action with the original question preserved.
- Do not enable proxy retries for an already-sent non-idempotent POST; inspect `proxy_next_upstream` or equivalent hosting behavior.
- On success, commit the assistant message and returned `thread_id` exactly once, then clear the in-flight marker atomically with the chat update.

**Warning signs:**
Two `/ask` entries with the same question and nearby timestamps; multiple backend agent traces for one click; a Send button that can be clicked while waiting; or a reload that immediately fires a request without user confirmation.

**Phase to address:**
Phase 3 — request state machine and chat integration.

---

### Pitfall 3: Assuming cookies are an unlimited database

**What goes wrong:**
Chat history grows until a cookie exceeds the roughly 4 KB per-cookie limit, the total cookie header becomes too large, or the browser silently refuses a write. Chunking without a hard cap can create too many cookies and slow every same-origin request. Partial or stale chunks can make JSON parsing fail and erase the apparent history.

**Why it happens:**
Cookie storage is convenient and satisfies Waynora's explicit requirement, but cookies are small, sent with every matching request, and have browser-specific per-domain quotas. JSON, URL encoding, chunk names, and metadata all consume the budget. A write can fail after the in-memory state has already changed.

**How to avoid:**
- Define a versioned envelope and a conservative per-chunk budget below the nominal limit (for example, no more than three chunks of about 3.8 KB each until real browser testing proves otherwise).
- Enforce retention caps by design: maximum chats, messages, and message length. Drop or archive the oldest permitted content deliberately, never by string truncation.
- Use a generation/version marker and validate that all expected chunks exist before accepting a snapshot. Treat missing, duplicate, oversized, invalid-UTF-8, invalid-JSON, and unknown-version data as recoverable corruption.
- Parse every cookie with Zod (or equivalent runtime validation), ignore untrusted extra fields, and fall back to a clean store without crashing the app.
- Surface overflow and recovery to the user; preserve the current unsaved input in memory and offer export/copy if appropriate.
- Store no passwords, Convex session tokens, API keys, or other secrets in these JavaScript-readable chat cookies. Configure `SameSite` and `Secure` appropriately for the deployment.

**Warning signs:**
Chat disappears after adding a long itinerary; `document.cookie` no longer contains the newest chunk; a browser console or server reports a 400/431; only one chunk survives after a failed write; or page/API requests become noticeably larger as chats accumulate.

**Phase to address:**
Phase 2 — persistence codec and limits, before chat UI; Phase 5 — cross-browser/storage failure verification.

---

### Pitfall 4: Rendering AI Markdown as trusted HTML

**What goes wrong:**
An AI answer or travel content containing raw HTML, a `javascript:` link, an unsafe image, or a crafted attribute becomes executable markup. The risk is reintroduced by switching to `dangerouslySetInnerHTML`, enabling `rehype-raw`, using an unsafe URL transform, or adding an unreviewed plugin/custom component.

**Why it happens:**
Markdown looks like presentation data, but the model output is untrusted external input. Convenience renderers often return an HTML string, and “safe by default” only applies to the exact `react-markdown` pipeline and plugins being used.

**How to avoid:**
- Render with `react-markdown` plus `remark-gfm`; do not use `dangerouslySetInnerHTML` or `rehype-raw` for itinerary content.
- Keep the library's safe URL transform, or replace it only with a stricter allowlist for `https`/relative links. Consider disallowing remote images if they are not needed.
- Add `rehype-sanitize` as defense in depth if plugins or raw HTML ever become necessary, and review every `remark`, `rehype`, and component override.
- Treat cookie-loaded assistant messages as equally untrusted; validation of shape is not sanitization of Markdown.
- Add tests for script tags, event attributes, `javascript:` URLs, malformed links, tables, and long code blocks.

**Warning signs:**
The renderer accepts an HTML string; a dependency change adds `rehype-raw`; custom link/image components spread arbitrary props; security tests find an executable URL; or a Markdown answer changes the DOM outside the intended message container.

**Phase to address:**
Phase 1 — message rendering/security contract; Phase 5 — adversarial content and dependency regression tests.

---

### Pitfall 5: Timers and requests outliving the component that created them

**What goes wrong:**
Waiting-message intervals multiply, elapsed time resets on every render, state updates fire after a route change, and an old response overwrites a newly selected chat. A timer may continue after the waiting view unmounts, while aborting every unmount can falsely turn a still-running server operation into a misleading “cancelled” state.

**Why it happens:**
React effects rerun when dependencies are unstable. Developers use an incrementing counter rather than a stable `startedAt`, forget `clearInterval`, or capture stale state in a promise callback. Browser timers are also throttled in background tabs, so tick count is not elapsed time.

**How to avoid:**
- Persist and derive elapsed time from `Date.now() - startedAt`; use a modest interval only to trigger re-rendering and rotate truthful copy.
- Create one timer per mounted waiting surface and clear it in effect cleanup. Remove keyboard, pointer, visibility, and online/offline listeners in the same cleanup.
- Track a request instance/token and ignore stale completions after conversation changes or unmount. Do not let a late response append to the wrong chat.
- Persist the in-flight state before fetch. On remount, show “this request may still be running” rather than assuming the server stopped.
- Use `AbortController` only for an explicit client-observation policy; distinguish `AbortError` from a server error and explain the duplicate-run consequence before resubmission.

**Warning signs:**
Waiting copy changes faster after navigating back; timer callback counts grow; “set state on unmounted component” warnings; elapsed time jumps backward; or a response appears in a different conversation than the one that submitted it.

**Phase to address:**
Phase 3 — request lifecycle and waiting controller; Phase 5 — route-change, reload, background-tab, and unmount tests.

---

### Pitfall 6: Letting the 2048 input layer fight the chat and page

**What goes wrong:**
Arrow keys move the game while the user is navigating or editing a textarea; space/Enter triggers unintended actions; a swipe scrolls the entire page and also moves a tile; touch handlers prevent links/buttons from working; or a game listener remains active after the game closes.

**Why it happens:**
Keyboard listeners are attached to `window` without checking the event target. Swipe handling is implemented as generic `touchstart`/`touchmove` logic without a game boundary, direction threshold, cancellation handling, or a scroll policy. Desktop, touch laptop, and mobile browsers deliver different pointer/touch combinations.

**How to avoid:**
- Prefer a game-scoped focusable surface and explicit accessible controls; if using a global key listener, ignore `input`, `textarea`, `select`, and `[contenteditable]` targets and only handle keys while the game is active.
- Call `preventDefault()` only for recognized moves that the game will consume, never for all key/touch events.
- Use pointer events or a carefully scoped touch implementation with start/end coordinates, a minimum swipe threshold, one move per gesture, and `pointercancel`/`touchcancel` cleanup.
- Apply `touch-action` only to the game surface, not the whole waiting page, and test that vertical page scrolling still works outside it.
- Make controls keyboard accessible and expose game status/score without requiring color or motion.

**Warning signs:**
Typing in chat moves tiles; mobile page scrolling becomes stuck; one swipe makes multiple moves; a closed game still responds to arrows; or screen-reader focus cannot reach a reset/control action.

**Phase to address:**
Phase 4 — self-contained 2048 module; Phase 5 — cross-input accessibility and device testing.

---

### Pitfall 7: Convex auth works locally but fails in production or leaks trust

**What goes wrong:**
Auth routes or schema tables are missing, the client points at the wrong deployment, production JWT/JWKS variables are absent, session persistence is mistaken for chat persistence, or a Convex function trusts a user ID supplied in an argument. Separately, the frontend can call FastAPI locally but fails in production because CORS, origin, protocol, or preflight handling is wrong.

**Why it happens:**
Convex Auth is beta and requires coordinated client, `convex/auth.ts`, `auth.config.ts`, `http.ts`, schema, and deployment configuration. Vite variables are public and build-time. FastAPI sees a different origin when frontend and API are on different hosts; a JSON `POST` can trigger a preflight. The current backend has wide-open CORS, which hides origin mistakes during development and is not a good production policy.

**How to avoid:**
- Follow the verified Convex Auth wiring: `authTables`, password provider flow, `ConvexAuthProvider`, `VITE_CONVEX_URL`, `auth.config.ts`, and `auth.addHttpRoutes(http)`. Pin the beta package versions selected by stack research and test sign-up, login, logout, reload, and protected-route behavior against the production deployment.
- Keep Convex responsible for auth/user data only; never put the cookie chat store in Convex. Use Convex identity from `ctx.auth`/the official helper, not a client-supplied identity argument.
- Set and verify production `JWT_PRIVATE_KEY`/`JWKS` deployment configuration. Never put secrets in `VITE_*`; those values are shipped to the browser.
- Configure FastAPI CORS with explicit production and local frontend origins, allowed methods/headers, and `allow_credentials` only when actually using credentials. Do not assume `allow_origins=["*"]` supports credentialed requests.
- Use the Vite dev proxy to reduce local CORS noise, but test the real cross-origin URL and `OPTIONS` preflight in staging.

**Warning signs:**
Convex reports missing provider/JWT configuration; auth state oscillates between loading and logged out; a protected route renders before auth resolves; production requests show CORS errors or 400 preflight responses; or a function returns another user's data when passed their ID.

**Phase to address:**
Phase 1 — auth/config foundation; Phase 3 — API integration; Phase 5 — deployment and authorization audit.

---

### Pitfall 8: Faking progress to hide a real wait

**What goes wrong:**
The UI shows percentages, per-agent completion, countdowns, or “almost done” claims that the backend cannot observe. If the answer takes longer, the user loses trust; if the UI reaches 100% before the response, it looks broken. Messages may also imply cancellation or background completion that the system cannot guarantee.

**Why it happens:**
Five to fifteen minutes is uncomfortable, and progress bars are a familiar UI pattern. The backend exposes only one synchronous request and final `{answer, thread_id}`; there are no agent events or job status updates. Designers may confuse elapsed time with work completed.

**How to avoid:**
- Use elapsed-time-driven, non-numeric waiting copy: explain that the real planner is still working, name only the documented agent roles, and avoid claiming any role has finished.
- Use the 2048 game as an intentional waiting affordance, not evidence of backend progress.
- State the expected range honestly without promising a deadline; provide the original prompt and clear current conversation context.
- Preserve input/history on errors and explain that retrying may start another expensive run. Do not silently retry.
- Measure actual request durations in observability separately from what is shown to users.

**Warning signs:**
Copy says “73% complete” without a server event; agent cards animate through completed states; a countdown reaches zero; a game completion is presented as planner completion; or the UI promises a result after a fixed number of seconds.

**Phase to address:**
Phase 3 — waiting UX and request state machine; Phase 5 — content review against the honesty requirement.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Set a 60-second frontend timeout | Prevents a request from looking stuck | Guarantees false failures for the core 5–15 minute use case and encourages duplicate retries | Never for the primary `/ask` operation; a separate network diagnostic may have a bounded timeout |
| Retry every failed `fetch` automatically | Recovers from transient network errors in ordinary APIs | Can double or triple an expensive non-idempotent agent run | Never unless the backend gains an explicit idempotency contract and the retry policy is server-aware |
| Store all chats in one JSON cookie | Minimal persistence code | Hits per-cookie/domain limits, inflates every request, and makes corruption all-or-nothing | Only for a bounded prototype fixture; production needs a versioned, capped codec |
| Save a truncated string when the cookie is too large | Keeps the write from throwing | Produces invalid JSON or silently destroys the user's conversation | Never; drop whole oldest records under a documented cap and notify the user |
| Use `dangerouslySetInnerHTML` for easier Markdown styling | Fast visual output | Turns model output into an XSS surface | Never for untrusted answers |
| Attach game controls to `window` | Keyboard handling is easy to demo | Breaks chat editing, navigation, accessibility, and cleanup | Only as a tested fallback with strict target and active-game guards |
| Allow `*` CORS permanently | Makes local integration work | Weakens origin control and fails with credentials | Local development only; production origins must be explicit |
| Abort fetch on every route unmount and show “cancelled” | Avoids stale UI updates | Server may continue; user may unknowingly launch a duplicate | Only when the product explicitly labels this as client-side detachment and preserves ambiguous-run state |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| FastAPI `POST /ask` | Guessing fields, expecting streaming, or treating HTTP 500 as proof no work occurred | Send exactly `{ question, thread_id? }`; handle `{ answer, thread_id }`; preserve the prompt/thread on every failure |
| Reverse proxy / ingress | Leaving default read/idle timeout or enabling upstream retry for POST | Configure and verify a timeout greater than the supported maximum, disable unsafe retries, and run a delayed end-to-end test |
| Convex Auth | Installing pieces without matching schema/config/http/provider setup, or using `NEXT_PUBLIC_*` in Vite | Use the documented Convex Auth React wiring, exact deployment variables, and `VITE_CONVEX_URL`; test auth state before rendering protected UI |
| FastAPI CORS | Assuming wildcard origins work with cookies/Authorization, or testing only via Vite proxy | Use explicit origins and credentials settings; inspect browser preflight and production HTTPS behavior |
| Cookie codec | Reading one chunk and ignoring missing siblings or old versions | Validate envelope/version/generation, reject incomplete snapshots, migrate known versions, and recover visibly |
| Markdown renderer | Adding `rehype-raw` or custom URL/component logic for formatting convenience | Keep raw HTML disabled, retain safe URL handling, sanitize when plugins are introduced, and test hostile model output |
| Browser lifecycle | Treating client abort/unmount as server cancellation | Persist in-flight state and distinguish “client stopped waiting” from “server returned an error” |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Unbounded cookie chunks | Large request headers, slow navigation, rejected writes | Hard cap chunks/chats/messages and measure encoded bytes before writing | First long itinerary or after a handful of retained chats, browser-dependent |
| Multiple active agent runs | Backend/provider load and costs scale faster than users; inconsistent replies | Per-conversation single-flight guard, explicit retry confirmation, proxy retry audit | Two clicks or one timeout/reload is enough to trigger it |
| Polling a synchronous endpoint | Repeated expensive plans, server saturation, no real progress | One fetch only; use elapsed UI, not polling | Immediately; every poll is another `/ask` call |
| Re-render-driven timer increments | Timer drift, duplicate intervals, unnecessary renders | Stable `startedAt`, one interval, cleanup, coarse tick frequency | After route remounts or long background-tab waits |
| Rendering very large Markdown repeatedly | Janky waiting/result view and high memory use | Cap response/message size, memoize message rendering where measured, and avoid unnecessary state churn | Long multi-agent itineraries on mobile first |
| Cookie sent on every same-origin request | Unrelated requests carry chat payload and auth-adjacent data | Keep payload small, scope path where possible, and confirm the architecture's request paths | As soon as chat history occupies multiple chunks; especially slow mobile networks |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Rendering raw AI Markdown/HTML | Stored/reflected XSS can execute when a malicious answer or cookie is displayed | `react-markdown` safe defaults, no `dangerouslySetInnerHTML`/`rehype-raw`, safe URL transform, sanitize if extending pipeline |
| Treating cookie data as trusted | A user or injected script can edit chat contents, add oversized/malformed records, or attempt prototype-pollution-shaped data | Runtime schema validation, plain data structures, strict limits, safe recovery, and no execution of cookie fields |
| Putting auth/session secrets in chat cookies | JavaScript-readable cookies expose credentials to XSS and chat data is sent broadly | Let Convex Auth manage its session; chat cookies contain only bounded, non-secret conversation data |
| Trusting a client-provided Convex user ID | User impersonation or cross-user data access | Derive identity from Convex auth context and enforce ownership in every function |
| Shipping secrets as `VITE_*` | Build output exposes API keys or deployment secrets | Treat all Vite-prefixed variables as public; keep secrets in Convex/backend deployment configuration |
| Leaving wildcard CORS in production | Untrusted sites can call the API from browsers; credentialed behavior becomes confusing and unsafe | Explicit origin allowlist, correct HTTPS/credentials policy, and preflight tests |
| Opening every Markdown link/image without policy | Phishing, tracking, unsafe protocols, or external content leakage | Allow safe protocols, consider a stricter link/image policy, and add `rel="noreferrer noopener"` for new-tab links |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Show a spinner with no explanation for 15 minutes | Users assume the app froze and refresh/retry | Explain the real wait, show elapsed time or neutral stage copy, and provide the game and conversation context |
| Present fabricated agent progress | Users believe an unsupported status and lose trust when timing varies | Describe the documented multi-agent architecture without claiming live per-agent completion |
| Clear the input on submit | A lost request or reload loses the user's trip details | Preserve the submitted question and in-flight envelope until success/final discard |
| Treat every network error as safe to retry | Users unknowingly pay for duplicate work | Explain ambiguity and require deliberate confirmation before another run |
| Let game controls steal chat input or page scroll | Keyboard and mobile users cannot use the core app comfortably | Scope focus/input, use accessible buttons, threshold swipes, and test touch + keyboard coexistence |
| Hide cookie overflow/corruption | Users think history is reliable until it silently vanishes | Show a concise recovery/retention notice and keep the active unsaved text available |
| Redirect before auth state resolves | Flicker, lost route intent, or accidental access to protected chat | Render an auth loading boundary, then redirect/render based on resolved Convex state |

## "Looks Done But Isn't" Checklist

- [ ] **Long request:** The browser tolerates 15 minutes, and the actual proxy/ingress path has been tested with a delayed response beyond its default timeout.
- [ ] **Request safety:** Double-submit, Enter repeat, reload, tab wake, and route remount cannot silently start a second `/ask` run.
- [ ] **Ambiguous failure:** Client abort, proxy 504, offline transition, and backend 500 preserve the question, thread ID, history, and a clear retry warning.
- [ ] **Cookie persistence:** Encoded byte limits, chunk count, total-domain behavior, version migration, partial writes, malformed JSON, and overflow notification are tested in more than one browser.
- [ ] **Authentication:** Convex schema/provider/config/http wiring, production JWT/JWKS variables, protected routes, session reload, logout, and wrong-user authorization are verified.
- [ ] **CORS/config:** Vite proxy is only a development convenience; production `OPTIONS` and `POST` requests succeed with explicit origin configuration and the correct public `VITE_*` variables.
- [ ] **Markdown:** Hostile HTML, event handlers, `javascript:` links, images, and custom plugin/component paths are tested; no raw HTML sink exists.
- [ ] **Waiting timers:** Elapsed time derives from a stable timestamp; intervals, listeners, and stale promise completions are cleaned up on unmount and conversation switch.
- [ ] **2048 input:** Keyboard, buttons, pointer/swipe, textarea editing, page scrolling, touch cancellation, focus, reset, and screen-reader status all work independently.
- [ ] **Honesty:** No fake percentages, countdowns, fabricated agent completion, or guaranteed response time appears in copy or animation.
- [ ] **Responsive recovery:** Refreshing during a run produces a truthful resume/reattempt decision instead of a blank chat or automatic duplicate request.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Proxy closes a long request | HIGH | Capture proxy/backend timestamps and status; raise or remove the relevant timeout where supported; verify no upstream retry; rerun a delayed staging test; keep client failure copy honest until verified |
| Duplicate agent runs | HIGH | Stop automatic retries; correlate logs by question/request marker; preserve one canonical response; add single-flight and explicit retry confirmation before enabling more traffic |
| Cookie overflow or corruption | MEDIUM | Keep the in-memory active chat; discard only invalid snapshot chunks; restore the last valid generation; apply retention caps; notify the user and provide copy/export where possible |
| Unsafe Markdown path introduced | HIGH | Disable the offending plugin/sink immediately; add hostile-content regression tests; migrate existing rendered messages through the safe renderer; review URL and component overrides |
| Timer/stale update leak | LOW/MEDIUM | Centralize lifecycle cleanup; clear intervals/listeners; add request instance checks; reproduce with rapid route changes, reloads, and delayed promises |
| Game steals page/chat input | LOW | Scope listeners to the game and active focus; remove global handlers; add pointer cancellation and target filtering; verify with keyboard and mobile interaction tests |
| Convex auth/config or CORS failure | MEDIUM/HIGH | Check deployment URL/env values and Convex logs; verify auth schema/config/http setup; inspect browser preflight; narrow/fix origin and credentials settings; retest from a production-like origin |
| Misleading progress shipped | MEDIUM | Remove unsupported numbers/stages; replace with elapsed, neutral copy; review every loading state against the actual `/ask` contract |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Synchronous request/proxy timeout | Phase 1: API/deployment contract spike | Delayed endpoint survives the complete frontend-to-production-proxy path for the target budget |
| Duplicate expensive retries | Phase 3: request state machine | Automated/manual double-submit, timeout, reload, and late-response tests show at most one intentional active request per conversation |
| Cookie limits/malformed data | Phase 2: persistence codec | Round-trip, size-boundary, partial-chunk, malformed, old-version, overflow, and browser-specific tests pass |
| Markdown/XSS | Phase 1: rendering/security foundation | Hostile Markdown renders as inert text/links; dependency and custom-component review confirms no raw HTML sink |
| Timer/unmount lifecycle | Phase 3: waiting controller | Fake timers and route-switch tests show one interval, no stale state update, and stable elapsed time across remounts |
| Keyboard/swipe conflicts | Phase 4: 2048 module | Keyboard/textarea, pointer, touch-scroll, cancel, focus, and accessibility tests pass on desktop and mobile breakpoints |
| Convex auth/config/CORS | Phase 1 foundation + Phase 5 deployment hardening | Signup/login/reload/logout and protected routes pass; production-origin preflight/POST and authorization-negative tests pass |
| Dishonest progress UX | Phase 3 waiting UX + Phase 5 content review | Copy audit finds no fabricated percentage, agent completion, countdown, or response guarantee |

## Sources

- Waynora `.planning/PROJECT.md` — authoritative project contract: synchronous `POST /ask`, 5–15 minute wait, no streaming/job IDs/cancellation, cookie-only chat history, single-flight and honesty constraints. **HIGH**
- Waynora `.planning/research/STACK.md` — selected React/Vite/Convex Auth/cookie codec/Markdown patterns and verified package constraints. **HIGH**
- [MDN: Using HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Cookies) — browsers usually limit cookies to about 4 KB each, domains have quotas, and cookies are sent with every request; security and SameSite guidance. **HIGH**
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — aborts client-side asynchronous operations/fetch consumption; does not establish server-side cancellation semantics. **HIGH**
- [NGINX `proxy_read_timeout`](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_read_timeout) — documents proxy read timeout behavior and the 60-second default between reads; deployment-specific settings still require verification. **HIGH**
- [FastAPI: CORS](https://fastapi.tiangolo.com/tutorial/cors/) — origin definition, preflight behavior, wildcard limitations with credentials, and explicit `CORSMiddleware` configuration. **HIGH**
- [Convex Authentication](https://docs.convex.dev/auth) — Convex Auth is the client-side React option, is beta, and Convex functions must authenticate/authorize requests. **HIGH**
- [react-markdown README](https://github.com/remarkjs/react-markdown) — safe-by-default React rendering, URL protocol allowlist, raw HTML risks, plugin/component caveats, and `rehype-sanitize` guidance. **HIGH**
- [MDN: `setInterval()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval) and [MDN: Touch events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events) — timer cleanup/drift and touch cancellation/default-action considerations. **HIGH**

---
*Pitfalls research for: Waynora*
*Researched: 2026-10-09*
