# Waynora Academic Documentation System

This directory contains reusable prompt files that instruct a future AI agent to generate academic deliverables for the Waynora project — a multi-agent AI travel advisor built as a Semester V computer-science project.

## Purpose

These prompts are designed to produce:

1. **A complete college project report** following the institution's required 14-section structure.
2. **Individual diagram documents** for each required DFD/UML/architecture diagram.
3. **A backend-focused presentation prompt** for Member 1 (15–20 slides, 10–15 minutes).
4. **A frontend-focused presentation prompt** for Member 2 (15–20 slides, 10–15 minutes).

## Directory Structure

```
docs/academic-deliverables/
├── README.md                              ← This file
├── prompts/
│   ├── project-report-prompt.md           ← Generates the full project report
│   ├── backend-presentation-prompt.md     ← Generates Member 1's presentation
│   └── frontend-presentation-prompt.md   ← Generates Member 2's presentation
└── diagrams/
    ├── README.md                          ← Diagram usage and rendering guide
    ├── system-architecture.md             ← End-to-end architecture diagram
    ├── dfd-level-0.md                     ← Context-level Data Flow Diagram
    ├── dfd-level-1.md                     ← Level-1 Data Flow Diagram
    ├── use-case-diagram.md                ← UML Use Case Diagram
    ├── sequence-diagram.md                ← UML Sequence Diagram
    └── component-diagram.md               ← UML Component Diagram
```

## How to Use

### Step 1: Supply Missing Information

Before generating any document, fill in the placeholders marked with `[[PLACEHOLDER]]` throughout the prompt files. These include:

| Category | Examples |
|----------|----------|
| **Student information** | Names, enrollment numbers, roll numbers, class/section |
| **Institution details** | College name, university, department, academic year |
| **Project dates** | Start date, completion date, submission date |
| **Guide information** | Project guide name, designation, department |
| **Certificate wording** | Exact text for college certificate and declaration |
| **Acknowledgements** | Names of individuals to acknowledge |

### Step 2: Generate Diagrams

Each diagram file in `diagrams/` is a standalone Markdown document with Mermaid syntax. Render or preview them using:

- **VS Code**: Install the "Markdown Preview Mermaid Support" extension
- **GitHub/GitLab**: Mermaid renders natively in Markdown files
- **Mermaid Live Editor**: https://mermaid.live/ — paste the code block
- **Obsidian**: Mermaid renders natively

### Step 3: Generate the Project Report

Send the contents of `prompts/project-report-prompt.md` to a capable AI agent along with:

- The filled-in placeholder values
- Access to the Waynora repository (read-only)
- The college's project circular (if available as a separate document)

The agent will produce a complete 14-section report.

### Step 4: Generate Presentations

Send the contents of `prompts/backend-presentation-prompt.md` or `prompts/frontend-presentation-prompt.md` to an AI agent. Each prompt specifies:

- Exact slide count (15–20 slides)
- Duration (10–15 minutes)
- Speaker notes and time allocation
- Viva questions with accurate answers

## Academic Integrity Rules

All prompts enforce these rules:

- **Never fabricate** references, citations, screenshots, test results, or implementation details.
- **Distinguish** verified facts from student-provided experiences, assumptions, and proposed future work.
- **Inspect the repository** before making any technical claim.
- **Use clearly marked placeholders** for information that must be supplied manually.
- **Preserve confidentiality** — never expose API keys, credentials, or sensitive personal data.
- **Label future work** explicitly unless the feature is already implemented.

## Technology Overview (For Reference)

The prompts describe the following verified architecture:

- **Backend**: Python, FastAPI, LangChain/LangGraph (deepagents), Pydantic, MCP tools
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Convex auth, React Router
- **AI Orchestration**: Main Deep Agent + 3 specialist subagents (Destination, Transport, Accommodation/Weather)
- **Data**: AsyncSqliteSaver (backend checkpointer), browser cookies (frontend chat history), Convex (auth only)
- **Observability**: Logfire tracing

See `diagrams/system-architecture.md` for the full architecture diagram.

## File Conventions

- All prompts use `[[PLACEHOLDER]]` syntax for manual fill-in values.
- All prompts instruct the agent to inspect the repository before generating content.
- Mermaid diagrams use `graph TD`, `flowchart`, or `sequenceDiagram` syntax as appropriate.
- Each prompt is self-contained and can be used independently.
