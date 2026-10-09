# Stack Research

**Domain:** AI-chat travel planning web frontend (SPA, client-heavy, no SSR)
**Researched:** 2026-10-09
**Confidence:** HIGH (all versions verified against npm registry today; auth + markdown behavior verified against official docs)

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React + React DOM | 19.3.0 | UI framework | First-class citizen of the officially blessed Convex template (`npm create convex@latest` → "React (Vite) + Convex Auth"). All Convex Auth React APIs (`ConvexAuthProvider`, `useAuthActions`, `useConvexAuth`) target plain React — no framework server needed. React 19.3.0 satisfies react-router 8's `>=19.2.7` peer requirement. [HIGH] |
| Vite | 8.3.4 | Build tool + dev server | The officially documented Convex Auth path is "React (Vite)"; Vite needs no server runtime, starts instantly, HMR is excellent, works flawlessly on Windows. App is a pure client SPA (chat + cookies + game) — SSR/RSC machinery would be dead weight. Vite 8 is Rolldown-based (faster builds). [HIGH] |
| @vitejs/plugin-react | 6.1.2 | React Fast Refresh + JSX | Standard Vite React plugin; requires `vite ^8.0.0` (satisfied). Its extra peers (oxc-transform-react, @rolldown/plugin-babel, babel-plugin-react-compiler) are all marked optional — clean install verified via peerDependenciesMeta. [HIGH] |
| TypeScript | 7.0.2 | Type safety | TS 7 (native Go compiler) is now the npm `latest` and is language-compatible with 5.x. Vite transpiles without typechecking, so TS is used only for `tsc` checks and editor support — low-risk adoption. Fallback documented below if any tooling (typescript-eslint, convex typecheck) misbehaves. [MEDIUM-HIGH] |
| Tailwind CSS | 4.3.3 | Styling system | Current major (v4). CSS-first `@theme` tokens map directly onto the premium design-token requirements from the mandatory design skills (typography scale, spacing, palette). Official Convex Vite template pairs Tailwind with Vite. Zero config file needed — plugin + `@import "tailwindcss"`. [HIGH] |
| @tailwindcss/vite | 4.3.3 | Tailwind Vite integration | First-party plugin, no PostCSS setup. Version must match `tailwindcss` exactly. [HIGH] |
| React Router | 8.4.0 | Client routing | Three routes (landing, auth, chat) + protected-route redirect. Declarative `<BrowserRouter>` mode is all that's needed. v8 is current `latest` on npm. [HIGH] |
| Convex | 1.46.0 | Backend client (auth only) | Already installed; 1.46.0 verified as current npm latest — keep it. Chat history must NEVER go into Convex (explicit project constraint). [HIGH] |
| @convex-dev/auth | 0.0.96 | Email/password auth | **The** official Convex Auth library (get-convex/convex-auth). Docs recommend it for "client-side React web apps served from a CDN" — exactly this app. `Password` provider covers sign-up/sign-in with server-side hashing (bcrypt via @auth/core) — no third-party service, no custom crypto. Currently **beta**: pin exact version (no `^`). [HIGH — verified against labs.convex.dev/auth] |
| @auth/core | 0.41.1 (pin) | Convex Auth dependency | Required peer of @convex-dev/auth (`^0.41.1`). Convex docs pin `@auth/core@0.41.1` in their install command — match that pin to avoid drift. (0.41.3 is latest but the docs command pins 0.41.1.) [HIGH] |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-markdown | 10.1.0 | Safe Markdown rendering of AI answers | Always, for every assistant message. Verified **safe by default**: builds React elements from syntax tree, no `dangerouslySetInnerHTML`, raw HTML is escaped/ignored unless you add `rehype-raw` (don't). `defaultUrlTransform` only allows http/https/irc/ircs/mailto/xmpp + relative URLs — blocks `javascript:` URLs. [HIGH — verified against official README] |
| remark-gfm | 4.0.1 | Tables, task lists, strikethrough, autolinks | Always. Travel itineraries arrive as GFM tables/lists; this is the plugin that renders them. [HIGH] |
| rehype-sanitize | 6.0.0 | Defense-in-depth sanitizer | Optional but recommended as a belt-and-braces layer over react-markdown's defaults. Mandatory if anyone ever adds `rehype-raw` or unvetted remark plugins later. [MEDIUM-HIGH] |
| js-cookie | 3.0.8 (+ @types/js-cookie 3.0.6) | Cookie read/write with attributes | Chat persistence writer. Tiny (~1KB), battle-tested, handles `expires`/`SameSite`/`Secure`/`path` encoding. Chunking across multiple cookies (`waynora.chats.00`, `.01`, …) stays custom (~40 lines) — no library does versioned chunked envelopes; write it and unit-test it. [HIGH] |
| zod | 4.6.5 | Form + data validation | Validate sign-up inputs (email format, password rules client-side mirror) and — critically — **validate/parse everything loaded back from cookies** before render (versioned envelope schema). Convex Auth docs explicitly recommend Zod for this. [HIGH] |
| motion | 14.0.0 | Landing-page animation | Optional. `motion/react` for scroll-triggered reveals and hero entrance on the premium landing page. Skip if the design direction is achieved with CSS transitions alone — it's the only "nice-to-have" in this list. (This is Framer Motion, renamed; `framer-motion` package is legacy.) [MEDIUM-HIGH] |
| lucide-react | 1.53.0 | Icons | Menu, send, trash, game controls, auth toggles. Tree-shakeable. [HIGH] |
| @fontsource-variable/fraunces | 5.3.0 | Display serif (editorial travel identity) | Self-hosted variable font — no Google Fonts CDN dependency (GDPR-clean, offline dev, no render-blocking third-party request). Matches the editorial-magazine design direction. Final face choice belongs to the design skill in the UI phase; the *mechanism* (fontsource self-hosting) is the recommendation. [HIGH] |
| @fontsource-variable/inter | 5.3.0 | Body sans | Pair for Fraunces. Same rationale. [HIGH] |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest | 5.0.3 | Unit tests | Test the pure-logic modules: 2048 board reducer (merge mechanics), cookie chunk codec (round-trip, overflow, version migration), markdown component config. No DOM needed for these — `environment: 'node'`. |
| ESLint | 10.12.0 | Linting | Flat config (`eslint.config.js`). |
| typescript-eslint | 8.71.1 | TS-aware lint rules | If it has friction with TS 7, either bump or fall back to TS 5.9.3 — see Version Compatibility. |
| Prettier | 3.9.9 | Formatting | Standard; avoids style debates. |
| Node | ≥ 20.19 (have 26.7.0) | Runtime | Vite 8 requires Node 20.19+/22.12+; current env (26.7.0) is fine. |

## Installation

```bash
# Core (run in frontend/)
npm install react@19.3.0 react-dom@19.3.0 react-router@^8.4.0 \
  convex@^1.46.0 @convex-dev/auth@0.0.96 @auth/core@0.41.1 \
  tailwindcss@^4.3.3 @tailwindcss/vite@^4.3.3 \
  react-markdown@^10.1.0 remark-gfm@^4.0.1 rehype-sanitize@^6.0.0 \
  js-cookie@^3.0.8 zod@^4.6.5

# Optional (landing polish + icons + type)
npm install motion@^14.0.0 lucide-react@^1.53.0 \
  @fontsource-variable/fraunces@^5.3.0 @fontsource-variable/inter@^5.3.0

# Dev dependencies
npm install -D vite@^8.3.4 @vitejs/plugin-react@^6.1.2 typescript@^7.0.2 \
  @types/react@^19.3.0 @types/react-dom@^19.3.0 @types/js-cookie@^3.0.6 \
  vitest@^5.0.3 eslint@^10.12.0 typescript-eslint@^8.71.1 prettier@^3.9.9
```

### package.json changes (required)

```json
{
  "type": "module",
  "scripts": {
    "dev": "convex dev",
    "dev:ui": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  }
}
```

- Flip `"type": "commonjs"` → `"type": "module"` — Vite 8 config and the whole ecosystem are ESM-native; Convex function files are TS transpiled by the Convex CLI and are unaffected.
- `dev` (convex) and `dev:ui` (vite) run in two terminals. If a single command is preferred, add `concurrently` later — not installed by default (minimal deps).

### Minimal Vite config (`vite.config.ts`)

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Dev convenience: fetch('/api/ask') → FastAPI, sidesteps dev CORS entirely.
      // In production the backend CORS is already `allow_origins=["*"]`, so the
      // app can also call VITE_API_BASE_URL directly.
      "/api": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
});
```

### Environment variables (Vite convention — NOT `NEXT_PUBLIC_*`)

`.env.local` (already present for Convex) gains:

```
VITE_CONVEX_URL=https://<deployment>.convex.cloud   # emitted by `convex dev`
VITE_API_BASE_URL=http://localhost:8000             # used when not proxying /api
```

All `VITE_*` variables are public by definition (baked into the client bundle) — never put secrets in them. The FastAPI URL is not a secret (open CORS), but keep it configurable per project constraints.

### Convex Auth wiring (verified against labs.convex.dev/auth)

1. `npm install @convex-dev/auth @auth/core@0.41.1` (already in install above), then `npx @convex-dev/auth` scaffolds the files below (or create manually):
2. `convex/schema.ts`: spread `authTables` from `@convex-dev/auth/server` into the currently-empty `defineSchema({})`.
3. `convex/auth.ts`:

```ts
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});
```

4. `convex/auth.config.ts`: `{ providers: [{ domain: process.env.CONVEX_SITE_URL, applicationID: "convex" }] }`.
5. `convex/http.ts`: `httpRouter()` + `auth.addHttpRoutes(http)`.
6. Client: wrap the app with `ConvexAuthProvider` (from `@convex-dev/auth/react`) around/inside `ConvexReactClient(import.meta.env.VITE_CONVEX_URL)`.
7. Sign-up/sign-in UI: `useAuthActions().signIn("password", formData)` with a hidden `flow` field (`"signUp"` | `"signIn"`). Session state: `useConvexAuth()` or the `Authenticated`/`Unauthenticated`/`Loading` components. Auth session token is managed by ConvexAuthProvider itself — it does **not** live in the chat cookies.
8. Password rules: default is ≥8 chars; tighten via `validatePasswordRequirements` and validate email via `profile` + Zod (both documented patterns).
9. Production deployment needs `JWT_PRIVATE_KEY` + `JWKS` env vars on the Convex deployment (`npx @convex-dev/auth --prod` sets the minimal set; key generation script in the manual-setup docs). `SITE_URL` is only needed for OAuth/magic links — not for password-only auth.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vite + React SPA | Next.js (15/16) | Only if server-rendered SEO pages become a hard requirement for the marketing site. Three decisive points against it here: (1) no SSR/streaming need anywhere in this app; (2) Convex Auth's own docs mark Next.js support **experimental / under active development** while React (Vite) is the first-class documented path; (3) Next adds a Node server runtime, heavier Windows dev loop, and RSC complexity that a client-side cookie-chat app cannot use. If SEO later matters, prerender just the landing route (static HTML) instead of switching frameworks. [HIGH] |
| js-cookie | universal-cookie (8.1.2) | If cookies ever need to be written from server code (universal-cookie's reason to exist). This app writes cookies client-side only; js-cookie is smaller with an immutable-friendly API. [HIGH] |
| Native `fetch` | axios / ky | If many endpoints, interceptors, or upload progress were needed. There is exactly one endpoint (`POST /ask`) plus Convex's own WebSocket transport. `fetch` + `AbortController` covers the 15-minute request; note a client abort does NOT stop server execution (single-flight guard must stay independent of the request). [HIGH] |
| react-markdown | marked/markdown-it + DOMPurify + `dangerouslySetInnerHTML` | Only if custom syntax beyond GFM were required. The sanitizer route is a strictly larger XSS surface and loses react-markdown's component mapping (needed to style itinerary tables/lists properly). [HIGH] |
| React state + Context | Zustand / Redux / TanStack Query | If client state outgrew a handful of contexts. Chat state lives in cookies + component state; auth state comes from ConvexAuthProvider; server state comes from Convex queries. No global store needed at this scale. [HIGH] |
| Hand-rolled Tailwind components | shadcn/ui + Radix primitives | If the UI were standard dashboard chrome. The mandatory design skills demand bespoke premium travel-editorial components; shadcn's aesthetic is recognizable and fights that direction. Reach for individual Radix primitives later only if an a11y-heavy primitive (dialog, dropdown) is hand-built and struggles. [MEDIUM-HIGH] |
| motion (v14) | CSS transitions/keyframes only | If bundle budget matters more than scroll-choreography. CSS can cover hover/micro-interactions; motion earns its place for landing-page scroll reveals and hero entrance. [MEDIUM] |
| TypeScript 7.0.2 | TypeScript ~5.9.3 | If any tool in the chain (typescript-eslint 8, Convex push typecheck, editor language features) shows friction with the brand-new TS 7 line. 5.9.3 is the newest fully-battle-tested 5.x. This is a one-line downgrade. [MEDIUM-HIGH] |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Next.js / Remix (SSR frameworks) | No SSR requirement; Convex Auth Next.js support is explicitly experimental (verified in official docs); adds server runtime + deployment complexity for zero benefit; heavier on Windows | Vite + React Router SPA [HIGH] |
| `dangerouslySetInnerHTML` (directly or via marked/markdown-it) | Renders untrusted AI output as raw HTML — XSS vectors; AI answers are untrusted input | react-markdown 10 (safe by default, verified) + remark-gfm [HIGH] |
| `rehype-raw` | Re-enables raw HTML in markdown — the exact hole react-markdown closes; itinerary content never needs it | Leave HTML escaped; use `components` map for styling [HIGH] |
| localStorage / IndexedDB for chat history | Explicit project requirement demands cookies (Out of Scope section forbids DB, requirement demands browser cookies); localStorage would silently violate it | js-cookie + custom versioned chunked envelope, Zod-validated on load [HIGH] |
| Auth0 / Clerk / WorkOS | External service + cost + vendor lock-in for an email/password flow Convex Auth covers natively; project constraint says Convex handles auth | @convex-dev/auth Password provider [HIGH] |
| Custom password hashing / homemade JWTs | Crypto mistakes are catastrophic and unfixable post-launch; forbidden by project constraints ("no fake auth, no client-stored credentials") | Convex Auth server-side hashing (via @auth/core) [HIGH] |
| Storing chats in Convex | Explicitly out of scope (PROJECT.md) — Convex holds auth data only | Cookie chunk store [HIGH] |
| Game engines (Phaser, Kaboom, PixiJS) for 2048 | Multi-hundred-KB dependency for a grid-merge game; physics/render loop unneeded | Self-contained React reducer + CSS transforms, Vitest-tested (per Key Decisions in PROJECT.md) [HIGH] |
| axios / ky / superagent | One synchronous endpoint; native fetch + AbortController suffice; fewer deps to audit | Native `fetch` [HIGH] |
| Fake streaming / fake progress % / per-agent progress bars | Backend `/ask` is synchronous and exposes none of it; honesty is a hard project constraint | Elapsed-time-driven waiting messages + 2048 game [HIGH] |
| Polling/WebSocket client for the planning request | Backend offers no job IDs or progress events; polling would just re-fire the expensive synchronous call | Single fetch, single-flight guarded, elapsed-time UI [HIGH] |
| moment.js, lodash, classnames++, date-fns | YAGNI at this scope; ES2025 + React cover the needs | Native APIs; add only when a concrete need appears [HIGH] |
| `NEXT_PUBLIC_*` env var names | That's Next.js convention; Vite bakes `VITE_*` and ignores `NEXT_PUBLIC_*` — a silent misconfiguration bug | `VITE_API_BASE_URL`, `VITE_CONVEX_URL` [HIGH] |

## Stack Patterns by Variant

**If email verification is required at sign-up:**
- Configure `Password({ verify: ResendOTP })` with a Resend email provider (documented pattern in Convex Auth); needs a Resend account + `AUTH_RESEND_KEY` env var on the Convex deployment.
- Adds sign-up friction; defer to a later phase unless required at launch. Without it, accounts are unverified (acceptable for this project's MVP; noted as a product decision, not a stack one). [HIGH — verified pattern]

**If password reset is required:**
- `Password({ reset: <email provider> })` + two-step reset form (`flow: "reset"` → `"reset-verification"`). Same Resend dependency as above.
- Recommendation: defer. Without reset, the Password provider still fully supports sign-up/sign-in; document "contact to reset" for MVP. [HIGH — verified pattern]

**If cookie payload regularly overflows 2–3 chunks:**
- Enforce retention caps in the store layer (e.g., ≤10 chats, ≤50 messages total, oldest-dropped + visible user notification) rather than growing chunk count — every cookie is re-sent by the browser on every same-origin request, so 4–5 chat cookies already add real request overhead.
- Cap the number of chunk cookies (e.g., 3 × ~3.8KB usable) as a hard design limit. [HIGH]

**If the long request dies (mobile background/tab sleep):**
- This is a browser-runtime constraint, not a stack one: nothing in this stack keeps a fetch alive through OS background-throttling. Persist the in-flight state (question + thread_id + started-at) into the cookie store immediately on submit, so a reload can detect "a run was in flight" and offer an honest re-submit warning (retries start a second expensive agent run — per PROJECT.md timeout budget). [HIGH]

**If landing-page SEO becomes important:**
- The Vite build emits static HTML but with an empty SPA shell. Prerender the landing route (e.g., a small prerender plugin or a hand-written static `landing.html`) rather than adopting a framework. Low priority for this project. [MEDIUM]

**If TS 7 friction appears:**
- `npm i -D typescript@~5.9.3` — newest fully-proven 5.x; everything in this stack is TS-version-agnostic (Vite transpiles per-file, no typecheck). [MEDIUM-HIGH]

**If React Compiler is wanted later:**
- `@vitejs/plugin-react` 6 lists `babel-plugin-react-compiler` as an optional peer — it can be enabled incrementally without re-architecting. Not recommended at project start (beta compiler + new codebase). [MEDIUM]

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| @convex-dev/auth 0.0.96 | convex ^1.17.0 | Installed 1.46.0 satisfies (verified peer range). Pin @convex-dev/auth exactly (beta — breaking changes possible in minors). |
| @convex-dev/auth 0.0.96 | @auth/core ^0.41.1 | Docs' install command pins `@auth/core@0.41.1` — use that exact pin. |
| @convex-dev/auth 0.0.96 | react ^18.2.0 \|\| ^19 | React 19.3.0 satisfies. |
| react-router 8.4.0 | react >=19.2.7, react-dom >=19.2.7 | React 19.3.0 satisfies (verified peer range). |
| @vitejs/plugin-react 6.1.2 | vite ^8.0.0 | Vite 8.3.4 satisfies; other peers (oxc-transform-react, @rolldown/plugin-babel, babel-plugin-react-compiler) are optional (verified peerDependenciesMeta). |
| @tailwindcss/vite 4.3.3 | tailwindcss 4.3.3 | Keep versions identical. Tailwind v4 targets modern browsers only — fine for this product. |
| TypeScript 7.0.2 | used only for `tsc` + editor | Vite/esbuild transpiles independently. If typescript-eslint 8.71.1 or Convex typecheck objects → `typescript@~5.9.3`. |
| Vite 8.x | Node ≥ 20.19 / ≥ 22.12 | Environment has Node 26.7.0 ✓. Windows fully supported. |
| react-markdown 10.1.0 | Node 16+, all modern browsers | ESM-only — another reason `"type": "module"` is required. |

## Stack Confidence Summary

| Area | Confidence | Basis |
|------|------------|-------|
| Core framework (Vite + React + Router + Tailwind) | HIGH | npm-verified versions; React (Vite) is the officially blessed Convex template path |
| Convex Auth (@convex-dev/auth) | HIGH for choice / MEDIUM-HIGH for stability | Verified as the official library + exact setup; **beta** status means possible breaking changes — hence exact pin |
| Markdown rendering | HIGH | Security model verified directly against official README (safe by default; URL transform; sanitize guidance) |
| Cookie strategy (js-cookie + custom chunking) | HIGH for library / MEDIUM for chunk pattern | js-cookie verified; chunking is necessarily custom — unit-test it (Vitest) before trusting it |
| TS 7 adoption | MEDIUM-HIGH | Verified `latest` on npm; ecosystem friction with brand-new major possible → documented fallback |
| Game input (no library) | HIGH | Keyboard + pointer events are stable platform APIs; no dependency exists that's worth its weight for one 4×4 grid |

## Sources

- npm registry (`npm view`, 2026-10-09) — all versions and peer ranges: HIGH
- https://docs.convex.dev/auth — Convex Auth is the official library for client-side React apps; beta status; HIGH
- https://labs.convex.dev/auth/setup — install command (`@auth/core@0.41.1` pin), `authTables` schema, `ConvexAuthProvider` + `VITE_CONVEX_URL` wiring; HIGH
- https://labs.convex.dev/auth/config/passwords — `Password` provider, `flow` signUp/signIn, validation hooks, reset/verify flows; HIGH
- https://labs.convex.dev/auth/setup/manual — `auth.config.ts`, `http.ts`, `JWT_PRIVATE_KEY`/`JWKS` production env vars; HIGH
- https://labs.convex.dev/auth/production — `npx @convex-dev/auth --prod` minimal env setup; HIGH
- https://github.com/remarkjs/react-markdown (README, main branch) — "safe by default", HTML escaping, `defaultUrlTransform` protocol allowlist, `rehype-sanitize` guidance, ESM-only; HIGH
- npm peerDependencies/peerDependenciesMeta for @convex-dev/auth, react-router, @vitejs/plugin-react — compatibility claims; HIGH

---
*Stack research for: AI-chat travel planning web frontend (Waynora)*
*Researched: 2026-10-09*
