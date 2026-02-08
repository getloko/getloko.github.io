---
title: Collaboration Workloads
---

Virtual whiteboard and diagramming tools for teams.

## Available Workloads

### Excalidraw

Virtual whiteboard for sketching hand-drawn like diagrams.

**Features:**

- Infinite canvas
- Hand-drawn style diagrams
- Collaborative editing (with backend)
- Export to PNG, SVG, clipboard
- Libraries of shapes and components
- Dark mode support

**Use Cases:**

- Architecture diagrams
- Flowcharts and wireframes
- Brainstorming sessions
- Technical illustrations
- System design discussions

**Deployment:**

```bash
loko workloads add excalidraw --deploy
loko workloads connect excalidraw
```

**Endpoints:**

- **Web UI**: `https://excalidraw.${LOKO_DOMAIN}`

**Features:**

- **Drawing Tools**: Rectangle, circle, diamond, arrow, line, text, image
- **Styling**: Colors, stroke width, fill, opacity
- **Organization**: Groups, layers, alignment tools
- **Sharing**: Export diagrams, save to local storage

**Tips:**

- Hold **Shift** while drawing to constrain proportions
- **Ctrl/Cmd + D** to duplicate selection
- **Ctrl/Cmd + K** to add links to shapes
- Use **Libraries** for reusable component sets

**Chart:** bjw-s/app-template

## Next Steps

- [Contributing Guide](../contributing)
- [Schema Reference](../schema)
