---
title: Collaboration Workloads
---

Virtual whiteboard, design, and diagramming tools for teams.

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
loko workloads add excalidraw --now
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

---

### Penpot

Open-source design and prototyping platform — a self-hosted Figma alternative.

**Penpot Features:**

- Vector design with full SVG support
- Interactive prototyping and flows
- Developer handoff with CSS/HTML inspection
- Team collaboration with real-time editing
- Figma-compatible import
- Bundled PostgreSQL and Valkey (no external dependencies)

**Penpot Use Cases:**

- UI/UX design and prototyping
- Design system management
- Team design collaboration
- Handoff to developers without external services

**Penpot Deployment:**

```bash
loko workloads add penpot --now
loko workloads connect penpot
```

**Penpot Endpoints:**

- **Web UI**: `https://penpot.${LOKO_DOMAIN}`

**Penpot Notes:**

- First user to register becomes the team owner
- Email verification is disabled by default (suitable for local dev)
- Bundles PostgreSQL and Valkey as subcharts — no separate database needed

**Penpot Chart:**

- Repository: penpot (`https://helm.penpot.app`)
- Subcharts: PostgreSQL, Valkey (bundled)

## Next Steps

- [Contributing Guide](../contributing)
- [Schema Reference](../schema)
