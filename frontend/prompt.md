# Waynora — Full-Stack AI Travel Advisor Website

## 1. Project Overview

Build a complete, polished, production-oriented website named **Waynora**, an AI-powered multi-agent travel planning assistant.

Waynora helps users plan trips by researching destinations, transportation, accommodation, and weather through an AI agent system. Generating a complete travel plan can take approximately **5–15 minutes**, so the website must provide an engaging waiting experience while the backend works.

The application must include:

- A visually impressive landing page.
- User registration, login, and logout.
- A functional AI travel planning chat interface.
- A lightweight, playable 2048 mini-game during long waits.
- Persistent chat history using browser cookies.
- Convex-backed authentication and user-related data.
- Reliable communication with the existing Python backend.
- Responsive layouts for desktop, tablet, and mobile.

**Important:** This is a real application, not a static UI mockup. Implement functional interactions, authentication, API communication, loading states, error recovery, and chat management.

Before making changes, inspect the existing project structure, configuration files, frontend skills, dependencies, and backend code. Reuse existing infrastructure wherever possible instead of rebuilding working functionality.

## 2. Mandatory Frontend Skills and Design Quality

Inspect all relevant installed frontend skills before implementation. Read their instructions and apply the relevant skills throughout the project.

Using the available relevant frontend skills is mandatory, not optional. Follow their guidance for visual design, component architecture, accessibility, responsiveness, and implementation quality.

Do not skip this step or merely claim that the skills were used.

### Design direction

Create a distinctive, premium travel-tech experience. The website must not resemble a generic AI-generated SaaS template.

Avoid:
- Generic gradients applied to every section.
- Repetitive rounded cards and identical feature grids.
- Excessive glassmorphism, glowing effects, and decorative blobs.
- Generic AI-generated marketing copy.
- Unnecessary animations and meaningless interactive elements.
- An interface that looks like a default component-library demo.

Prefer:
- A strong visual identity inspired by travel, exploration, maps, destinations, and editorial travel magazines.
- Deliberate typography, clear visual hierarchy, generous spacing, and a consistent color system.
- High-quality destination imagery where appropriate.
- Asymmetric layouts, meaningful visual storytelling, and carefully composed sections.
- Subtle, purposeful transitions and micro-interactions.
- A coherent design system shared across the landing page, authentication screens, and chat interface.

Choose a cohesive visual direction and implement it consistently. Use installed libraries and existing project dependencies where appropriate. Do not introduce unnecessary dependencies simply to achieve visual effects.

## 3. Landing Page

Create an engaging landing page that immediately communicates what Waynora does.

### Branding

Display the product name as **Waynora** with a consistent logo or wordmark.

Place the following clickable attribution near the Waynora name:

**Made by YADAV NITESH**

Link it to:

https://github.com/yadavnitesh86

Open the GitHub profile in a new tab and use appropriate link security attributes.

### Hero section

Include:
- A compelling headline explaining AI-powered travel planning.
- A concise description of the service.
- A prominent primary CTA, such as "Plan my trip".
- A secondary CTA to explore how Waynora works.
- A distinctive travel-inspired visual composition.

Clearly communicate this message:

"Your personalized trip plan takes approximately 5–15 minutes to generate."

Set realistic expectations without making the product sound unreliable.

### Additional sections

Include meaningful sections such as:
- How Waynora works.
- The three specialist agents.
- What users receive in their trip plan.
- The planning process and expected generation time.
- A final CTA encouraging users to start planning.

Represent the agent architecture accurately:

1. **Destination Planner** — researches destination options and relevant destination information.
2. **Transport Agent** — researches transportation options and journey details.
3. **AccommodationWeather Agent** — researches accommodation and weather information.

The agents work under the coordination of the main travel agent. Do not present them as three unrelated chatbots or invent capabilities that are not implemented in the backend.

Make the landing page visually impressive, responsive, and interactive without sacrificing performance.

## 4. Authentication Using Convex

Convex configuration and existing authentication-related files are available in the project folder. Inspect them before implementing authentication.

Use Convex for user authentication and user-related server-side data.

Requirements:
- Functional signup and login screens.
- Logout functionality.
- Proper authentication state management.
- Protected chat access where appropriate.
- Form validation and helpful feedback.
- Loading and submission states.
- Friendly handling of invalid credentials and authentication failures.
- Responsive and accessible form layouts.
- Session persistence using the authentication approach supported by the existing Convex configuration.

Do not implement fake authentication or store passwords in browser cookies or local storage.

Reuse the existing Convex setup and schema when suitable. Modify it only when necessary.

Do not expose Convex deployment credentials, API secrets, or other private configuration in frontend code.

Keep authentication separate from chat-history persistence: Convex manages users and user-related data, while chat conversations must follow the cookie-based storage requirements described below.

## 5. Existing Python Backend Integration

The Python backend already contains a `/ask` endpoint.

Inspect the `main.py` file in the parent directory to understand:
- The endpoint URL and route.
- The HTTP method.
- The expected request payload.
- The response format.
- Whether requests are synchronous or streamed.
- Existing Pydantic models or structured output schemas.
- Error behavior and timeout requirements.

Do not guess the request schema. Follow the actual backend implementation.

Use the existing local development backend URL found in `main.py` or its configuration. Keep the URL configurable so it can be replaced when the backend is deployed.

Use an environment variable such as `NEXT_PUBLIC_API_BASE_URL` if compatible with the existing frontend framework. If the framework uses a different configuration convention, follow that convention instead.

Never hardcode a production URL or commit secrets.

### Request workflow

When a user submits a travel-planning request:

1. Validate the input.
2. Create a chat if one does not already exist.
3. Immediately display the user's message.
4. Display an appropriate loading state.
5. Send the request to the existing `/ask` endpoint.
6. Wait for the actual backend response.
7. Display the returned travel plan in a readable format.
8. Save the updated conversation to cookie-based storage.
9. Allow the user to continue the conversation when supported by the backend.

The frontend must use the actual API response rather than fabricated example travel plans.

If the response contains structured information or Markdown, render it appropriately and safely.

Support repeated requests and prevent accidental duplicate submissions.

Do not assume the backend supports streaming, job IDs, progress events, cancellation, or conversation memory. Inspect the existing implementation before deciding how to handle these features.

## 6. Long-Running Requests and Timeout Handling

Waynora's agent workflow can take approximately 5–15 minutes.

Configure the frontend request lifecycle to support a maximum waiting period of approximately **15 minutes**, subject to browser, hosting, proxy, and backend limitations.

Do not use a normal short timeout that interrupts a legitimate trip-planning request.

Use an appropriate timeout mechanism, and clean up resources when a request completes or the component unmounts.

Distinguish between:
- A request still processing.
- A network interruption.
- A timeout.
- An HTTP error.
- A malformed response.
- An unexpected application error.

Do not falsely claim that the AI agent is making progress when the backend does not provide progress updates. Instead, communicate honestly that planning is taking time and the request is still waiting for a response.

If the frontend reaches its timeout, explain the situation clearly and offer a retry or recovery action. Do not silently discard the user's request.

Important engineering constraint: a browser-side timeout does not guarantee that the server-side agent stops executing. Do not assume cancellation unless the backend explicitly supports it.

## 7. Dynamic Waiting Messages

Create a varied collection of waiting messages that makes the long generation time feel intentional and engaging.

Display different messages as elapsed waiting time increases, especially after the first five minutes.

Example messages:

- **0–1 minute:** "Let's start putting your next adventure together."
- **1–2 minutes:** "We're gathering the details needed to shape your trip."
- **2–3 minutes:** "Your travel plan is coming together. Hang tight."
- **3–4 minutes:** "We're working through the details to make your itinerary more useful."
- **4–5 minutes:** "Good trips take a little planning. We're still waiting for your personalized plan."
- **5–6 minutes:** "This is taking a little longer than usual, but your request is still waiting for a response."
- **6–7 minutes:** "Your trip plan is taking its time. You can relax and play a quick game while you wait."
- **7–8 minutes:** "We're still waiting for your personalized itinerary to arrive."
- **8–9 minutes:** "Longer planning requests can take a while. Your chat will show the plan when the response arrives."
- **9–10 minutes:** "Still here with you. Keep enjoying the game while we wait for your travel plan."
- **10–12 minutes:** "Your trip is taking longer than expected. We're continuing to wait for the response."
- **12–15 minutes:** Display a reassuring but honest message that the request is taking longer than expected and the user can keep waiting until the timeout.

Implement multiple message variants for each waiting interval and rotate them without repeating the same message consecutively.

Use elapsed time rather than counting how many times a component renders.

Important:
- Do not claim a particular specialist agent has finished unless the backend provides that information.
- Do not show fake progress percentages.
- Do not create messages that promise the response will arrive within a specific number of seconds.
- Keep messages reassuring, concise, and non-repetitive.

If the request finishes early, immediately remove the waiting state and display the response.

## 8. Lightweight 2048 Mini-Game

Embed a fully playable **2048** mini-game in the chat waiting interface.

The purpose is to keep users engaged during the potentially long response-generation process.

### Functional requirements

Implement the standard 2048 rules:
- A 4×4 grid.
- Numbered tiles.
- Movement using arrow keys.
- Swipe controls on touch devices.
- Tile merging according to standard 2048 rules.
- Score tracking.
- Best score tracking within the current game session.
- Win and game-over states.
- Restart functionality.

Ensure that:
- The game remains playable while the agent request is running.
- Game interactions do not submit chat messages.
- Keyboard controls do not interfere with text inputs or textareas.
- Restarting the game does not cancel the AI request.
- The game works on desktop and mobile.
- The implementation does not require a heavy game engine.

Use lightweight React state and deterministic game logic. Separate the game logic from the UI so it can be tested independently.

Prefer a small, self-contained implementation over a large external game dependency.

### Waiting interface

The chat waiting layout should contain:
- A visible waiting indicator.
- The current waiting message.
- An elapsed-time indicator.
- The playable 2048 game.
- A short explanation that Waynora may take 5–15 minutes to generate a trip plan.

The game should complement the chat interface rather than dominate it. Keep the interface responsive and avoid unnecessary animations.

## 9. Chat History and Cookie-Based Persistence

Store conversation history in browser cookies, not in a Convex database or another server-side database.

This requirement applies to chat conversations and messages, not user authentication.

### Chat data

Use a clear data structure for conversations, including:
- A unique chat ID.
- Chat title.
- Creation and update timestamps.
- User messages.
- Assistant responses.
- Relevant message timestamps.
- Any necessary request state that can safely be restored.

Use a structured, versioned format so the storage format can evolve.

### Cookie constraints

Browser cookies have strict size limits, commonly around 4 KB per cookie. A complete itinerary can easily exceed this limit.

Therefore:
- Do not attempt to store unlimited chat history in a single cookie.
- Do not silently truncate conversations.
- Avoid creating an unlimited number of cookies.
- Establish a reasonable maximum for retained history.
- Handle oversized conversations gracefully.
- Preserve useful recent conversations and notify the user when storage limits are reached.
- Never store passwords, access tokens, API keys, or other secrets in custom chat cookies.
- Set appropriate cookie attributes, including `SameSite` and `Secure` in HTTPS production environments, where applicable.

Inspect the existing framework to determine whether cookies can be written directly from the frontend or require a backend route.

If using JavaScript-managed cookies, explain and account for their accessibility and security limitations. Do not imply that client-readable cookies provide protection against malicious scripts.

Where the frontend framework requires server-side cookie access, use an appropriate route or server mechanism without persisting conversations to a database.

Do not silently replace the cookie requirement with local storage, IndexedDB, or Convex.

### Chat list and titles

Provide a sidebar or chat-history panel where users can:
- Create a new chat.
- Switch between previous chats.
- Rename a chat.
- Delete a chat.
- View a chat's title.
- Continue reading previous conversations.

### Automatic chat naming

When creating a chat, derive a short title from the first user message.

For example:

User message: "Plan a five-day trip to Jaipur."

Chat title: "Five-day Jaipur trip"

Use sensible truncation and avoid empty titles.

Also provide a way for users to rename the chat manually.

If the user declines or does not provide a custom name, retain the automatically generated title derived from the beginning of their message.

Do not force a naming dialog before the user can start planning.

## 10. Chat Interface and User Experience

Create a polished chat interface consistent with the landing page.

Include:
- A clear conversation area.
- A message composer.
- A send button.
- A chat-history sidebar.
- New-chat functionality.
- Loading and waiting states.
- Markdown support for assistant responses.
- Readable tables and lists for itineraries.
- Appropriate spacing and typography.
- Responsive mobile navigation.
- Keyboard accessibility.
- Clear distinction between user and assistant messages.

The composer must support multi-line text, and pressing Enter should behave predictably without preventing users from inserting line breaks.

During an active request, prevent accidental duplicate submissions while preserving any additional text the user may be composing.

If the backend supports only one active request per conversation, enforce that constraint in the UI. Do not assume parallel requests are safe.

Keep long responses readable through sensible content width, spacing, and formatting.

The game and waiting information should be displayed only when an AI request is actively waiting for a response.

## 11. Friendly Error Handling

Never expose raw backend tracebacks, internal exception details, API keys, provider error messages, or infrastructure diagnostics in the customer-facing chat.

Show concise, user-friendly messages appropriate to the situation.

Examples:

- Network issue: "We couldn't reach the trip planner. Please check your connection and try again."
- Slow response: "Your trip plan is taking longer than expected. You can keep waiting or try again."
- Temporary server issue: "Waynora is having trouble completing this request right now. Please try again shortly."
- Invalid request: "We couldn't process that trip request. Please check your details and try again."
- Unexpected response: "We received an unexpected response. Your existing conversation has been preserved."

Requirements:
- Preserve the user's submitted message when a request fails.
- Preserve existing conversation history.
- Offer an appropriate retry action.
- Prevent retries from creating accidental duplicate requests.
- Distinguish retryable failures from validation errors.
- Record useful diagnostic information in development logs without exposing sensitive information to users.
- Do not fabricate successful results when the backend fails.

If a request times out, do not automatically assume the agent stopped. A retry might start a second expensive agent execution. Communicate the uncertainty and avoid automatic repeated submissions unless the backend supports idempotency or request-status recovery.

## 12. Architecture and Code Quality

Build the application using the framework and dependencies already present in the project unless there is a clear reason to change them.

Keep the implementation modular.

Suggested separation of responsibilities:

- `components/` — reusable UI components.
- `components/chat/` — conversation UI, message composer, and chat history.
- `components/game/` — 2048 interface.
- `components/landing/` — landing-page sections.
- `components/auth/` — authentication forms.
- `lib/api/` — backend request handling.
- `lib/chat/` — chat models, titles, and conversation utilities.
- `lib/storage/` — cookie-based persistence.
- `lib/game/` — deterministic 2048 logic.
- `lib/convex/` — Convex client and authentication integration.
- `hooks/` — reusable UI and request lifecycle logic.

Treat these paths as suggestions, not mandatory directories. Adapt them to the existing project conventions.

Use:
- Clear component boundaries.
- TypeScript if the frontend project uses TypeScript.
- Explicit types for API requests and responses.
- Schema validation at appropriate boundaries.
- Reusable components and hooks.
- Accessible controls and semantic HTML.
- Clean error handling.
- Minimal and justified dependencies.

Do not put the entire application into one large component.

Do not rewrite the Python agent system unnecessarily. The website is a frontend integration task unless the existing backend requires a small, justified change.

## 13. Security, Performance, and Reliability

Account for:
- Correct CORS configuration between the frontend and Python API.
- Secure handling of authentication sessions.
- Safe Markdown rendering and prevention of script injection.
- Validation of data loaded from cookies.
- Cookie size and retention limits.
- API request timeouts and network failures.
- Duplicate submissions and retry behavior.
- Cleanup of request-related resources.
- Responsive image loading and sensible asset sizes.
- Minimal unnecessary client-side dependencies.
- Keyboard and screen-reader accessibility.

Do not expose secrets in client-side environment variables. Variables prefixed with `NEXT_PUBLIC_` are public and must contain only values intended for browser exposure.

Do not add a database for chat history. Convex should handle authentication and the user-related functionality that genuinely needs server-side persistence.

## 14. Testing and Verification

Do not stop after making the page look correct.

Verify the following workflows:

1. Landing page renders correctly.
2. GitHub attribution opens the correct profile.
3. Signup and login work using the existing Convex configuration.
4. Logout and authentication-state transitions work.
5. The chat submits a request to the actual `/ask` endpoint.
6. A real API response appears correctly in the chat.
7. Long-running requests remain active for the intended duration.
8. Waiting messages change according to elapsed time.
9. The 2048 game supports movement, merging, scoring, restarting, and game-over behavior.
10. Game controls do not interfere with chat inputs.
11. Chats persist across page reloads using cookies.
12. Chat titles are generated from the first user message.
13. Users can rename, switch between, and delete chats.
14. Oversized chat histories are handled gracefully.
15. Network failures and malformed responses produce friendly messages.
16. Mobile layouts and keyboard accessibility work.
17. No raw backend errors or secrets are exposed to users.

Run the available linting, type-checking, and test commands. Fix errors introduced by your changes.

Do not claim that authentication, API integration, or other workflows have been tested successfully if the necessary backend services or credentials are unavailable. Clearly distinguish verified behavior from functionality that requires live configuration.

## 15. Implementation Workflow

Follow this order:

**Phase 1 — Inspect**
- Inspect the repository and existing frontend framework.
- Read the relevant installed frontend skill instructions.
- Inspect the parent directory's `main.py`.
- Inspect Convex configuration, schemas, and authentication setup.
- Identify existing reusable components and dependencies.

**Phase 2 — Plan**
- Establish the visual direction.
- Define the page and component structure.
- Define the frontend request and error-handling flow.
- Decide how cookie storage will respect browser size limits.
- Identify integration blockers before making assumptions.

**Phase 3 — Implement**
- Build the landing page and shared design system.
- Implement Convex-backed authentication.
- Build the chat interface.
- Integrate the existing `/ask` endpoint.
- Implement the long-running waiting experience.
- Add the lightweight 2048 game.
- Implement cookie-based chat persistence and chat management.
- Add friendly errors and responsive behavior.

**Phase 4 — Verify**
- Run checks and available tests.
- Fix integration, layout, and interaction issues.
- Test realistic long-running request scenarios where possible.
- Summarize completed functionality and any unresolved limitations.

## 16. Final Acceptance Criteria

The finished result must be a cohesive, working Waynora website rather than a collection of disconnected screens.

The most important priorities are:

1. A distinctive, professional travel-focused design.
2. Functional Convex-backed authentication.
3. Correct integration with the existing Python `/ask` endpoint.
4. A reliable waiting experience for requests lasting up to approximately 15 minutes.
5. A lightweight, playable 2048 game.
6. Cookie-based chat persistence with explicit size-limit handling.
7. Friendly error handling that preserves user input and conversation history.
8. Maintainable code that follows the project's existing architecture.
9. Responsive and accessible interactions.
10. Actual verification of implemented functionality.

**Final instruction:** Start by inspecting the existing project and all relevant frontend skills. Then implement the complete application using the existing infrastructure. Do not stop at a design proposal, do not replace the real backend with mock responses, and do not silently change the specified storage architecture. If a requirement conflicts with a browser, framework, or hosting limitation, explain the constraint and implement the closest reliable solution without pretending the limitation does not exist.