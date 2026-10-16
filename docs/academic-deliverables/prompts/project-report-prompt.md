# Project Report Generation Prompt

## Instructions for the AI Agent

You are generating a complete, professionally structured academic project report for **Waynora**, a multi-agent AI travel advisor. Follow the instructions below precisely.

---

## Pre-Generation Requirements

### 1. Inspect the Repository

Before writing any content, inspect the Waynora repository to verify every technical claim. Specifically:

- Read `main.py` for the FastAPI application structure and endpoint definitions.
- Read `app/agents/Deep_agent/travel_agent.py` for the main agent orchestration logic.
- Read `app/agents/Deep_agent/Middleware.py` for all middleware components.
- Read `app/agents/Deep_agent/search_tool.py` for the web search fallback tool.
- Read all files in `app/agents/sub_agent/` for specialist agent implementations.
- Read `app/api/model.py` for Pydantic request/response models.
- Read `app/portkey/llm.py` for LLM configuration.
- Read `app/Evals/eval.py` for evaluation metrics.
- Read `frontend/src/routes/index.tsx` for frontend routing.
- Read `frontend/src/routes/Chat.tsx` for the chat interface.
- Read `frontend/src/components/chat/WaitingShell.tsx` for the waiting experience.
- Read `frontend/src/components/game/Game2048.tsx` for the 2048 game.
- Read `frontend/src/lib/cookie/` for cookie-based persistence.
- Read `frontend/convex/` for Convex authentication setup.
- Read `PRODUCT.md` for product positioning and capabilities.
- Read `frontend/prompt.md` for the original frontend specification.
- Read `frontend/AGENTS.md` for GSD workflow evidence.

### 2. Fill Placeholders

Replace every `[[PLACEHOLDER]]` with the appropriate value. If a value is unknown, use a clearly marked placeholder such as `[TO BE SUPPLIED: description]`.

### 3. Academic Integrity

- Never fabricate references, citations, screenshots, test results, or implementation details.
- Distinguish verified facts from student-provided experiences, assumptions, and proposed future work.
- If an implementation detail cannot be verified, mark it as `[UNVERIFIED: description]`.
- Do not claim that every listed technology or feature is fully implemented without verification.
- Preserve confidentiality — never expose API keys, credentials, or sensitive personal data.

---

## Report Structure

Generate the report with the following 14 sections. Each section must be complete and professionally written.

### Section 1: Title Page

Include:
- Project title: "Waynora: A Multi-Agent AI Travel Advisor"
- Subtitle: "A Deep-Research Travel Planning System"
- [[PLACEHOLDER: Student Name 1]], [[PLACEHOLDER: Enrollment Number 1]]
- [[PLACEHOLDER: Student Name 2]], [[PLACEHOLDER: Enrollment Number 2]]
- [[PLACEHOLDER: Class/Section]]
- [[PLACEHOLDER: College Name]]
- [[PLACEHOLDER: University Name]]
- [[PLACEHOLDER: Academic Year]]
- [[PLACEHOLDER: Submission Date]]
- [[PLACEHOLDER: Project Guide Name]]

### Section 2: College Certificate

Use the standard college certificate format:

> This is to certify that the project entitled **"Waynora: A Multi-Agent AI Travel Advisor"** is a bonafide work carried out by [[PLACEHOLDER: Student Name 1]] ([[PLACEHOLDER: Enrollment Number 1]]) and [[PLACEHOLDER: Student Name 2]] ([[PLACEHOLDER: Enrollment Number 2]]) of [[PLACEHOLDER: Class/Section]] in partial fulfillment of the requirements for the degree of [[PLACEHOLDER: Degree Name]] in [[PLACEHOLDER: Branch]] during the academic year [[PLACEHOLDER: Academic Year]].

> The project has been [[PLACEHOLDER: approved/not approved]] for the award of the degree.

Include signature lines for:
- Project Guide: [[PLACEHOLDER: Guide Name]]
- Head of Department: [[PLACEHOLDER: HOD Name]]
- Principal: [[PLACEHOLDER: Principal Name]]
- External Examiner (if applicable)

### Section 3: Declaration

Standard declaration text:

> We hereby declare that the project work entitled **"Waynora: A Multi-Agent AI Travel Advisor"** submitted to [[PLACEHOLDER: College Name]] is a record of our own work carried out under the supervision of [[PLACEHOLDER: Guide Name]]. We have not submitted this project elsewhere for the award of any other degree or diploma.

Include:
- Student signatures and dates
- Place and date of submission

### Section 4: Acknowledgement

Acknowledge:
- [[PLACEHOLDER: Project Guide Name]] for guidance and support
- [[PLACEHOLDER: HOD Name]] for departmental support
- [[PLACEHOLDER: Principal Name]] for institutional support
- Any additional individuals as specified by the students
- Family and friends (optional, student's choice)

### Section 5: Abstract

Write a 200–300 word abstract covering:
- The problem: Travel planning requires extensive research across destinations, transport, accommodation, and weather.
- The solution: Waynora uses a multi-agent AI system with a main orchestrator and specialist subagents.
- Key technologies: FastAPI, LangChain/LangGraph, MCP tools, React, Convex.
- Key features: Deep research-based itineraries, honest waiting experience, 2048 game, cookie-based persistence.
- Results: A functional full-stack application that generates comprehensive travel plans in 5–15 minutes.

### Section 6: Table of Contents

Generate a complete table of contents with section numbers and page numbers (use placeholder page numbers like `[Page X]`).

### Section 7: Project Work Summary

Provide a 1–2 page summary of the entire project:
- What was built
- Why it was built
- Key technologies used
- Team structure (Member 1: Backend/AI, Member 2: Frontend)
- Development approach (GSD-based phased workflow)
- Current status of the application

### Section 8: Project Details

This is the main technical section. Include all subsections below.

#### 8.1 Problem Statement

Describe the problem:
- Travel planning is time-consuming and requires cross-referencing multiple information sources.
- Existing tools provide generic recommendations without deep, personalized research.
- Users need honest, transparent planning without fake progress indicators.
- The challenge of long-running AI requests requires thoughtful UX design.

#### 8.2 Objectives

List the project objectives:
1. Build a multi-agent AI system for comprehensive travel research.
2. Implement specialist subagents for destination, transport, and accommodation/weather research.
3. Create a FastAPI backend with structured request/response handling.
4. Develop a React frontend with authentication, chat interface, and waiting experience.
5. Ensure honest communication about long-running request times.
6. Implement security measures for prompt injection and personal information protection.
7. Use cookie-based persistence for chat history to respect user privacy.

#### 8.3 Tools and Technologies

Create a table of technologies used:

| Category | Technology | Purpose |
|----------|-----------|---------|
| Backend Framework | Python, FastAPI | API server |
| AI Orchestration | LangChain, LangGraph (deepagents) | Agent creation and orchestration |
| LLM Routing | Portkey | Model selection (heavy/lite) |
| Structured Outputs | Pydantic | Subagent response validation |
| MCP Integration | langchain_mcp_adapters | Tool connectivity |
| Custom MCP | FastMCP, httpx | Indian train search |
| Observability | Logfire | Tracing and logging |
| Checkpointing | AsyncSqliteSaver | Conversation persistence |
| Frontend Framework | React 18, TypeScript, Vite | UI development |
| Styling | TailwindCSS, CSS tokens | Design system |
| Routing | React Router | SPA navigation |
| Authentication | Convex Auth | User management |
| State Management | React hooks, Zod validation | Client-side state |
| Persistence | Browser cookies (versioned, chunked) | Chat history |
| Game | Custom 2048 engine | Waiting experience |

#### 8.4 System Design (DFD/UML/Architecture)

Reference the diagram files in `docs/academic-deliverables/diagrams/`:
- System Architecture: `diagrams/system-architecture.md`
- DFD Level 0: `diagrams/dfd-level-0.md`
- DFD Level 1: `diagrams/dfd-level-1.md`
- Use Case Diagram: `diagrams/use-case-diagram.md`
- Sequence Diagram: `diagrams/sequence-diagram.md`
- Component Diagram: `diagrams/component-diagram.md`

For each diagram, include the Mermaid code and a brief explanation of what it shows.

#### 8.5 Module Description

Describe each module in detail:

**Backend Modules:**

1. **FastAPI Application (`main.py`)**
   - Application lifespan and agent initialization
   - `POST /ask` endpoint with Pydantic models
   - CORS middleware configuration
   - Error handling with HTTPException

2. **Main Deep Agent (`app/agents/Deep_agent/travel_agent.py`)**
   - System prompt with orchestration workflow
   - Subagent delegation rules (parallel execution, minimum set selection)
   - Web search fallback strategy
   - Budget calculation logic
   - Self-validation checklist
   - Failure handling protocol
   - Harness profile registration

3. **Middleware Stack (`app/agents/Deep_agent/Middleware.py`)**
   - PromptInjectionMiddleware (TypeSafe/JEV-based classifier)
   - isolate_subagent_errors (error containment)
   - SummarizationMiddleware (token-triggered, 80k threshold)
   - PIIMiddleware (password share, password output, credit card, email, phone)

4. **Web Search Tool (`app/agents/Deep_agent/search_tool.py`)**
   - Parallel API integration
   - Async thread execution
   - Structured search queries

5. **Specialist Subagents:**
   - **Destination Subagent** (`app/agents/sub_agent/Destination_subagent/`)
     - Tavily MCP integration for web search
     - Pydantic schema: DestinationResearchResult
     - ToolCallLimitMiddleware for search limits
   - **Transport Subagent** (`app/agents/sub_agent/Transport_subagent/`)
     - Google Flights MCP tools
     - Google Maps route computation
     - Custom train-search MCP server (FastMCP + httpx)
     - Pydantic schema: TransportResearchResult
   - **Accommodation/Weather Subagent** (`app/agents/sub_agent/AccommodationWeather_subagent/`)
     - Google Hotels MCP tools
     - Weather forecast tools
     - Pydantic schema: AccommodationWeatherResult

6. **LLM Configuration (`app/portkey/llm.py`)**
   - Portkey-based model routing
   - Heavy model for main agent
   - Lite models for subagents

7. **Evaluation (`app/Evals/eval.py`)**
   - DeepEval metrics: AnswerRelevancy, GEval
   - Custom criteria: itinerary coherence, request satisfaction

**Frontend Modules:**

1. **Routing (`frontend/src/routes/index.tsx`)**
   - React Router with lazy loading
   - Protected routes for authenticated access
   - Routes: Landing, SignIn, SignUp, Chat, NotFound

2. **Authentication (`frontend/convex/`, `frontend/src/auth/`)**
   - Convex Auth with password provider
   - AuthProvider context
   - Sign-in and sign-up forms with validation

3. **Chat Interface (`frontend/src/routes/Chat.tsx`)**
   - Conversation management
   - Message display with Markdown rendering
   - Chat composer with multi-line support
   - Request lifecycle management

4. **Waiting Experience (`frontend/src/components/chat/WaitingShell.tsx`)**
   - Elapsed time display
   - Dynamic waiting messages based on time bands
   - 2048 game integration

5. **2048 Game (`frontend/src/components/game/Game2048.tsx`)**
   - Pure deterministic engine
   - React state controller
   - Keyboard and touch input isolation

6. **Cookie Persistence (`frontend/src/lib/cookie/`)**
   - Versioned JSON envelope
   - Chunked cookie storage (4KB limit handling)
   - Zod schema validation
   - Retention caps

7. **Error Handling (`frontend/src/lib/errors.ts`, `frontend/src/lib/chat/failure.ts`)**
   - Request failure taxonomy
   - User-friendly error messages
   - Error boundary component

#### 8.6 Screenshots

Include placeholders for screenshots with descriptions:

```
[SCREENSHOT PLACEHOLDER: Landing page — full page view]
[SCREENSHOT PLACEHOLDER: Sign-in page]
[SCREENSHOT PLACEHOLDER: Sign-up page]
[SCREENSHOT PLACEHOLDER: Chat interface — empty state]
[SCREENSHOT PLACEHOLDER: Chat interface — waiting state with 2048 game]
[SCREENSHOT PLACEHOLDER: Chat interface — completed itinerary response]
[SCREENSHOT PLACEHOLDER: Chat sidebar with conversation history]
[SCREENSHOT PLACEHOLDER: Mobile responsive view — chat]
[SCREENSHOT PLACEHOLDER: Backend — FastAPI /docs endpoint]
[SCREENSHOT PLACEHOLDER: Backend — Logfire tracing dashboard]
```

#### 8.7 Code Snippets

Include relevant code excerpts with explanations:

1. FastAPI endpoint definition (from `main.py`)
2. Main agent system prompt excerpt (from `travel_agent.py`)
3. Middleware stack configuration (from `Middleware.py`)
4. Pydantic model for API (from `app/api/model.py`)
5. Subagent schema example (from `Destination_subagent/schema.py`)
6. Frontend API call (from `frontend/src/lib/api/ask.ts`)
7. Cookie persistence codec (from `frontend/src/lib/cookie/codec.ts`)
8. 2048 game engine excerpt (from `frontend/src/lib/game/2048/engine.ts`)

### Section 9: Learning Outcomes

#### Member 1 — Backend and AI Engineering

Based on the actual backend work:

1. **Multi-agent orchestration**: Learned to design and implement a supervisor-based agent system using LangChain/LangGraph (deepagents), where a main agent delegates to specialist subagents and synthesizes their results.

2. **Middleware architecture**: Gained practical experience with LangChain's middleware system for cross-cutting concerns — prompt injection detection, error isolation, conversation summarization, and PII protection.

3. **MCP protocol**: Understood the Model Context Protocol for integrating external tools, including building a custom MCP server for Indian train search using FastMCP.

4. **Structured outputs**: Learned to use Pydantic models as response formats for LLM agents, ensuring consistent and parseable subagent responses.

5. **API design**: Designed a clean FastAPI endpoint with Pydantic validation, proper error handling, and CORS configuration.

6. **LLM routing**: Implemented Portkey-based model routing to balance cost and quality between heavy (main agent) and lite (subagent) models.

7. **Observability**: Integrated Logfire for tracing agent execution and debugging complex multi-agent flows.

8. **Evaluation**: Set up DeepEval metrics for assessing answer relevancy and itinerary coherence.

#### Member 2 — Frontend Engineering

Based on the actual frontend work:

1. **React architecture**: Built a complete SPA with React 18, TypeScript, Vite, and React Router, using lazy loading and code splitting.

2. **State management**: Implemented complex client-side state using React hooks, including conversation management, request lifecycle, and authentication state.

3. **Cookie-based persistence**: Designed a versioned, chunked cookie storage system with Zod validation to persist chat history within browser size limits.

4. **Long-running request UX**: Created an honest waiting experience with elapsed-time display, dynamic messages, and an integrated 2048 game.

5. **Authentication integration**: Integrated Convex Auth with React, including protected routes, form validation, and session management.

6. **Error handling**: Built a comprehensive error taxonomy with user-friendly messages, error boundaries, and graceful failure recovery.

7. **Responsive design**: Implemented mobile-first responsive layouts that work across 375px, 768px, and 1280px+ viewports.

8. **AI-assisted development workflow**: Used GSD-based phased planning and iterative AI-assisted development with careful verification of generated code.

### Section 10: Challenges and Solutions

#### Member 1 — Backend and AI Engineering

**Challenge 1: Sequential Subagent Execution**

- **Problem**: Initially, specialist subagents were called sequentially, causing unnecessary waiting time when tasks were independent.
- **Why it mattered**: Sequential execution increased total response time, especially when multiple research tasks could run concurrently.
- **Approach investigated**: Analyzed the dependency graph between subagent tasks to identify which could run in parallel.
- **Implementation**: Updated the main agent's system prompt to mandate parallel execution of independent subagent tasks. The deepagents framework handles the actual parallelization.
- **Solution selected**: Parallel execution with dependency-aware sequencing — only tasks that depend on another's result are sequenced.
- **Outcome**: Reduced total planning time by allowing concurrent research. The system prompt explicitly states: "Run independent subagent tasks in parallel. Do not wait on one independent task before starting another."
- **Limitations**: The actual parallelization depends on the deepagents framework's implementation. The system prompt enforces the pattern but does not guarantee framework-level parallelism.
- **Possible improvements**: Implement explicit asyncio.gather() patterns or framework-native parallel tool calls.

**Challenge 2: Subagent Failures**

- **Problem**: When a specialist subagent failed (e.g., MCP tool error, timeout), the entire request would fail or produce incomplete results.
- **Why it mattered**: A single subagent failure could prevent the user from receiving any travel plan, even if other subagents succeeded.
- **Approach investigated**: Considered retry logic, fallback subagents, and error containment strategies.
- **Implementation**: Created `isolate_subagent_errors` middleware using `@wrap_tool_call` that catches exceptions and returns a structured failure message instead of propagating the error. Added web search as a fallback tool for the main agent to use when a subagent fails.
- **Solution selected**: Error containment with graceful degradation — failed subagents return a failure marker, the main agent continues with remaining subagents and uses web search to fill gaps.
- **Outcome**: The system now handles subagent failures gracefully. The main agent's system prompt includes explicit failure handling instructions: "Do not retry it and do not fabricate its output. Continue with the remaining subagents. Use web search to get the data the failed subagent was supposed to provide."
- **Limitations**: Web search may not provide the same quality or specificity of data as a specialist subagent. The fallback does not guarantee recovery from every failure.
- **Possible improvements**: Implement retry with exponential backoff, add more fallback tools, or provide partial results with clear limitations.

**Challenge 3: Missing Indian Train-Search MCP**

- **Problem**: No suitable MCP integration existed for searching Indian train schedules and availability.
- **Why it mattered**: Indian railways are a major mode of transport in India, and the transport subagent needed this capability for comprehensive travel planning.
- **Approach investigated**: Searched for existing Indian train MCP servers, evaluated railway API options.
- **Implementation**: Built a custom MCP server using FastMCP and httpx that connects to an external Indian railway API. The server is launched as a stdio process and integrated via MultiServerMCPClient.
- **Solution selected**: Custom MCP server using FastMCP framework, providing tools for train search, schedule lookup, and availability checking.
- **Outcome**: The transport subagent can now search Indian train options alongside flights and other transport modes.
- **Limitations**: The custom MCP server depends on an external API that may have its own limitations. Train data may not be real-time. The system prompt notes: "Transport sub-agent train results are only for travel queries related to Indian locations."
- **Possible improvements**: Add caching, implement multiple data sources, or integrate with official railway APIs.

**Challenge 4: Prompt Injection**

- **Problem**: Users could attempt to manipulate the agent's instructions through prompt injection attacks.
- **Why it mattered**: Prompt injection could cause the agent to reveal its system prompt, bypass safety rules, or perform unintended actions.
- **Approach investigated**: Evaluated keyword-based filtering, LLM-based classification, and hybrid approaches.
- **Implementation**: Integrated TypeSafe (JEV-based) classifier as a `PromptInjectionMiddleware` that runs before the agent executes. The classifier evaluates the user's intent and returns a "safe" or "prompt_injection" classification. If injection is detected, a `PromptInjectionDetected` exception is raised and the agent returns a refusal message.
- **Solution selected**: LLM-based intent classification using TypeSafe, which judges real intent rather than keywords. The system prompt notes: "Judge the user's real intent, not keywords."
- **Outcome**: The system detects and blocks prompt injection attempts before the agent processes them.
- **Limitations**: No security system is perfect. Sophisticated injection techniques may evade detection. The classifier depends on the TypeSafe service availability.
- **Possible improvements**: Add multi-layer detection, implement rate limiting, or add adversarial testing.

**Challenge 5: Personal Information Protection**

- **Problem**: Users might share sensitive personal information (passwords, credit cards, emails, phone numbers) in chat messages.
- **Why it mattered**: Storing or processing PII in chat history or LLM context creates privacy risks.
- **Approach investigated**: Evaluated regex-based detection, NER-based detection, and middleware-based approaches.
- **Implementation**: Integrated multiple PIIMiddleware instances from LangChain's middleware library:
  - `password_share`: Detects password sharing patterns in input
  - `password_output`: Detects password patterns in output and tool results
  - `credit_card`: Masks credit card numbers in input
  - `email`: Redacts email addresses in input
  - `phone`: Redacts phone numbers in input
- **Solution selected**: LangChain's built-in PIIMiddleware with custom regex patterns for password detection, applied at both input and output stages.
- **Outcome**: Sensitive personal information is redacted or masked before being processed by the LLM or stored in conversation history.
- **Limitations**: Regex-based detection may miss novel PII formats. The middleware applies to input and output but may not cover all edge cases.
- **Possible improvements**: Add NER-based detection, implement custom PII classifiers, or add post-processing validation.

**Challenge 6: Uncertain Subagent Responses**

- **Problem**: Subagent responses were initially unstructured text, making it difficult for the main agent to parse and use the results reliably.
- **Why it mattered**: Unstructured responses could lead to missing information, inconsistent formatting, and errors in downstream processing.
- **Approach investigated**: Considered JSON mode, function calling, and Pydantic structured outputs.
- **Implementation**: Defined Pydantic BaseModel schemas for each subagent's response:
  - `DestinationResearchResult`: destination, summary, areas, attractions, activities, practical_notes, sources
  - `TransportResearchResult`: origin, destination, departure_date, return_date, options, research_notes
  - `AccommodationWeatherResult`: accommodation options, weather data
  Each subagent uses `response_format` parameter to enforce structured output.
- **Solution selected**: Pydantic structured outputs via LangChain's `response_format` parameter, providing type-safe, validated responses.
- **Outcome**: Subagent responses are now consistent, validated, and easily parseable by the main agent.
- **Limitations**: Structured outputs depend on the LLM's ability to follow the schema. Complex or ambiguous research may not fit neatly into predefined fields.
- **Possible improvements**: Add schema validation retry logic, implement partial result handling, or add schema versioning.

#### Member 2 — Frontend Engineering

**Challenge 1: Large-Project Complexity**

- **Problem**: The frontend project was large and complex, with multiple pages, components, state management, and backend integration.
- **Why it mattered**: Without structured planning, the project could become disorganized and difficult to maintain.
- **Approach investigated**: Considered various project management and planning approaches.
- **Implementation**: Used the Get Shit Done (GSD) workflow for phased planning and execution. The project was divided into phases (Phase 1: Inspect, Phase 2: Plan, Phase 3: Implement, Phase 4: Verify), with each phase having specific deliverables and verification gates. The GSD workflow is evidenced by git commit history showing phase-based execution (e.g., "docs(phase-04)", "feat(04-03)", "test(04-03)").
- **Solution selected**: GSD-based phased workflow with verification at each phase boundary.
- **Outcome**: The project was completed in organized phases with clear progress tracking. Individual components were verified before integration.
- **Limitations**: The `.planning/` directory referenced in `frontend/AGENTS.md` was not found in the repository (likely gitignored), so the full planning artifacts are not available for verification.
- **Possible improvements**: Maintain planning documents in the repository for future reference.

**Challenge 2: Database Platform Selection**

- **Problem**: The project needed a backend database platform for user authentication and related data.
- **Why it mattered**: The choice of database platform affects availability, cost, and development complexity.
- **Approach investigated**: Evaluated Supabase and Convex as potential platforms.
- **Implementation**: Chose Convex based on the project's requirements. Convex provides authentication, real-time subscriptions, and serverless functions. The implementation uses Convex Auth with password provider, and the schema includes auth tables. Chat history is explicitly kept in browser cookies, not in Convex.
- **Solution selected**: Convex for authentication and user data, with cookie-based chat persistence.
- **Outcome**: Authentication works with email/password, and the separation of concerns (Convex for auth, cookies for chat) maintains privacy.
- **Limitations**: Convex may have cold start behavior and inactivity-related limitations. The actual platform behavior should be verified before making specific claims about cold starts or inactivity.
- **Possible improvements**: Evaluate Convex's actual performance characteristics, consider caching strategies.

**Challenge 3: Iterative AI-Assisted Development**

- **Problem**: The frontend was developed using AI-assisted coding tools, which required careful management to ensure quality.
- **Why it mattered**: AI-generated code can contain errors, inconsistencies, or deviations from requirements that need correction.
- **Approach investigated**: Developed a workflow for iterative AI-assisted development.
- **Implementation**: Supplied detailed follow-up instructions to correct generated-code mistakes, iteratively refined the implementation, and verified each component. The `frontend/prompt.md` file contains the original comprehensive specification that guided development.
- **Solution selected**: Iterative refinement with human oversight — AI generates initial code, human reviews and corrects, AI refines.
- **Outcome**: The frontend was built with high quality, but the process required careful management and verification.
- **Limitations**: AI-assisted development is not automatic — it requires skilled human oversight. The quality of output depends on the quality of instructions and review.
- **Possible improvements**: Develop more structured review checklists, add automated testing earlier in the process.

**Challenge 4: Visual Quality**

- **Problem**: The frontend needed to be visually impressive and distinct from generic AI-generated templates.
- **Why it mattered**: A premium travel product requires a premium visual experience.
- **Approach investigated**: Used frontend-enhancement skills and iterative UI review.
- **Implementation**: Applied design-taste-frontend and high-end-visual-design skills. Created a cohesive design system with CSS tokens, editorial typography, and luxury travel aesthetic. Conducted iterative UI review to improve consistency and visual quality.
- **Solution selected**: Design-system-driven development with iterative visual refinement.
- **Outcome**: The frontend has a distinctive, premium travel-tech aesthetic with consistent design language across all pages.
- **Limitations**: Visual quality is subjective and may not meet all stakeholders' expectations.
- **Possible improvements**: Conduct user testing, gather feedback, and iterate on visual design.

**Challenge 5: Long-Running Requests**

- **Problem**: Travel plan generation takes 5–15 minutes, which feels like an eternity to users.
- **Why it mattered**: Without engaging waiting experiences, users would abandon the application during long requests.
- **Approach investigated**: Considered progress bars, skeleton screens, and interactive elements.
- **Implementation**: Created a comprehensive waiting experience with:
  - Elapsed time display (honest chronograph)
  - Dynamic waiting messages that change based on elapsed time bands
  - A playable 2048 mini-game to keep users engaged
  - Clear communication that planning takes 5–15 minutes
- **Solution selected**: Honest waiting experience with entertainment — no fake progress, just transparent communication and a game.
- **Outcome**: Users have an engaging, honest waiting experience. The 2048 game is fully playable with keyboard and touch controls.
- **Limitations**: The waiting experience does not reduce actual processing time. Some users may still find 5–15 minutes too long.
- **Possible improvements**: Add more games, implement background processing with notifications, or optimize agent performance.

**Challenge 6: Frontend/Backend Integration**

- **Problem**: The frontend needed to communicate with the FastAPI backend reliably, handling long-running requests and various failure modes.
- **Why it mattered**: Poor integration would result in failed requests, lost messages, or confusing user experiences.
- **Implementation**: Built a complete integration layer:
  - API client (`frontend/src/lib/api/ask.ts`) with fetch, timeout, and error handling
  - Request controller (`frontend/src/lib/chat/requestController.ts`) managing request lifecycle
  - Failure taxonomy (`frontend/src/lib/chat/failure.ts`) with user-friendly error messages
  - Conversation state management with cookie persistence
  - Markdown rendering for assistant responses
- **Solution selected**: Layered integration with clear separation of concerns — API client, request controller, and UI components.
- **Outcome**: The frontend successfully communicates with the backend, handles long-running requests, and provides friendly error messages.
- **Limitations**: Browser-side timeout does not guarantee server-side cancellation. Retrying may start a second expensive agent execution.
- **Possible improvements**: Implement request cancellation, add request status polling, or provide partial results.

**Challenge 7: User Experience and Error Handling**

- **Problem**: Users need clear feedback during all states — loading, success, failure, and edge cases.
- **Why it mattered**: Poor error handling leads to user frustration and abandonment.
- **Implementation**: Built comprehensive error handling:
  - Form validation with inline error messages
  - Loading indicators with accessible labels
  - Error boundary component for render failures
  - Request failure taxonomy with specific recovery actions
  - Preservation of user input on failure
  - Retry mechanisms that prevent duplicate submissions
- **Solution selected**: Multi-layered error handling with user-friendly messages and recovery actions.
- **Outcome**: Users receive clear, actionable feedback in all states. Errors are logged for debugging without exposing sensitive information.
- **Limitations**: Some edge cases may not be covered. The error handling is primarily client-side.
- **Possible improvements**: Add server-side error tracking, implement more granular retry logic, or add user-facing status pages.

### Section 11: Conclusion

Summarize the project:
- What was built and its current state
- Key achievements and learnings
- The value of the multi-agent approach
- The importance of honest UX for long-running AI systems
- The significance of security and privacy measures

### Section 12: Future Scope

List relevant future enhancements (label all as future work):

1. **More reliable retries, timeouts, and external API failure handling** — Implement exponential backoff, circuit breakers, and graceful degradation for external API failures.
2. **Automated itinerary evaluation and regression testing** — Expand the DeepEval framework with more test cases and automated regression testing.
3. **Validation of arithmetic, dates, budgets, and calendar constraints** — Add programmatic validation of calculated values before presenting them to users.
4. **Agent tracing, structured logging, latency metrics, and token-cost monitoring** — Enhance observability with detailed performance and cost metrics.
5. **Better data freshness and source attribution** — Improve how the system tracks and displays the freshness and sources of travel information.
6. **User accounts, saved preferences, and trip history** — Extend Convex integration to store user preferences and trip history server-side.
7. **Editable itineraries, maps, exports, and improved mobile accessibility** — Add itinerary editing, map integration, export functionality, and enhanced mobile features.
8. **Production deployment, secret management, rate limiting, and load testing** — Prepare for production with proper infrastructure, security, and performance testing.
9. **Expanded security testing and privacy controls** — Conduct penetration testing, add more PII detection patterns, and implement additional privacy controls.

### Section 13: References

List credible references used in the project. Use a consistent citation format (IEEE, APA, or college-prescribed format):

1. FastAPI documentation: https://fastapi.tiangolo.com/
2. LangChain documentation: https://python.langchain.com/
3. LangGraph documentation: https://langchain-ai.github.io/langgraph/
4. Deep Agents library: [URL if available]
5. MCP specification: https://modelcontextprotocol.io/
6. Portkey documentation: https://portkey.ai/docs
7. Logfire documentation: https://logfire.pydantic.dev/
8. React documentation: https://react.dev/
9. Convex documentation: https://docs.convex.dev/
10. TailwindCSS documentation: https://tailwindcss.com/
11. DeepEval documentation: https://deepeval.com/docs
12. TypeSafe documentation: [URL if available]
13. Pydantic documentation: https://docs.pydantic.dev/
14. React Router documentation: https://reactrouter.com/
15. Zod documentation: https://zod.dev/

Add any additional references actually used in the project. Do not fabricate references.

### Section 14: Appendix / User Manual / GitHub Link

#### User Manual

Provide a brief user manual:

1. **Getting Started**
   - Visit the landing page
   - Sign up or sign in
   - Navigate to the chat page

2. **Planning a Trip**
   - Enter your travel requirements in the chat
   - Wait 5–15 minutes for your personalized itinerary
   - Play the 2048 game while waiting
   - Review your itinerary when it arrives

3. **Managing Conversations**
   - Create new chats
   - Switch between conversations
   - Rename or delete chats
   - Chat history persists in browser cookies

4. **Troubleshooting**
   - If a request fails, you can retry
   - If the page reloads, your chat history is preserved
   - If you encounter errors, check your internet connection

#### GitHub Link

Repository: [[PLACEHOLDER: GitHub repository URL]]

#### Environment Variables

List the environment variables used (without values):

| Variable | Purpose |
|----------|---------|
| `MODEL_NAME` | LLM model for main agent |
| `TYPESAFE_BASE_URL` | TypeSafe classifier endpoint |
| `TYPESAFE_API_KEY` | TypeSafe API key |
| `LOGFIRE_TOKEN` | Logfire tracing token |
| `PARALLEL_API_KEY` | Parallel web search API key |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key |
| `VITE_API_BASE_URL` | Frontend backend URL |
| `CONVEX_SITE_URL` | Convex deployment URL |

---

## Quality Checklist

Before finalizing the report, verify:

- [ ] All 14 sections are present and complete
- [ ] All `[[PLACEHOLDER]]` values are either filled or clearly marked
- [ ] All technical claims are verified against the repository
- [ ] Diagrams are referenced and included
- [ ] Code snippets are accurate and properly formatted
- [ ] Challenges describe actual experiences with evidence
- [ ] Learning outcomes are specific to each member's work
- [ ] Future scope items are labeled as future work
- [ ] References are credible and not fabricated
- [ ] No API keys, credentials, or sensitive data are exposed
- [ ] The report is consistent with the college circular's requirements
- [ ] The language is professional and academic
