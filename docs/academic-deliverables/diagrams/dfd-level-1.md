# DFD Level 1 — Data Flow Diagram

## Overview

The Level 1 DFD decomposes the Waynora system into major processes, data stores, and data flows. This provides more detail than the context diagram while remaining readable.

```mermaid
graph TD
    subgraph "Frontend"
        P1[1.0<br/>User Interface]
        P2[2.0<br/>Chat Manager]
        P3[3.0<br/>Waiting Experience]
        P4[4.0<br/>Cookie Persistence]
    end

    subgraph "Backend"
        P5[5.0<br/>API Endpoint]
        P6[6.0<br/>Request Handler]
    end

    subgraph "Agent System"
        P7[7.0<br/>Main Deep Agent]
        P8[8.0<br/>Middleware Stack]
        P9[9.0<br/>Destination Subagent]
        P10[10.0<br/>Transport Subagent]
        P11[11.0<br/>Accommodation/Weather Subagent]
    end

    subgraph "External Services"
        EXT1[Tavily Search API]
        EXT2[Google Flights API]
        EXT3[Google Hotels API]
        EXT4[Google Maps API]
        EXT5[Weather API]
        EXT6[Indian Railway API]
    end

    DS1[(Checkpointer<br/>SQLite)]
    DS2[(Browser Cookies)]
    DS3[(Portkey LLM)]

    %% Frontend internal flows
    P1 -->|"User Input"| P2
    P2 -->|"Display Messages"| P1
    P2 -->|"API Request"| P5
    P5 -->|"API Response"| P2
    P2 -->|"Waiting State"| P3
    P3 -->|"2048 Game"| P1
    P2 <-->|"Chat History"| P4
    P4 <-->|"Read/Write"| DS2

    %% Backend flows
    P5 -->|"Validate Request"| P6
    P6 -->|"User Message"| P7
    P7 -->|"Agent Execution"| P8

    %% Agent to subagents
    P7 -->|"Delegate Research"| P9
    P7 -->|"Delegate Research"| P10
    P7 -->|"Delegate Research"| P11

    %% Subagents to external services
    P9 -->|"Web Search"| EXT1
    P10 -->|"Flight Search"| EXT2
    P10 -->|"Train Search"| EXT6
    P10 -->|"Route Computation"| EXT4
    P11 -->|"Hotel Search"| EXT3
    P11 -->|"Weather Forecast"| EXT5

    %% External services return
    EXT1 -->|"Search Results"| P9
    EXT2 -->|"Flight Data"| P10
    EXT6 -->|"Train Data"| P10
    EXT4 -->|"Route Data"| P10
    EXT3 -->|"Hotel Data"| P11
    EXT5 -->|"Weather Data"| P11

    %% Data stores
    P7 <-->|"thread_id<br/>Conversation State"| DS1
    P7 -.->|"LLM Calls"| DS3
    P9 -.->|"LLM Calls"| DS3
    P10 -.->|"LLM Calls"| DS3
    P11 -.->|"LLM Calls"| DS3

    %% Synthesis
    P9 -->|"Structured Result"| P7
    P10 -->|"Structured Result"| P7
    P11 -->|"Structured Result"| P7
    P7 -->|"Itinerary"| P6
    P6 -->|"Response"| P5
```

## Process Descriptions

### Frontend Processes

| Process | Name | Description |
|---------|------|-------------|
| 1.0 | User Interface | Renders landing page, auth pages, chat interface |
| 2.0 | Chat Manager | Manages conversation state, message display, API communication |
| 3.0 | Waiting Experience | Shows elapsed time, dynamic messages, and 2048 game |
| 4.0 | Cookie Persistence | Reads/writes versioned, chunked chat history to browser cookies |

### Backend Processes

| Process | Name | Description |
|---------|------|-------------|
| 5.0 | API Endpoint | FastAPI `POST /ask` endpoint with Pydantic validation |
| 6.0 | Request Handler | Validates request, manages thread_id, invokes agent, returns response |

### Agent System Processes

| Process | Name | Description |
|---------|------|-------------|
| 7.0 | Main Deep Agent | Orchestrator that plans, delegates, synthesizes, and validates |
| 8.0 | Middleware Stack | Prompt injection detection, error isolation, summarization, PII protection |
| 9.0 | Destination Subagent | Researches attractions, activities, neighborhoods |
| 10.0 | Transport Subagent | Researches flights, Indian trains, routes |
| 11.0 | Accommodation/Weather Subagent | Researches hotels and weather |

## Data Stores

| Store | Type | Description |
|-------|------|-------------|
| Checkpointer | SQLite (AsyncSqliteSaver) | Persists conversation state via thread_id |
| Browser Cookies | Client-side | Stores chat history with versioning and chunking |
| Portkey LLM | External Service | Routes LLM calls to appropriate models |

## Data Flows (Key)

1. **User Input → Chat Manager → API Endpoint**: Travel requirements flow from UI to backend
2. **API Endpoint → Request Handler → Main Agent**: Validated request passed to agent
3. **Main Agent → Subagents → External Services**: Research delegation and data retrieval
4. **Subagents → Main Agent**: Structured Pydantic results returned
5. **Main Agent → Request Handler → API Endpoint → Chat Manager**: Synthesized itinerary returned
6. **Chat Manager ↔ Cookie Persistence**: Chat history saved and restored

## Consistency with Level 0

This Level 1 DFD is consistent with the Level 0 context diagram:
- The single "Waynora System" process is decomposed into 11 processes
- All external entities from Level 0 are represented
- All data flows from Level 0 are preserved and elaborated
- No new external entities are introduced
