<div align="center">

# ✦ W A Y N O R A ✦

### A *deep agent* that plans your trip the slow, honest way

<p>
  <img src="https://img.shields.io/badge/python-3.12-1f425f?style=for-the-badge&logo=python&logoColor=f5d76e" />
  <img src="https://img.shields.io/badge/FastAPI-async-0b6e4f?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/LangGraph-deepagents-8a5cf6?style=for-the-badge" />
  <img src="https://img.shields.io/badge/MCP-tools-e0a526?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ed?style=for-the-badge&logo=docker&logoColor=white" />
  <a href="https://waynora.netlify.app/"><img src="https://img.shields.io/badge/LIVE-waynora.netlify.app-00c7b7?style=for-the-badge&logo=netlify&logoColor=white" /></a>
</p>

<sub>**1** supervisor &nbsp;·&nbsp; **3** specialist sub-agents &nbsp;·&nbsp; **0** fake progress bars</sub>

### [🌐 Try it live: waynora.netlify.app](https://waynora.netlify.app/)

</div>

---

> [!IMPORTANT]
> ### ⏳ Waynora takes **10 to 20 minutes** to answer, and that is on purpose
> This is not a chatbot that streams a quick guess. It is a **deep agent**: a supervisor that plans, delegates to specialist sub-agents, lets each one research on its own, then merges everything into one itinerary.
> Yes, 10 to 20 minutes is very high compared with a normal agent. It is the cost of **deep thinking + sub-agent architecture**, and the result is a researched plan instead of a confident hallucination. See [Why does it take so long?](#-why-does-it-take-so-long)

---

## 🧭 What is Waynora?

Waynora is an AI travel advisor for people planning custom, multi-day trips. You describe the trip; a team of agents researches destinations, transport, stays and weather, and hands back a complete itinerary.

It does **not** pretend to be instant. No fake percentages, no mock results, no invented "agent finished" checkmarks. The wait is real, so the product says so.

---

## ⚔️ Normal agent vs. Waynora's deep agent

| | 🤖 Normal agent | 🧠 Waynora (deep agent) |
|---|---|---|
| **Structure** | One model, a few tools | Supervisor + specialist sub-agents |
| **Planning** | Reacts step by step | Writes a plan first, then works through it |
| **Context** | One growing, messy context | Each sub-agent has its own clean, isolated context |
| **Research depth** | A search or two | Many tool rounds per specialist |
| **Output** | One-shot answer | Findings from every specialist merged into one plan |
| **Response time** | Seconds | **10 to 20 minutes** |
| **Quality goal** | Fast | Thorough and grounded in real data |

---

## 🏛️ Architecture at a glance

```mermaid
flowchart LR
    U(["👤 Traveler"]) --> FE["🖥️ Frontend<br/>React SPA on Netlify<br/>(AI-built)"]
    FE -- "POST /ask<br/>{question, thread_id}" --> API["⚡ FastAPI<br/>main.py"]
    API --> G{{"🛡️ Guardrails<br/>prompt-injection check"}}
    G -- safe --> DA["🧠 Main Travel<br/>Deep Agent"]
    G -- blocked --> API
    DA <--> SA["🧩 Specialist<br/>Sub-agents"]
    SA <--> T["🔧 Tools & MCP servers<br/>search · maps · flights · stays · weather"]
    DA <--> CP[("💾 SQLite checkpointer<br/>per thread_id")]
    DA -. "model calls" .-> GW["🌐 LLM gateway<br/>(Portkey, with fallback)"]
    DA -. traces .-> LF["📈 Logfire"]
    DA --> API
    API -- "{answer, thread_id}" --> FE

    classDef core fill:#2b2118,stroke:#e0a526,color:#f5e6c4,stroke-width:2px;
    classDef edge fill:#16202b,stroke:#4c8dff,color:#dbe8ff;
    classDef safe fill:#1d2b1f,stroke:#4caf50,color:#d8f5da;
    class DA,SA core;
    class FE,API,GW,LF edge;
    class G,CP safe;
```

---

## 🌳 Agent structure

One **supervisor** owns the conversation. The specialists are not independent bots. They are sub-agents that only run when the supervisor delegates a task to them.

```mermaid
flowchart TD
    USER(["🧳 Trip request"]) --> MAIN

    subgraph BRAIN ["🧠 MAIN TRAVEL DEEP AGENT (supervisor)"]
        direction TB
        MAIN["Reads the request"] --> PLAN["📝 Writes a plan<br/>(todo list)"]
        PLAN --> DELEGATE["📤 Delegates tasks"]
        DELEGATE --> MERGE["🧵 Merges results<br/>into one itinerary"]
    end

    DELEGATE --> D
    DELEGATE --> T
    DELEGATE --> AW

    subgraph TEAM ["🧩 SPECIALIST SUB-AGENTS (isolated contexts)"]
        direction LR
        D["🗺️ Destination Planner<br/>places · attractions<br/>activities · costs"]
        T["✈️ Transport Agent<br/>flights · routes<br/>travel times"]
        AW["🏨⛅ AccommodationWeather Agent<br/>stays · price ranges<br/>conditions · best days"]
    end

    D --> MERGE
    T --> MERGE
    AW --> MERGE
    MERGE --> OUT(["📜 Final itinerary"])

    classDef sup fill:#2b2118,stroke:#e0a526,color:#f5e6c4,stroke-width:2px;
    classDef sub fill:#1b2233,stroke:#7aa2ff,color:#e3ecff;
    class MAIN,PLAN,DELEGATE,MERGE sup;
    class D,T,AW sub;
```

### The roster

| Agent | Job | What it works with |
|---|---|---|
| 🧠 **Main Travel Deep Agent** | Plans, delegates, reviews, writes the final itinerary | The sub-agents, conversation memory |
| 🗺️ **Destination Planner** | Finds areas, attractions, activities, costs and durations | OpenStreetMap tools, web search and page extraction |
| ✈️ **Transport Agent** | Works out how to get there and move around | Flight search (MCP) |
| 🏨⛅ **AccommodationWeather Agent** | Finds where to stay, what it costs, and checks conditions for the travel dates | Stay search, weather tools |

> Specialists return **structured results** (not free-form chat), so the supervisor can merge them reliably.

---

## 🔁 Inside the deep agent loop

What makes it "deep" is the loop, not the model.

```mermaid
flowchart LR
    A(["Request"]) --> B["1️⃣ PLAN<br/>break the trip into tasks"]
    B --> C["2️⃣ DELEGATE<br/>hand a task to a specialist"]
    C --> D["3️⃣ RESEARCH<br/>specialist runs many<br/>tool rounds alone"]
    D --> E["4️⃣ REPORT<br/>structured findings<br/>return to supervisor"]
    E --> F{"More tasks<br/>left in plan?"}
    F -- yes --> C
    F -- no --> G["5️⃣ SYNTHESIZE<br/>one coherent itinerary"]
    G --> H(["Answer"])

    style B fill:#2b2118,stroke:#e0a526,color:#f5e6c4
    style C fill:#2b2118,stroke:#e0a526,color:#f5e6c4
    style D fill:#1b2233,stroke:#7aa2ff,color:#e3ecff
    style E fill:#1b2233,stroke:#7aa2ff,color:#e3ecff
    style G fill:#1d2b1f,stroke:#4caf50,color:#d8f5da
```

Each lap through steps 2 to 4 is many model calls and many tool calls. That is where the time goes.

---

## 📡 Life of one request

```mermaid
sequenceDiagram
    autonumber
    actor You as 👤 Traveler
    participant FE as 🖥️ Frontend
    participant API as ⚡ FastAPI
    participant GR as 🛡️ Guardrail
    participant MA as 🧠 Main Agent
    participant SA as 🧩 Sub-agents
    participant DB as 💾 Checkpointer

    You->>FE: "7 days in Japan, mid-budget, love food"
    FE->>API: POST /ask {question, thread_id?}
    API->>GR: classify input
    GR-->>API: safe ✅
    API->>MA: run(question, thread_id)
    MA->>DB: load thread state
    MA->>MA: write plan
    loop for each planned task
        MA->>SA: delegate (Destination → Transport → Accommodation & Weather)
        SA->>SA: search, call tools, reason, repeat
        SA-->>MA: structured findings
        MA->>DB: save checkpoint
    end
    Note over MA,SA: ⏳ 10 to 20 minutes of real work
    MA->>MA: synthesize final itinerary
    MA-->>API: answer
    API-->>FE: {answer, thread_id}
    FE-->>You: your itinerary 🗺️
```

---

## 🐢 Why does it take so long?

Because the work is real. A single reply involves:

1. **Planning**: the supervisor breaks your request into tasks before doing anything.
2. **Sequential dependencies**: you cannot pick a hotel area before the destination is chosen, and you cannot price transport before you know the route.
3. **Many tool rounds per specialist**: search, open a page, extract, query a map, search again. Each round is another model call.
4. **Isolated contexts**: every sub-agent starts clean and does its own reasoning instead of sharing one overloaded context. Cleaner thinking, but more total calls.
5. **Synthesis**: the supervisor reconciles everything into a single consistent itinerary.
6. **Synchronous by design**: `POST /ask` returns only when the whole job is finished. No partial or fabricated output in between.

```mermaid
gantt
    title Illustrative shape of one run (not a measured benchmark)
    dateFormat HH:mm
    axisFormat %M min
    section Supervisor
    Plan the trip            :done, p1, 00:00, 00:02
    Merge and write itinerary :active, p2, 00:16, 00:19
    section Specialists
    Destination research     :s1, 00:02, 00:08
    Transport research       :s2, 00:08, 00:12
    Accommodation + weather research :s3, 00:12, 00:16
```

> [!NOTE]
> **Trade-off, stated plainly:** a normal agent answers in seconds and is often shallow. Waynora spends 10 to 20 minutes so the answer is researched, cross-checked and complete. If you need speed, this is the wrong tool. If you need depth, this is the point.

---

## 🛡️ Guardrails and reliability

```mermaid
flowchart LR
    IN(["Input"]) --> PI["🛡️ Prompt-injection<br/>classifier<br/>safe / unsafe"]
    PI --> LIM["🔢 Tool-call limit<br/>stops runaway loops"]
    LIM --> LLM["🌐 Gateway<br/>automatic model fallback"]
    LLM --> STR["🧱 Structured outputs<br/>validated schemas"]
    STR --> CK["💾 Checkpoints<br/>resume by thread_id"]
    CK --> OBS["📈 Observability<br/>traces in Logfire"]
    OBS --> OUT(["Output"])

    style PI fill:#2b1d1d,stroke:#ff6b6b,color:#ffdede
    style LIM fill:#2b2118,stroke:#e0a526,color:#f5e6c4
    style LLM fill:#16202b,stroke:#4c8dff,color:#dbe8ff
    style STR fill:#1b2233,stroke:#7aa2ff,color:#e3ecff
    style CK fill:#1d2b1f,stroke:#4caf50,color:#d8f5da
    style OBS fill:#1d2b1f,stroke:#4caf50,color:#d8f5da
```

- **Prompt-injection check** runs before the agent starts.
- **Tool-call limits** keep a specialist from looping forever.
- **Gateway fallback**: if the primary model fails, the request moves to a backup model.
- **Structured outputs** keep sub-agent results machine-readable.
- **Persistent memory**: conversations continue by `thread_id` using an async SQLite checkpointer.
- **Tracing**: every run is observable through Logfire.
- **Evals**: reviewed manually with an LLM-as-judge approach. Real inputs and the agent's full outputs were given to ChatGPT for evaluation, because the outputs are long enough that DeepEval's judge model could not process them reliably.
---
---

## 🧪 Evaluation

Waynora's answers are long, multi-section itineraries, so automated eval tooling struggled with them. DeepEval repeatedly failed on the full outputs because the judge model could not handle their size.

What I did instead:

- Ran real trip requests through the live agent.
- Gave each **input** and the agent's **actual output** to ChatGPT as a judge.
- Reviewed the verdicts myself.

**Known limitation:** this is a manual, small-scale review, not an automated benchmark. A next step is to split each itinerary into sections and run automated checks per section, so the outputs fit a judge model's context.

---

## 🔌 API

| Method | Route | Body | Returns |
|---|---|---|---|
| `POST` | `/ask` | `{ "question": "...", "thread_id": "optional" }` | `{ "answer": "...", "thread_id": "..." }` |
| `GET` | `/health` | none | `{ "status": "ok" }` |

- Omit `thread_id` to start a new conversation; reuse the returned one to continue it.
- The request is **synchronous**, so make sure every client, proxy and load balancer in front of it allows a timeout of **at least 20 minutes**.


---

## 🧰 Tech stack

| Layer | Tools |
|---|---|
| **Agent framework** | `deepagents`, `langchain`, `langgraph` |
| **Tool integration** | MCP via `langchain-mcp-adapters`, `flights`, `stays`, `ddgs`, `parallel-web` |
| **API** | FastAPI, Uvicorn |
| **Memory** | `langgraph-checkpoint-sqlite` (async SQLite) |
| **Gateway** | Portkey |
| **Guardrails** | `langchain-typesafe` classifier as agent middleware |
| **Observability** | Logfire |
| **Evaluation** | Manual LLM-as-judge review (ChatGPT) on real input/output pairs |
| **Frontend hosting** | Netlify |
| **Packaging** | `uv`, Docker (Python 3.12, Node.js for MCP servers) |

---

## 🗂️ Project structure

```text
Waynora/
├── 📁 app/                      ← the backend (all the agent logic)
│   ├── 📁 agents/
│   │   └── 📁 Deep_agent/
│   │       └── 🧠 travel_agent.py   # builds the main deep agent + ask()
│   ├── 📁 api/
│   │   └── 📄 model.py              # AskRequest / AskResponse
│   └── 📁 db/
│       └── 💾 checkpoints.db        # created at runtime
├── 📁 frontend/                 ← AI-built UI (see note below)
├── 📁 docs/
├── ⚡ main.py                    # FastAPI app, lifespan, /ask, /health
├── 🐳 Dockerfile
├── 📦 pyproject.toml / uv.lock
└── 📘 PRODUCT.md                # product principles
```

---

## 🌐 Live demo

Waynora is deployed. Nothing to install: **[waynora.netlify.app](https://waynora.netlify.app/)**

Ask for a trip, then keep the tab open. The reply takes 10 to 20 minutes because the agents are doing real research.

---

## 🎨 About the frontend

The frontend in `/frontend` was **built with AI**, using the *Get Shit Done* workflow and a frontend design skill, driven by repeated, detailed instructions.

**The plan was mine:** the product idea, the agent architecture, the honest-waiting concept and how everything should be built. AI wrote the UI code; I directed it. That is why this README focuses on the backend in `/app`, which is where the engineering lives.

---

<div align="center">

### Built by **[Yadav Nitesh](https://github.com/yadavnitesh86)**

<sub>Deep agents are slow because thinking is slow. ✦ Good trips are worth the wait.</sub>

</div>
