# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Independent travelers and explorers planning custom multi-day trips who require deep, honest research across destinations, transport logistics, weather, and lodging without fake instant results or fabricated progress.

## Product Purpose

Waynora orchestrates a coordinated system of specialist AI agents (Destination Planner, Transport Agent, AccommodationWeather Agent) under a main travel agent to produce comprehensive, real-world travel itineraries. Because deep autonomous research takes 5–15 minutes, Waynora pairs the wait with an honest, elapsed-time waiting experience and an integrated 2048 mini-game so that waiting feels deliberate, transparent, and engaging rather than broken.

## Positioning

Deep-research travel intelligence with total transparency: real synchronous agent execution with no fabricated progress bars, no fake percentages, and no mock itineraries. Conversations are persisted client-side via versioned, validated browser cookies without storing user chats on remote databases.

## Operating Context

- Web application (React 18 + Vite SPA, TypeScript, TailwindCSS + CSS tokens, Convex authentication).
- Backend: FastAPI application exposing synchronous `POST /ask` with checkpointer-backed `thread_id` conversation continuation.
- Real execution times range from 5 to 15 minutes per generation flight.
- Single-flight request lifecycle with elapsed-time-driven waiting copy and isolated 2048 game engagement.

## Capabilities and Constraints

- **Real backend contract**: `POST /ask` with `{ question, thread_id? }` yielding `{ answer, thread_id }`.
- **Honest lifecycle**: Supported client-side timeouts up to 15 minutes; no client-side fake progress percentages.
- **Client persistence**: Chat history is stored strictly in versioned browser cookies (with ~4KB per-cookie chunking and retention caps), never in Convex or remote databases.
- **Convex Auth**: Convex handles email/password user authentication and session tokens only.
- **Attribution**: Clickable "Made by YADAV NITESH" linking to `https://github.com/yadavnitesh86` in a new tab with `rel="noopener noreferrer"`.
- **Quality standards**: Zero critical accessibility violations (axe-core verified), full keyboard navigation, responsive design across mobile (375px), tablet (768px), and desktop (1280px+).

## Brand Commitments

- **Name**: Waynora
- **Visual Identity**: High-end, bespoke luxury travel editorial aesthetic; warm atmospheric depth, cinematic tone, refined typography, and handcrafted finish.
- **Attribution**: "Made by YADAV NITESH" → `https://github.com/yadavnitesh86`.
- **Honesty**: Strictly honest waiting copy; no fake testimonials, no fabricated booking engines or pricing widgets.

## Product Principles

1. **Truth Over Illusion**: Never fabricate progress percentages, per-agent completion checkmarks, or instant mock itineraries.
2. **Intentional Waiting**: Long execution is an honest reflection of deep research; make the wait atmospheric, respectful, and engaging with 2048.
3. **Privacy and Client Sovereignty**: Chat history belongs in client cookies, guarded by strict size bounds and validation.
4. **Editorial Luxury Craft**: The product should feel like a bespoke travel journal and private concierge, not a generic SaaS clone.
