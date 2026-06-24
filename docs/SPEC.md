# Spec: Lumen-Light / Beacon Table

The shared source of truth for what we're building, how to run it, and how the
runtime contract behaves. Product rationale lives in [`../PRD.md`](../PRD.md);
structure in [`ARCHITECTURE.md`](ARCHITECTURE.md); decisions in
[`decisions/`](decisions/).

## Objective

A voice-and-text thinking canvas: the user thinks out loud (or types), and an AI
collaborator draws on a shared TLDraw whiteboard in real time — diagrams,
sticky notes, shapes, connectors — so the conversation becomes coherent as it
happens. Success = the agent visualizes ideas live, the user stays in control of
the canvas, and input modality (voice/text) makes no difference to behavior.

## Tech Stack

- React 18, TypeScript 5, Vite 5
- TLDraw 3.15 (canvas)
- OpenAI Realtime API `gpt-realtime-2` over WebRTC (voice + text + tools)
- No backend beyond a Vite dev middleware for token minting

## Commands

```text
Install: npm install
Dev:     npm run dev        # http://localhost:5180
Build:   npm run build      # tsc -b && vite build
Preview: npm run preview
Types:   npm run typecheck
```

Environment (`.env.local`, gitignored):

```text
OPENAI_API_KEY=sk-...
OPENAI_REALTIME_MODEL=gpt-realtime-2
OPENAI_REALTIME_VOICE=marin
```

## Project Structure

```text
refined-lumen-light/              # current app directory during trunk promotion
├── index.html
├── package.json, tsconfig*.json, vite.config.ts
├── server/
│   └── realtimePlugin.ts        # /api/realtime/token (mints ephemeral secret)
├── src/
│   ├── main.tsx, App.tsx, styles.css, vite-env.d.ts
│   ├── assistant/               # shared assistant contracts
│   │   ├── types.ts
│   │   └── mockProvider.ts
│   ├── canvas/                  # tool args -> TLDraw shapes
│   │   ├── LumenCanvas.tsx
│   │   ├── drawCanvas.ts
│   │   ├── drawFlow.ts
│   │   └── normalizeFlow.ts
│   ├── realtime/
│   │   └── RealtimeClient.ts    # WebRTC + function calling
│   └── ui/
│       └── ConversationPanel.tsx
└── docs/                        # this suite
```

## Code Style

TypeScript, strict mode, function components, no default exports for modules.
Comments explain *why*, not *what*. Example (from `drawCanvas.ts`):

```ts
// The canvas remains a *view*: each call replaces the shapes created by the
// previous call (shapes the user adds by hand are left alone).
export function drawCanvasElements(
  editor: Editor,
  elements: CanvasElement[],
  previousIds: TLShapeId[] = [],
): TLShapeId[] { /* ... */ }
```

Conventions: validate untrusted input before it touches the canvas; mirror
TLDraw enum values from the installed schema rather than guessing.

## Runtime Contract (tools)

The agent drives the canvas exclusively through these tools. All draw tools
**replace** what the previous draw call produced.

### `draw_canvas` (primary)

`{ title?, elements: Element[] }` where each `Element` is:

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | unique; referenced by connectors |
| `type` | `shape` \| `text` \| `note` \| `connector` | |
| `geo` | enum | for `shape`: `rectangle, ellipse, triangle, diamond, pentagon, hexagon, octagon, star, rhombus, rhombus-2, oval, trapezoid, cloud, heart, x-box, check-box, arrow-{right,left,up,down}` |
| `text` | string | label / note / connector label |
| `x,y,w,h` | number | optional; missing x/y auto-grids |
| `color` | enum | `black, grey, light-violet, violet, blue, light-blue, yellow, orange, green, light-green, light-red, red, white` |
| `fill` | enum | `none, semi, solid, pattern, fill` |
| `size` | enum | `s, m, l, xl` |
| `from,to` | string | for `connector`: source/target element ids |

### `draw_flow` (shortcut)

`{ title?, nodes: {id,label,kind}[], edges: {from,to,label?}[] }`,
`kind ∈ {start, process, decision, end}`. Maps start/end→ellipse,
decision→diamond, process→rectangle, joined by bound arrows.

### `capture_canvas` (vision feedback)

No args. Screenshots the canvas (`editor.toImage`, PNG) and returns it to the
model as an `input_image` so it can verify layout and call a draw tool again to
realign. See [ADR-0005](decisions/ADR-0005-screenshot-feedback-loop.md).

### Behavioral rules

- Invalid enum values / malformed elements are dropped during normalization.
- Connectors referencing unknown ids are skipped.
- Drawing replaces the previous tool-drawn shapes; user-drawn shapes are left
  untouched.
- The screenshot is injected as a `user`-role message but labelled as an
  automated capture; the agent must not thank the user for it.

## Testing Strategy

See [`TESTING.md`](TESTING.md). Today: `npm run typecheck` + `npm run build` as
gates, plus manual/automated browser verification (Playwright via the
`webapp-testing` skill). Pure functions (`normalizeFlow`,
`normalizeCanvasElements`) are the priority targets for unit tests.

## Boundaries

- **Always:** keep the API key server-side; validate tool args before drawing;
  run `npm run typecheck` before commit; mirror TLDraw enums from the schema.
- **Ask first:** adding dependencies; changing the tool contract; introducing a
  production token backend; changing the canvas-as-projection model.
- **Never:** commit `.env.local` or secrets; let the browser hold a standard API
  key; treat TLDraw element JSON as the durable source of truth.

## Success Criteria

- Voice and text produce identical tool calls / canvas behavior.
- The agent draws varied structures (not only flowcharts) for open-ended prompts.
- A malformed tool call never crashes the canvas (validated away).
- `npm run build` and `npm run typecheck` pass clean.
- The API key never appears in the client bundle or git history.

## Open Questions

- Production token endpoint shape and hosting.
- Persistence — what (if anything) the user leaves a session with.
- Document briefing mode (load a doc, brief through it, highlight + connect).
- How strict the trust/review model should be on a live creative canvas.
