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

Branch `v0.5-inworld-62426`. Working today:

- TLDraw canvas as the main surface.
- **Inworld Realtime voice + text session** over WebRTC, where the model calls
  the `draw_canvas` / `draw_flow` / `capture_canvas` tools to diagram the
  conversation live. The "brain" is an Inworld **router** (advanced model +
  fallback); the voice is Inworld's `inworld-tts-2` with `semantic_vad`.
- An **offline fallback**: with no live session, typed text uses a deterministic
  local parser so the app is useful with no keys/network.

Both voice and typed text drive the **same** tool calls / canvas actions, so the
input modality is fully decoupled from canvas behavior.

## Setup

Copy the example env file (gitignored) and add your Inworld key:

```bash
cp .env.local.example .env.local
```

```bash
INWORLD_API_KEY=your-inworld-api-key
INWORLD_REALTIME_MODEL=inworld/lumen-router   # a router id (see below)
INWORLD_REALTIME_VOICE=Ashley
```

Create the router the model uses as its brain (one advanced model + a fallback):

```bash
INWORLD_API_KEY=... ./scripts/create-inworld-router.sh
# override defaults if you like:
#   ROUTER_NAME=lumen-router PRIMARY_MODEL=... FALLBACK_MODEL=... \
#   INWORLD_API_KEY=... ./scripts/create-inworld-router.sh
```

Or create it in the Inworld Portal (Routers → new router) and copy its
`inworld/<name>` id into `INWORLD_REALTIME_MODEL`. The key is required for the
live collaborator; the offline parser works without it.

> Security: the API key is used **only** by the dev server, which proxies the
> WebRTC signaling to Inworld (`/api/realtime/ice` and `/api/realtime/call`).
> Inworld's realtime signaling uses a Bearer API key (no ephemeral token), so we
> keep it server-side rather than handing it to the browser. Never commit
> `.env.local`.

## Run it

```bash
npm install
npm run dev
```

Open the printed URL (default http://localhost:5180/).

**Voice:** click **Start voice session**, allow microphone access, and think out
loud. The agent speaks back and diagrams what you say on the canvas.

**Text:** type into the panel and press Enter. In a live session this goes to the
realtime model; offline it uses the local parser. For example:

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
the same draw tool calls, which are projected onto the canvas:

```text
voice (mic) ─┐                                ┌─► draw_canvas / draw_flow ─┐
             ├─► Inworld Realtime session ────┤  capture_canvas            ├─► canvas
text (live) ─┘  (router brain + inworld-tts)  └─► spoken/text reply        ┘  (TLDraw)

text (offline) ─► MockAssistantProvider ──────► draw_flow ──────────────────► canvas
```

Inworld speaks the OpenAI Realtime protocol (data channel `oai-events`, same
events), so only the connection + session-config layer is Inworld-specific.

Server (dev):

- `server/realtimePlugin.ts` — Vite dev endpoints that proxy the Inworld WebRTC
  handshake: `GET /api/realtime/ice` (STUN/TURN config) and
  `POST /api/realtime/call` (forwards the SDP offer with the session config —
  router model, instructions, voice stack, tools — to Inworld). Holds the API
  key; it never reaches the browser. See
  [ADR-0007](./docs/decisions/ADR-0007-inworld-realtime-provider.md).

Client:

- `src/realtime/RealtimeClient.ts` — fetches ICE servers, opens the WebRTC peer
  connection (mic capture, model audio playback, data channel), does the proxied
  SDP exchange, and handles function calls
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
- Router experiments: A/B model variants and conditional (metadata/CEL) routing.
- Production signaling endpoint (the current proxy is a Vite dev-server middleware).

## Contributing

We work spec-first and record significant decisions as ADRs. Before changing
behavior, skim [`CONTRIBUTING.md`](./CONTRIBUTING.md), update
[`docs/SPEC.md`](./docs/SPEC.md) if the contract changes, and add an ADR under
[`docs/decisions/`](./docs/decisions/) for architectural choices. Run
`npm run typecheck` and `npm run build` before committing, and never commit
`.env.local`.
