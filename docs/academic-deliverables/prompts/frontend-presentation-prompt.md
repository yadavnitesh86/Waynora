# Frontend Presentation Generation Prompt

## Instructions for the AI Agent

You are generating a frontend-focused academic presentation for **Member 2** of the Waynora project. This presentation will be delivered to faculty evaluating a Semester V computer-science project.

---

## Presentation Constraints

- **Slide count**: 15–20 slides
- **Duration**: 10–15 minutes
- **Audience**: Faculty evaluators (professors, examiners)
- **Focus**: User interface, user experience, frontend/backend integration, and actual frontend engineering work
- **Tone**: Professional, academic, technically precise but accessible

---

## Pre-Generation Requirements

### 1. Inspect the Repository

Before creating slides, verify all technical claims by reading:
- `frontend/src/routes/index.tsx` — Routing structure
- `frontend/src/routes/Chat.tsx` — Chat interface
- `frontend/src/routes/Landing.tsx` — Landing page
- `frontend/src/components/chat/WaitingShell.tsx` — Waiting experience
- `frontend/src/components/chat/ChatComposer.tsx` — Chat input
- `frontend/src/components/chat/ChatThread.tsx` — Message display
- `frontend/src/components/chat/ChatSidebar.tsx` — Conversation history
- `frontend/src/components/game/Game2048.tsx` — 2048 game
- `frontend/src/lib/game/2048/engine.ts` — Game engine
- `frontend/src/lib/api/ask.ts` — API client
- `frontend/src/lib/chat/requestController.ts` — Request lifecycle
- `frontend/src/lib/chat/failure.ts` — Error taxonomy
- `frontend/src/lib/cookie/` — Cookie persistence
- `frontend/src/lib/cookie/codec.ts` — Cookie chunking
- `frontend/src/lib/cookie/schema.ts` — Zod validation
- `frontend/src/auth/AuthProvider.tsx` — Auth context
- `frontend/convex/` — Convex setup
- `frontend/src/ErrorBoundary.tsx` — Error boundary
- `frontend/prompt.md` — Original specification
- `frontend/AGENTS.md` — GSD workflow evidence
- `PRODUCT.md` — Product positioning

### 2. Fill Placeholders

Replace every `[[PLACEHOLDER]]` with the appropriate value. If unknown, use `[TO BE SUPPLIED: description]`.

### 3. Academic Integrity

- Never claim a frontend feature works unless verified.
- Distinguish verified facts from assumptions.
- Describe AI-assisted development honestly.
- Do not expose API keys, credentials, or sensitive data.

---

## Slide Structure

### Slide 1: Title Slide

**Content:**
- Project title: "Waynora: A Multi-Agent AI Travel Advisor"
- Subtitle: "Frontend Architecture and User Experience"
- Member 1: [[PLACEHOLDER: Name]], [[PLACEHOLDER: Enrollment Number]]
- Member 2: [[PLACEHOLDER: Name]], [[PLACEHOLDER: Enrollment Number]]
- [[PLACEHOLDER: College Name]]
- [[PLACEHOLDER: Academic Year]]
- [[PLACEHOLDER: Project Guide Name]]

**Speaker Notes:** Brief introduction. State that this presentation focuses on the frontend architecture, user experience, and the engineering work done to build the interface.

**Time:** 30 seconds

---

### Slide 2: Agenda

**Content:**
1. User Journey Overview
2. Frontend Architecture
3. Component Structure
4. Routing and Navigation
5. Authentication with Convex
6. Chat Interface
7. API Communication
8. Request Lifecycle Management
9. Waiting Experience and 2048 Game
10. Cookie-Based Persistence
11. Error Handling
12. Responsive Design
13. GSD Workflow and AI-Assisted Development
14. Challenges and Solutions
15. Learning Outcomes and Viva Preparation

**Speaker Notes:** Walk through the agenda. Emphasize that the presentation covers the complete user journey from landing page to completed itinerary.

**Time:** 30 seconds

---

### Slide 3: User Journey Overview

**Content:**
Show the user journey:
1. **Landing Page** — Learn about Waynora, see value proposition
2. **Sign Up / Sign In** — Create account or log in with Convex Auth
3. **Chat Interface** — Enter travel requirements
4. **Waiting State** — See honest elapsed time, play 2048 game
5. **Itinerary Response** — View comprehensive travel plan
6. **Conversation Management** — Switch, rename, delete chats

**Visual:** Flow diagram of the user journey with screenshots at each step.

**Speaker Notes:** Walk through the user journey step by step. Emphasize that the design prioritizes honesty — no fake progress, no fabricated results. The waiting experience is a key differentiator.

**Time:** 1.5 minutes

---

### Slide 4: Frontend Architecture

**Content:**
- Framework: React 18 with TypeScript
- Build tool: Vite
- Routing: React Router (createBrowserRouter)
- Styling: TailwindCSS + CSS custom properties (design tokens)
- State management: React hooks (useState, useEffect, custom hooks)
- Validation: Zod schemas
- Authentication: Convex Auth
- Persistence: Browser cookies (versioned, chunked)

**Architecture diagram:**
```
┌─────────────────────────────────────────────┐
│                  App.tsx                     │
│              (RouterProvider)                │
├─────────────────────────────────────────────┤
│  RootLayout (Header, Main, Footer)          │
├──────────┬──────────┬──────────┬────────────┤
│ Landing  │ SignIn   │ SignUp   │   Chat     │
│  Page    │   Page   │   Page   │   Page     │
├──────────┴──────────┴──────────┴────────────┤
│         AuthProvider (Convex)                │
├─────────────────────────────────────────────┤
│  API Layer (lib/api/ask.ts)                  │
│  Request Controller (lib/chat/)              │
│  Cookie Persistence (lib/cookie/)            │
└─────────────────────────────────────────────┘
```

**Speaker Notes:** Explain the layered architecture. The App component provides routing, RootLayout provides the app shell, and each page is a self-contained route. The AuthProvider wraps the entire app for authentication context.

**Time:** 1.5 minutes

---

### Slide 5: Component Structure

**Content:**
Show the component hierarchy:

```
src/
├── components/
│   ├── landing/          # Landing page sections
│   │   ├── LandingHero.tsx
│   │   ├── HowItWorks.tsx
│   │   ├── AgentCards.tsx
│   │   ├── TravelFaq.tsx
│   │   └── ...
│   ├── auth/             # Authentication forms
│   │   ├── SignInForm.tsx
│   │   ├── SignUpForm.tsx
│   │   └── useAuthForm.ts
│   ├── chat/             # Chat interface
│   │   ├── ChatThread.tsx
│   │   ├── ChatComposer.tsx
│   │   ├── ChatSidebar.tsx
│   │   ├── WaitingShell.tsx
│   │   └── ...
│   ├── game/             # 2048 game
│   │   └── Game2048.tsx
│   └── ui/               # Shared primitives
│       ├── Button.tsx
│       ├── Spinner.tsx
│       └── ...
├── hooks/                # Custom hooks
│   ├── useAskController.ts
│   ├── useConversations.ts
│   └── ...
├── lib/                  # Business logic
│   ├── api/ask.ts
│   ├── chat/
│   ├── cookie/
│   └── game/2048/
└── routes/               # Page components
    ├── index.tsx
    ├── Landing.tsx
    ├── Chat.tsx
    └── ...
```

**Speaker Notes:** Explain the separation of concerns — components are presentational, hooks manage state, lib contains business logic, and routes compose everything. The UI primitives layer ensures consistency across all pages.

**Time:** 1.5 minutes

---

### Slide 6: Routing and Navigation

**Content:**
- React Router with `createBrowserRouter`
- Lazy loading with `React.lazy()` and `Suspense`
- Protected routes for authenticated pages

**Routes:**
| Path | Page | Access |
|------|------|--------|
| `/` | Landing | Public |
| `/signin` | SignIn | Public |
| `/signup` | SignUp | Public |
| `/chat` | Chat | Protected |
| `*` | NotFound | Public |

**Code excerpt** (from `routes/index.tsx`):
```typescript
const Chat = lazy(() => import("./Chat"));
// ...
{
  path: "/chat",
  element: (
    <Suspense fallback={null}>
      <ProtectedRoute>
        <Chat />
      </ProtectedRoute>
    </Suspense>
  ),
}
```

**Speaker Notes:** Explain why lazy loading is used — it reduces initial bundle size by loading each page only when needed. The ProtectedRoute component ensures only authenticated users can access the chat.

**Time:** 1 minute

---

### Slide 7: Authentication with Convex

**Content:**
- Convex Auth with password provider
- AuthProvider context wraps the app
- Sign-in and sign-up forms with validation
- Protected routes redirect unauthenticated users

**Authentication flow:**
1. User enters email/password
2. Form validates input (Zod schema)
3. Convex Auth API called
4. On success: user redirected to chat
5. On failure: friendly error message shown

**Key components:**
- `frontend/convex/auth.ts` — Convex Auth configuration
- `frontend/convex/auth.config.ts` — Provider configuration
- `frontend/src/auth/AuthProvider.tsx` — React context
- `frontend/src/components/auth/SignInForm.tsx` — Sign-in form
- `frontend/src/components/auth/SignUpForm.tsx` — Sign-up form

**Speaker Notes:** Explain that Convex handles authentication server-side, storing user credentials securely. The frontend never sees passwords after submission. Session tokens are managed by Convex and stored in browser storage.

**Time:** 1.5 minutes

---

### Slide 8: Chat Interface

**Content:**
The chat interface is the core of the application:

- **ChatThread**: Displays conversation messages with Markdown rendering
- **ChatComposer**: Multi-line input with send button
- **ChatSidebar**: Conversation history with create, switch, rename, delete
- **WaitingShell**: Elapsed time, dynamic messages, 2048 game

**Key features:**
- Real-time message display
- Markdown rendering for itineraries
- Auto-generated chat titles from first message
- Conversation persistence across page reloads
- Keyboard accessibility

**Speaker Notes:** Walk through the chat interface components. Emphasize that the interface is designed for long conversations — messages are displayed clearly, and the composer supports multi-line input for detailed travel requirements.

**Time:** 1.5 minutes

---

### Slide 9: API Communication

**Content:**
- Single API endpoint: `POST /ask`
- Request: `{ question: string, thread_id?: string }`
- Response: `{ answer: string, thread_id: string }`
- Configurable base URL via `VITE_API_BASE_URL`

**Code excerpt** (from `lib/api/ask.ts`):
```typescript
const response = await fetch(`${env.VITE_API_BASE_URL}/ask`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(askRequestSchema.parse(request)),
  signal,
});
```

**Request states:**
1. **Idle** — No active request
2. **Submitting** — User pressed send, request initiated
3. **Waiting** — Request in flight, waiting for response
4. **Success** — Response received and displayed
5. **Error** — Request failed, error message shown

**Speaker Notes:** Explain the API communication pattern. The frontend uses a single endpoint for all interactions. The `thread_id` enables conversation continuation. The request lifecycle is managed by a dedicated controller.

**Time:** 1.5 minutes

---

### Slide 10: Request Lifecycle Management

**Content:**
The request controller manages the complete lifecycle:

**Code excerpt** (from `lib/chat/requestController.ts`):
```typescript
export function useAskController(options) {
  const [status, setStatus] = useState<RequestStatus>({ kind: "idle" });
  // submit, stop, retry logic
}
```

**Lifecycle:**
1. User submits message
2. Message added to conversation (in-flight state)
3. API request sent with AbortController
4. Status changes to "waiting"
5. On success: message updated with response
6. On error: message marked with error, recovery options shown

**Timeout handling:**
- Maximum wait: 15 minutes
- AbortController for cancellation
- Distinguishes between timeout, network error, and server error

**Speaker Notes:** Explain why request lifecycle management matters — without it, users could submit duplicate requests, lose messages on failure, or be confused about the current state. The controller provides a clean state machine.

**Time:** 1.5 minutes

---

### Slide 11: Waiting Experience

**Content:**
The waiting experience is a key design innovation:

**Components:**
- **Elapsed time display**: Honest chronograph showing actual wait time
- **Dynamic messages**: Messages change based on elapsed time bands
- **2048 game**: Fully playable mini-game to pass the time

**Waiting message bands:**
| Time | Message |
|------|---------|
| 0–1 min | "Let's start putting your next adventure together." |
| 1–2 min | "We're gathering the details needed to shape your trip." |
| 2–3 min | "Your travel plan is coming together. Hang tight." |
| 3–5 min | "We're working through the details..." |
| 5–7 min | "This is taking a little longer than usual..." |
| 7–10 min | "Your trip plan is taking its time. You can relax and play a quick game..." |
| 10–15 min | "Your trip is taking longer than expected..." |

**Design principle**: No fake progress percentages, no fabricated completion indicators. Just honest communication.

**Speaker Notes:** Explain the design philosophy — the waiting experience is honest about the time required. The dynamic messages prevent the feeling of being stuck. The 2048 game provides engagement without distracting from the primary task.

**Time:** 2 minutes

---

### Slide 12: 2048 Waiting Game

**Content:**
- Pure deterministic game engine (`lib/game/2048/engine.ts`)
- React state controller (`components/game/Game2048.tsx`)
- Keyboard and touch input isolation
- Only visible during active waiting state

**Game features:**
- Standard 2048 rules (4×4 grid, tile merging)
- Arrow key controls (when board has focus)
- Swipe controls on touch devices
- Score tracking
- Win and game-over states
- Restart functionality

**Input isolation:**
- Keyboard play only when board has focus
- Keystrokes ignored when input/textarea is active
- `preventDefault()` only for handled game keys
- Game does not interfere with chat input

**Speaker Notes:** Explain the input isolation — this was a key engineering challenge. The game must be playable without interfering with the chat interface. The solution uses focus management and event filtering.

**Time:** 1.5 minutes

---

### Slide 13: Cookie-Based Persistence

**Content:**
Chat history is stored in browser cookies, not in a database:

**Why cookies?**
- Privacy: Chat history never leaves the user's browser
- No server storage: Reduces backend complexity
- User sovereignty: Users control their own data

**Implementation:**
- Versioned JSON envelope (version 1)
- Chunked across multiple cookies (4KB limit)
- Zod schema validation on load
- Retention caps to prevent overflow

**Code excerpt** (from `lib/cookie/codec.ts`):
```typescript
// The whole snapshot lives in one versioned JSON envelope,
// sharded across multiple document.cookie entries to stay
// under the ~4 KB per-cookie limit.
```

**Speaker Notes:** Explain the cookie constraints — browsers limit cookies to ~4KB each. A complete itinerary can easily exceed this. The solution chunks the data across multiple cookies with an index cookie tracking the layout. Zod validation ensures data integrity.

**Time:** 1.5 minutes

---

### Slide 14: Error Handling

**Content:**
Comprehensive error handling at multiple levels:

**Error taxonomy** (from `lib/chat/failure.ts`):
- Network error: "We couldn't reach the trip planner."
- Timeout: "Your trip plan is taking longer than expected."
- Server error: "Waynora is having trouble completing this request."
- Invalid request: "We couldn't process that trip request."
- Unexpected response: "We received an unexpected response."

**Error boundary** (from `ErrorBoundary.tsx`):
- Catches render-time errors
- Shows user-friendly message in production
- Shows detailed diagnostics in development
- Prevents blank white page

**Key principles:**
- Never expose raw backend errors
- Preserve user input on failure
- Offer retry actions
- Prevent duplicate submissions

**Speaker Notes:** Explain the multi-layered approach — the error taxonomy provides specific messages for each failure type, the error boundary catches unexpected render errors, and the request controller manages request-level failures.

**Time:** 1.5 minutes

---

### Slide 15: Responsive Design

**Content:**
Mobile-first responsive design across all pages:

**Breakpoints:**
| Device | Width | Layout |
|--------|-------|--------|
| Mobile | 375px | Single column, stacked |
| Tablet | 768px | Two column where appropriate |
| Desktop | 1280px+ | Full layout with sidebar |

**Responsive features:**
- Fluid typography with CSS custom properties
- Flexible grid layouts
- Touch-friendly game controls
- Accessible navigation at all sizes
- Reduced motion support for animations

**Speaker Notes:** Explain the responsive strategy — the design is mobile-first, meaning the base styles target small screens and media queries enhance for larger screens. The 2048 game supports both keyboard and touch input.

**Time:** 1 minute

---

### Slide 16: GSD Workflow and AI-Assisted Development

**Content:**
The frontend was built using a structured GSD-based workflow:

**Phases:**
1. **Inspect** — Analyze repository, read skills, understand backend
2. **Plan** — Establish visual direction, define component structure
3. **Implement** — Build pages, components, and integration
4. **Verify** — Run checks, test workflows, fix issues

**AI-assisted development:**
- AI generated initial code from specifications
- Human review and correction of generated code
- Iterative refinement with follow-up instructions
- Verification of each component before integration

**Evidence:**
- Git commit history shows phase-based execution
- `frontend/AGENTS.md` contains GSD project guidance
- `frontend/prompt.md` contains the original comprehensive specification

**Speaker Notes:** Be honest about the development process — AI was used as a tool, but human oversight was essential. The GSD workflow provided structure, and iterative refinement ensured quality. This is not "the AI built it automatically" — it's "the AI assisted a skilled developer."

**Time:** 2 minutes

---

### Slide 17: Challenges and Solutions

**Content:**
Summary of frontend challenges and solutions:

| Challenge | Solution | Outcome |
|-----------|----------|---------|
| Large-project complexity | GSD phased workflow | Organized, trackable progress |
| Database platform selection | Convex for auth, cookies for chat | Clean separation of concerns |
| AI-assisted development | Iterative refinement with review | High-quality code |
| Visual quality | Design system + iterative review | Premium travel aesthetic |
| Long-running requests | Honest waiting + 2048 game | Engaging experience |
| Frontend/backend integration | Layered API communication | Reliable data flow |
| UX and error handling | Multi-layered error taxonomy | User-friendly feedback |

**Speaker Notes:** Briefly walk through each challenge. Emphasize that these are real engineering challenges that required thoughtful solutions. The GSD workflow and AI-assisted development approach were key enablers.

**Time:** 2 minutes

---

### Slide 18: Learning Outcomes

**Content:**
Member 2's learning outcomes:
1. React architecture with TypeScript and Vite
2. Complex state management with React hooks
3. Cookie-based persistence with chunking and validation
4. Long-running request UX design
5. Convex Auth integration
6. Comprehensive error handling patterns
7. Responsive design with TailwindCSS
8. AI-assisted development workflow with GSD

**Speaker Notes:** These represent genuine skills gained through building the frontend. Each outcome corresponds to a specific component or system that was designed, implemented, and debugged.

**Time:** 1 minute

---

### Slide 19: Limitations and Future Scope

**Content:**
Current limitations:
- Browser-side timeout does not guarantee server-side cancellation
- Cookie storage limits the amount of chat history
- No offline support
- Single-request-per-conversation constraint
- Convex cold start behavior not fully characterized

Future work:
- Request cancellation and status polling
- Server-side chat history with user accounts
- Editable itineraries and map integration
- Export functionality (PDF, calendar)
- Offline support with service workers
- More waiting games and engagement features

**Speaker Notes:** Be honest about limitations — this shows maturity as an engineer. The future scope items are genuine improvements that would enhance the user experience.

**Time:** 1 minute

---

### Slide 20: Conclusion and Viva Preparation

**Content:**
Conclusion:
- Waynora demonstrates a production-grade frontend for AI-assisted travel planning
- The frontend handles complex state, long-running requests, and error recovery
- The waiting experience is a key design innovation
- AI-assisted development was used responsibly with human oversight

**Viva Questions and Answers:**

**Q: Why use cookies for chat history instead of a database?**
A: Privacy — chat history never leaves the user's browser. This respects user sovereignty and reduces backend complexity. The trade-off is storage limits, which are handled through chunking and retention caps.

**Q: How does the 2048 game not interfere with the chat?**
A: Input isolation — keyboard controls only work when the board has focus, and keystrokes are ignored when any input or textarea is the active element. The game only mounts during the waiting state.

**Q: What happens when a request fails?**
A: The error is caught by the request controller, a user-friendly message is displayed, the user's input is preserved, and a retry option is offered. The error boundary catches any unexpected render errors.

**Q: How does the frontend handle 15-minute wait times?**
A: The waiting experience shows honest elapsed time, dynamic messages that change based on wait duration, and a playable 2048 game. There are no fake progress indicators.

**Q: What is Convex and why was it chosen?**
A: Convex is a backend-as-a-service platform. It was chosen for authentication because it provides secure, server-side user management with minimal setup. Chat history is kept in cookies, not in Convex.

**Q: How was AI used in development?**
A: AI assisted with code generation from specifications, but human developers reviewed, corrected, and refined all code. The GSD workflow provided structure, and iterative refinement ensured quality.

**Speaker Notes:** These are the most likely viva questions. Answer them confidently and concisely. If asked about a detail not covered, be honest and say you would need to verify it.

**Time:** 1.5 minutes

---

## Quality Checklist

Before finalizing the presentation, verify:

- [ ] Slide count is between 15 and 20
- [ ] Total time allocation is 10–15 minutes
- [ ] All technical claims are verified against the repository
- [ ] Screenshots are referenced (use placeholders if needed)
- [ ] AI-assisted development is described honestly
- [ ] No features are claimed unless verified
- [ ] Viva questions have accurate answers
- [ ] Speaker notes are complete for each slide
- [ ] The presentation demonstrates genuine understanding of the UI
- [ ] No API keys or credentials are exposed
