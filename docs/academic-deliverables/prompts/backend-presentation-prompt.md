# Backend Presentation Generation Prompt

## Instructions for the AI Agent

You are generating a backend-focused academic presentation for **Member 1** of the Waynora project. This presentation will be delivered to faculty evaluating a Semester V computer-science project.

---

## Presentation Constraints

- **Slide count**: 15–20 slides
- **Duration**: 10–15 minutes
- **Audience**: Faculty evaluators (professors, examiners)
- **Focus**: AI orchestration, backend engineering, and actual technical contributions
- **Tone**: Professional, academic, technically precise but accessible

---

## Pre-Generation Requirements

### 1. Inspect the Repository

Before creating slides, verify all technical claims by reading:
- `main.py` — FastAPI application, endpoint, lifespan, CORS
- `app/agents/Deep_agent/travel_agent.py` — Main agent orchestration
- `app/agents/Deep_agent/Middleware.py` — Full middleware stack
- `app/agents/Deep_agent/search_tool.py` — Web search fallback
- `app/agents/sub_agent/Destination_subagent/` — Destination research
- `app/agents/sub_agent/Transport_subagent/` — Transport research + custom MCP
- `app/agents/sub_agent/AccommodationWeather_subagent/` — Accommodation/weather
- `app/api/model.py` — Pydantic models
- `app/portkey/llm.py` — LLM routing
- `app/Evals/eval.py` — Evaluation framework
- `PRODUCT.md` — Product positioning
- `frontend/AGENTS.md` — GSD workflow evidence

### 2. Fill Placeholders

Replace every `[[PLACEHOLDER]]` with the appropriate value. If unknown, use `[TO BE SUPPLIED: description]`.

### 3. Academic Integrity

- Never invent performance metrics, test results, or capabilities.
- Distinguish verified facts from assumptions.
- Use actual code excerpts only where they materially improve understanding.
- Do not expose API keys, credentials, or sensitive data.

---

## Slide Structure

### Slide 1: Title Slide

**Content:**
- Project title: "Waynora: A Multi-Agent AI Travel Advisor"
- Subtitle: "Backend Architecture and AI Orchestration"
- Member 1: [[PLACEHOLDER: Name]], [[PLACEHOLDER: Enrollment Number]]
- Member 2: [[PLACEHOLDER: Name]], [[PLACEHOLDER: Enrollment Number]]
- [[PLACEHOLDER: College Name]]
- [[PLACEHOLDER: Academic Year]]
- [[PLACEHOLDER: Project Guide Name]]

**Speaker Notes:** Brief introduction of the project and team. State that this presentation focuses on the backend architecture and AI engineering.

**Time:** 30 seconds

---

### Slide 2: Agenda

**Content:**
1. Problem Statement
2. System Architecture
3. Backend Request Lifecycle
4. Deep Agent Orchestration
5. Specialist Subagents
6. Parallel Execution
7. MCP Integrations
8. Custom Train-Search MCP
9. FastAPI and Pydantic
10. Middleware Stack
11. Security and Privacy
12. Challenges and Solutions
13. Testing and Evaluation
14. Learning Outcomes
15. Limitations and Future Scope

**Speaker Notes:** Walk through the agenda. Emphasize that the presentation covers the complete backend architecture from request to response.

**Time:** 30 seconds

---

### Slide 3: Problem Statement

**Content:**
- Travel planning requires cross-referencing destinations, transport, accommodation, and weather
- Existing tools provide generic recommendations without deep research
- Long-running AI requests (5–15 minutes) require robust backend architecture
- Security concerns: prompt injection, PII protection
- Need for structured, reliable agent communication

**Visual:** Simple diagram showing the complexity of travel planning data sources.

**Speaker Notes:** Explain why naive approaches fail and why a multi-agent system is needed. Mention the 5–15 minute planning time as a key architectural constraint.

**Time:** 1 minute

---

### Slide 4: System Architecture Overview

**Content:**
Include the system architecture diagram from `docs/academic-deliverables/diagrams/system-architecture.md`.

Key components to highlight:
- Frontend (React + Vite)
- FastAPI Backend
- Main Deep Agent (orchestrator)
- Three Specialist Subagents
- MCP Tools (Tavily, Google Hotels, Google Flights, Google Maps, Weather)
- Custom Train-Search MCP
- External APIs
- AsyncSqliteSaver (checkpointer)

**Speaker Notes:** Walk through the architecture layer by layer. Emphasize the separation between the frontend, backend API, and agent orchestration. Note that the frontend communicates exclusively through the `/ask` endpoint.

**Time:** 2 minutes

---

### Slide 5: FastAPI Backend

**Content:**
- Framework: FastAPI with Pydantic validation
- Single endpoint: `POST /ask`
- Request model: `AskRequest { question: str, thread_id: str | None }`
- Response model: `AskResponse { answer: str, thread_id: str }`
- CORS middleware for frontend communication
- Application lifespan for agent initialization
- Error handling with HTTPException (500 for agent errors)

**Code excerpt** (from `main.py`):
```python
@app.post("/ask", response_model=AskResponse)
async def ask_endpoint(body: AskRequest, request: Request):
    thread_id = body.thread_id or str(uuid.uuid4())
    try:
        answer = await ask(request.app.state.agent, body.question, thread_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Something went wrong.")
    return AskResponse(answer=answer, thread_id=thread_id)
```

**Speaker Notes:** Explain why a single endpoint was chosen — the entire travel planning process is one synchronous conversation. The `thread_id` enables conversation continuation via the checkpointer.

**Time:** 1.5 minutes

---

### Slide 6: Request Lifecycle

**Content:**
Show the request lifecycle from the sequence diagram (`docs/academic-deliverables/diagrams/sequence-diagram.md`).

Key steps:
1. User submits travel requirements
2. FastAPI validates request with Pydantic
3. Main Deep Agent receives the message
4. Agent analyzes request and selects subagents
5. Subagents execute in parallel (when independent)
6. Subagents return structured Pydantic results
7. Main agent synthesizes final itinerary
8. Response returned to frontend

**Speaker Notes:** Walk through the request lifecycle step by step. Emphasize the synchronous nature — the frontend waits for the complete response. Mention the role of the checkpointer in maintaining conversation state.

**Time:** 1.5 minutes

---

### Slide 7: Deep Agent — The Orchestrator

**Content:**
- Built using `deepagents` library (LangChain/LangGraph)
- System prompt defines the orchestration workflow
- Key responsibilities:
  - Analyze user request and identify required information
  - Select minimum set of subagents needed
  - Delegate tasks with context and constraints
  - Synthesize subagent results into final itinerary
  - Self-validate before responding
  - Handle failures gracefully

**Code excerpt** (from `travel_agent.py` system prompt):
```
Plan first, execute second. Before any subagent call, analyze the full request and decide:
- what information is required and which available subagents provide it
- what each selected subagent must research, with the context and constraints it needs
- what you can calculate or reason about directly
```

**Speaker Notes:** Explain the "plan first, execute second" philosophy. The agent doesn't just react — it creates a plan, selects subagents, and only then executes. This reduces unnecessary tool calls and improves efficiency.

**Time:** 1.5 minutes

---

### Slide 8: Specialist Subagents

**Content:**
Table of the three specialist subagents:

| Subagent | Name | Tools | Research Focus |
|----------|------|-------|----------------|
| Destination | `destination_research` | Tavily MCP | Attractions, activities, neighborhoods, local experiences |
| Transport | `transport_research` | Google Flights, Google Maps, custom train MCP | Flights, Indian trains, driving/walking routes |
| Accommodation/Weather | `Accommodation_Weather_research` | Google Hotels, Weather MCP | Hotels, pricing, ratings, weather forecasts |

Each subagent:
- Has its own system prompt
- Uses Pydantic structured outputs
- Has ToolCallLimitMiddleware to prevent excessive tool calls
- Returns factual research (does not build itineraries)

**Speaker Notes:** Explain the separation of concerns — each subagent is a specialist that returns factual research. The main agent is the only one that synthesizes results into an itinerary. This prevents duplication and ensures comprehensive coverage.

**Time:** 1.5 minutes

---

### Slide 9: Parallel Subagent Execution

**Content:**
- Independent subagent tasks run in parallel
- Only dependent tasks are sequenced
- Enforced by system prompt: "Run independent subagent tasks in parallel"
- The `deepagents` framework handles actual parallelization

**Before vs After:**
- Before: Sequential execution — total time = sum of all subagent times
- After: Parallel execution — total time = max of subagent times (for independent tasks)

**Code excerpt** (from system prompt):
```
Run independent subagent tasks **in parallel**. Do not wait on one independent task before starting another. Sequence only tasks that depend on another's result.
Run sub-agents in parallel when their tasks are independent and do not depend on each other; this is mandatory
```

**Speaker Notes:** Explain the performance improvement from parallel execution. Use a simple example: if Destination takes 3 minutes, Transport takes 4 minutes, and Accommodation/Weather takes 2 minutes, sequential execution takes 9 minutes while parallel takes 4 minutes. Note that actual parallelization depends on the framework implementation.

**Time:** 1.5 minutes

---

### Slide 10: MCP Integrations

**Content:**
- Model Context Protocol (MCP) for external tool integration
- `langchain_mcp_adapters` MultiServerMCPClient for connecting to multiple MCP servers

| MCP Server | Transport | Tools |
|------------|-----------|-------|
| Tavily Remote MCP | stdio (npx mcp-remote) | Web search |
| Google Hotels | stdio (stays mcp) | Hotel search, details |
| Google Flights | stdio | Flight search, calendar, reference data |
| Google Maps | stdio | Route computation |
| Weather | stdio | Forecast data |
| Custom Train MCP | stdio (FastMCP) | Indian train search |

**Speaker Notes:** Explain what MCP is — a standard protocol for connecting AI agents to external tools. Each MCP server runs as a separate process and communicates via stdio. The MultiServerMCPClient manages connections to all servers simultaneously.

**Time:** 1.5 minutes

---

### Slide 11: Custom Train-Search MCP

**Content:**
- Problem: No suitable Indian train-search MCP existed
- Solution: Built custom MCP server using FastMCP + httpx
- Connects to external Indian railway API
- Launched as stdio process
- Integrated via MultiServerMCPClient

**Code excerpt** (from `server.py`):
```python
from mcp.server.fastmcp import FastMCP
mcp = FastMCP("train-search")
# Tool definitions for train search, schedules, availability
```

**Speaker Notes:** Explain why this was necessary — Indian railways are a major transport mode, and without this MCP, the transport subagent would miss a critical data source. The custom MCP server follows the same protocol as other MCP servers, making it a drop-in addition.

**Time:** 1.5 minutes

---

### Slide 12: Middleware Stack

**Content:**
Show the middleware stack in order:

1. **PromptInjectionMiddleware** — TypeSafe/JEV classifier, blocks injection before agent runs
2. **isolate_subagent_errors** — Catches subagent exceptions, returns failure marker
3. **SummarizationMiddleware** — Triggers at 80k tokens, keeps last 20 messages
4. **PIIMiddleware (password_share)** — Detects password sharing in input
5. **PIIMiddleware (password_output)** — Detects passwords in output/tool results
6. **PIIMiddleware (credit_card)** — Masks credit cards in input
7. **PIIMiddleware (email)** — Redacts emails in input
8. **PIIMiddleware (phone)** — Redacts phone numbers in input

**Speaker Notes:** Explain the middleware pattern — each middleware wraps the agent execution and provides cross-cutting concerns. The order matters: security first, then error handling, then context management, then privacy.

**Time:** 2 minutes

---

### Slide 13: Security — Prompt Injection Handling

**Content:**
- TypeSafe classifier evaluates user intent before agent runs
- Two classifications: "safe" or "prompt_injection"
- If injection detected: `PromptInjectionDetected` exception raised
- Agent returns refusal message: "Sorry, I can't help with that request."
- Judges real intent, not keywords

**Code excerpt** (from `Middleware.py`):
```python
class PromptInjectionMiddleware(AgentMiddleware):
    def before_agent(self, state, runtime):
        response = self.classifier.invoke(...)
        if response.choices["security"].choice == "prompt_injection":
            raise PromptInjectionDetected()
        return None
```

**Speaker Notes:** Explain why prompt injection matters — without this, users could manipulate the agent into revealing its system prompt or bypassing safety rules. The intent-based approach is more robust than keyword filtering.

**Time:** 1 minute

---

### Slide 14: Privacy — PII Protection

**Content:**
- Multiple PIIMiddleware instances for different PII types
- Strategies: redact (replace with placeholder) and mask (partial hiding)
- Applied at input and output stages
- Custom regex patterns for password detection

**Table:**

| PII Type | Strategy | Stage |
|----------|----------|-------|
| Password share | Redact | Input |
| Password output | Redact | Output, Tool results |
| Credit card | Mask | Input |
| Email | Redact | Input |
| Phone | Redact | Input |

**Speaker Notes:** Explain the privacy implications — chat history is stored in browser cookies, so PII must be protected before it reaches the client. The middleware approach ensures consistent protection across all agent interactions.

**Time:** 1 minute

---

### Slide 15: Pydantic Structured Outputs

**Content:**
- Each subagent has a Pydantic response format
- Ensures consistent, parseable results
- Main agent can reliably extract information

**Code excerpt** (from `Destination_subagent/schema.py`):
```python
class DestinationResearchResult(BaseModel):
    destination: str
    summary: str = Field(description="2-3 sentences")
    areas: list[Area] = Field(max_length=5)
    attractions: list[Attraction] = Field(max_length=5)
    activities: list[Activity] = Field(max_length=5)
    practical_notes: list[str] = Field(max_length=3)
    sources: list = Field(max_length=5)
```

**Speaker Notes:** Explain why structured outputs matter — without them, the main agent would need to parse free-form text, which is error-prone. Pydantic schemas enforce field types, constraints (max_length), and descriptions that guide the LLM.

**Time:** 1 minute

---

### Slide 16: Challenges and Solutions

**Content:**
Summary table of challenges and solutions:

| Challenge | Solution | Outcome |
|-----------|----------|---------|
| Sequential subagents | Parallel execution prompt | Reduced total planning time |
| Subagent failures | Error isolation middleware | Graceful degradation |
| Missing train MCP | Custom FastMCP server | Complete transport coverage |
| Prompt injection | TypeSAFE classifier | Blocked before execution |
| PII exposure | Multi-layer PIIMiddleware | Redacted/masked consistently |
| Unstructured responses | Pydantic response_format | Reliable parsing |

**Speaker Notes:** Briefly walk through each challenge. Emphasize that these are real engineering challenges that arose during development, not theoretical concerns. Each solution was selected after investigating alternatives.

**Time:** 2 minutes

---

### Slide 17: Testing and Evaluation

**Content:**
- DeepEval framework for LLM evaluation
- Metrics: AnswerRelevancy, GEval
- Custom criteria: itinerary coherence, request satisfaction
- Logfire tracing for observability
- AsyncSqliteSaver for conversation persistence

**Speaker Notes:** Explain the evaluation approach — the system is evaluated on whether itineraries are logically organized by day, whether activities fit into the schedule, and whether user requirements are met. Logfire provides visibility into agent execution for debugging.

**Time:** 1 minute

---

### Slide 18: Learning Outcomes

**Content:**
Member 1's learning outcomes:
1. Multi-agent orchestration with LangChain/LangGraph
2. Middleware architecture for cross-cutting concerns
3. MCP protocol and custom MCP server development
4. Structured outputs with Pydantic
5. FastAPI design with Pydantic validation
6. LLM routing with Portkey
7. Observability with Logfire
8. Evaluation with DeepEval

**Speaker Notes:** These represent genuine skills gained through building the backend. Each outcome corresponds to a specific component that was designed, implemented, and debugged.

**Time:** 1 minute

---

### Slide 19: Limitations and Future Scope

**Content:**
Current limitations:
- Subagent failures may result in incomplete research
- Web search fallback quality varies
- No request cancellation support
- Single-endpoint architecture limits concurrency
- Cold start behavior for Convex not fully characterized

Future work:
- Retry with exponential backoff
- Circuit breakers for external APIs
- Request cancellation and status polling
- Agent tracing and token-cost monitoring
- Production deployment with rate limiting

**Speaker Notes:** Be honest about limitations — this shows maturity as an engineer. The future scope items are genuine improvements, not afterthoughts.

**Time:** 1 minute

---

### Slide 20: Conclusion and Viva Preparation

**Content:**
Conclusion:
- Waynora demonstrates a production-grade multi-agent system
- The backend handles complex orchestration, security, and privacy
- Real engineering challenges were solved with practical solutions
- The system is honest about its capabilities and limitations

**Viva Questions and Answers:**

**Q: Why use a multi-agent system instead of a single agent?**
A: Specialist subagents provide focused research with dedicated tools and structured outputs. This prevents a single agent from being overwhelmed and ensures each research domain gets proper attention.

**Q: How does the system handle subagent failures?**
A: The `isolate_subagent_errors` middleware catches exceptions and returns a failure marker. The main agent continues with remaining subagents and uses web search to fill gaps.

**Q: What is MCP and why is it important?**
A: MCP (Model Context Protocol) is a standard for connecting AI agents to external tools. It allows the system to integrate diverse data sources (flights, hotels, trains, weather) through a consistent interface.

**Q: How does prompt injection detection work?**
A: A TypeSafe classifier evaluates the user's intent before the agent runs. It distinguishes between normal requests and injection attempts based on intent, not keywords.

**Q: Why use Pydantic for subagent outputs?**
A: Pydantic schemas enforce structure, types, and constraints on LLM outputs. This ensures the main agent receives consistent, parseable data from all subagents.

**Q: What happens when a subagent fails?**
A: The failure is caught by middleware, a failure marker is returned, the main agent continues with other subagents, and web search is used as a fallback. The user is informed about the failure.

**Speaker Notes:** These are the most likely viva questions. Answer them confidently and concisely. If asked about a detail not covered, be honest and say you would need to verify it.

**Time:** 1.5 minutes

---

## Quality Checklist

Before finalizing the presentation, verify:

- [ ] Slide count is between 15 and 20
- [ ] Total time allocation is 10–15 minutes
- [ ] All technical claims are verified against the repository
- [ ] Code excerpts are accurate and properly attributed
- [ ] Diagrams are referenced and included
- [ ] Challenges describe actual experiences
- [ ] No performance metrics are invented
- [ ] Viva questions have accurate answers
- [ ] Speaker notes are complete for each slide
- [ ] The presentation is understandable to faculty
- [ ] No API keys or credentials are exposed
