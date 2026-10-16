# Waynora Diagram Collection

This directory contains all required DFD, UML, and architecture diagrams for the Waynora academic project.

## Diagram Files

| File | Type | Purpose |
|------|------|---------|
| `system-architecture.md` | Architecture | End-to-end system architecture |
| `dfd-level-0.md` | DFD | Context-level Data Flow Diagram |
| `dfd-level-1.md` | DFD | Level-1 Data Flow Diagram |
| `use-case-diagram.md` | UML | Use Case Diagram |
| `sequence-diagram.md` | UML | Sequence Diagram |
| `component-diagram.md` | UML | Component Diagram |

## Rendering Mermaid Diagrams

### VS Code
1. Install the "Markdown Preview Mermaid Support" extension
2. Open any `.md` file
3. Press `Ctrl+Shift+V` to open Markdown preview
4. Mermaid diagrams render automatically

### GitHub / GitLab
- Mermaid renders natively in Markdown files on both platforms
- No additional setup needed

### Mermaid Live Editor
1. Visit https://mermaid.live/
2. Copy the Mermaid code block from any diagram file
3. Paste into the editor
4. Export as PNG or SVG

### Obsidian
- Mermaid renders natively in Markdown files
- No additional setup needed

## Diagram Conventions

All diagrams follow these conventions:

- **Existing components** are shown with solid borders and standard colors
- **Proposed/future components** are shown with dashed borders and lighter colors
- **External systems** are shown in distinct colors (e.g., orange for external APIs)
- **Data stores** are shown as cylinders
- **Processes** are shown as circles or rounded rectangles

## Consistency Checklist

When creating or modifying diagrams, verify:

- [ ] All diagrams are consistent with each other
- [ ] Component names match across all diagrams
- [ ] Data flows are consistent between DFD levels
- [ ] Use cases match the sequence diagram interactions
- [ ] Component dependencies are consistent across diagrams
- [ ] Mermaid syntax is valid (test in Mermaid Live Editor)
- [ ] No connections are claimed unless supported by code evidence
