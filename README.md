# Lumen Light

A voice-and-text **thinking canvas** where an AI collaborator diagrams your
conversation as it happens.

You open a large open whiteboard (TLDraw), talk or type, and the assistant turns
what you say into flow diagrams and structure in real time — so the ideas become
coherent while you're still working through them. The canvas is the main stage;
the assistant draws on it with you.

See [`PRD.md`](./PRD.md) for the product vision and scope.

## Documentation

| Document | What's in it |
|----------|--------------|
| [`PRD.md`](./PRD.md) | Product vision, users, capabilities, scope. |
| [`docs/SPEC.md`](./docs/SPEC.md) | Runtime contract (tools), commands, structure, boundaries, success criteria. |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Components and the data/event flow. |
| [`docs/decisions/`](./docs/decisions/) | ADRs — the *why* behind key choices. |
| [`docs/TESTING.md`](./docs/TESTING.md) | How changes are verified. |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | How to work on this project. |

## Status

Early scaffold. Working today:

- TLDraw canvas as the main surface.
- **OpenAI Realtime voice + text session** (`gpt-realtime-2` over WebRTC) where
  the model calls a `draw_flow` tool to diagram the conversation live.

Both voice and typed text drive the **same** tool calls / canvas actions, so the
input modality is fully decoupled from canvas behavior.

## Setup

Copy the example env file (gitignored) and add your OpenAI key:

```bash
cp .env.local.example .env.local
```

```bash
OPENAI_API_KEY=sk-...
OPENAI_REALTIME_MODEL=gpt-realtime-2
OPENAI_REALTIME_VOICE=marin
```

The key is required for the realtime voice/text collaborator.

> Security: the API key is used **only** by the dev server to mint short-lived
> ephemeral tokens (`/api/realtime/token`). It is never bundled into the browser.
> Never commit `.env.local`.

## Run it

```bash
npm install
npm run dev
```

Open the printed URL (default http://localhost:5180/).

**Voice:** click **Start voice session**, allow microphone access, and think out
loud. The agent speaks back and diagrams what you say on the canvas.

**Text:** type into the panel and press Enter. In a live session this goes to the
realtime model. For example:

```text
research -> draft -> review -> ship
```

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies. |
| `npm run dev` | Start the dev server (http://localhost:5180). |
| `npm run build` | Typecheck + production build. |
| `npm run typecheck` | Types only (no emit). |
| `npm run preview` | Preview the production build. |

## Architecture (the important seam)

Input modality is decoupled from canvas behavior. Voice and text both resolve to
the same `draw_flow` action, which is projected onto the canvas:

```text
voice (mic) ─┐                              ┌─► draw_flow tool call ─┐
             ├─► OpenAI Realtime session ───┤                        ├─► canvas
text (live) ─┘     (gpt-realtime-2)         └─► spoken/text reply    ┘   (TLDraw)
```

Server (dev):

- `server/realtimePlugin.ts` — Vite dev endpoint `/api/realtime/token` that mints
  an ephemeral Realtime client secret. Holds the API key, configures the session
  instructions + `draw_flow` tool. The key never reaches the browser.

Client:

- `src/realtime/RealtimeClient.ts` — WebRTC peer connection, mic capture, model
  audio playback, data-channel events, and function-call handling
  (`response.function_call_arguments.done` → run tool → `function_call_output`
  → `response.create`).
- `src/canvas/drawFlow.ts` — projects a `FlowDiagram` onto TLDraw shapes. The
  canvas is a *view* of assistant output, re-projected on each call; never the
  source of truth.
- `src/canvas/normalizeFlow.ts` — defensively coerces tool-call args into a valid
  `FlowDiagram` before touching the canvas.
- `src/assistant/types.ts` — shared `FlowDiagram` / action / provider contract.
- `src/canvas/LumenCanvas.tsx` — the TLDraw surface.
- `src/ui/ConversationPanel.tsx` — text input + session controls + transcripts.
- `src/App.tsx` — wires inputs → tool calls → canvas.

### Canvas vocabulary

The model has two drawing tools:

- **`draw_canvas`** (primary) — the full whiteboard vocabulary. Each element is
  one of:
  - `shape` — any TLDraw geo (rectangle, ellipse, triangle, diamond, hexagon,
    star, cloud, heart, …) with optional `color`, `fill`, `size`, `w`/`h`.
  - `note` — a sticky note.
  - `text` — a free text label.
  - `connector` — an arrow bound between two elements (`from`/`to` ids).

  Mind maps, concept maps, comparisons, hierarchies, brainstorms — not just
  flowcharts. See `src/canvas/drawCanvas.ts`.

- **`draw_flow`** (shortcut) — quick linear flowcharts. Node kinds map to geo
  shapes (start/end → ellipse, decision → diamond, process → rectangle).

- **`capture_canvas`** (vision feedback) — screenshots the current canvas
  (`editor.toImage`) and feeds it back to the model as an `input_image`, so it
  can *see* how its drawing actually rendered and then call `draw_canvas` again
  to fix overlaps, spacing, off-screen elements, or misrouted connectors. This
  closes a look-then-realign loop around coordinate-based layout.

Both draw tools replace what the previous call drew. The canvas is always a view
of the latest tool call, never the durable source of truth.

Valid style values are validated against TLDraw before drawing (see
`normalizeCanvasElements`): colors `black, grey, light-violet, violet, blue,
light-blue, yellow, orange, green, light-green, light-red, red, white`; fills
`none, semi, solid, pattern, fill`; sizes `s, m, l, xl`.

## Roadmap (near-term)

- Document briefing mode: load a document, brief through it, highlight passages,
  draw connections (add `highlight_source` + `focus_source` tools).
- Richer diagram types beyond linear flows.
- Generated images / media on the canvas.
- Production token endpoint (the current one is a Vite dev-server middleware).

## Contributing

We work spec-first and record significant decisions as ADRs. Before changing
behavior, skim [`CONTRIBUTING.md`](./CONTRIBUTING.md), update
[`docs/SPEC.md`](./docs/SPEC.md) if the contract changes, and add an ADR under
[`docs/decisions/`](./docs/decisions/) for architectural choices. Run
`npm run typecheck` and `npm run build` before committing, and never commit
`.env.local`.
