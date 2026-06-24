# Architecture

How Lumen-Light / Beacon Table is put together and why. For the product vision see
[`../PRD.md`](../PRD.md); for the runtime contract see [`SPEC.md`](SPEC.md); for
the reasoning behind specific choices see [`decisions/`](decisions/).

## One-line model

A TLDraw canvas is the stage; an OpenAI Realtime agent (voice **or** text) calls
Lumen tools to draw on it as the conversation happens.

## The central seam: input modality is decoupled from canvas behavior

Every input path resolves to the **same tool calls**, and the canvas only ever
reacts to tool calls. This is the single most important property of the design —
it's what lets voice and text be equal, and what let us build over text before
adding voice without redesigning anything.

```text
voice (mic) ─┐                                ┌─► draw_canvas ─┐
             ├─► OpenAI Realtime session ─────┤  draw_flow      ├─► TLDraw canvas
text (live) ─┘     (gpt-realtime-2, WebRTC)   ├─► capture_canvas ┘   (a projection)
                                              └─► spoken/text reply
```

## Components

### Client (browser)

| Module | Responsibility |
|--------|----------------|
| `src/main.tsx` | React entry point. |
| `src/App.tsx` | Wires inputs → tool handlers → canvas. Owns the editor ref, the "shapes drawn by the last tool call" ref, and session state. |
| `src/canvas/LumenCanvas.tsx` | Mounts TLDraw and hands the `Editor` instance up on mount. |
| `src/canvas/drawCanvas.ts` | Projects a free-form element list (shapes, notes, text, connectors) onto TLDraw. Primary drawing path. |
| `src/canvas/drawFlow.ts` | Projects a linear flow diagram onto TLDraw. Shortcut path. |
| `src/canvas/normalizeFlow.ts` | Validates/coerces raw tool args into a safe `FlowDiagram`. |
| `src/realtime/RealtimeClient.ts` | WebRTC peer connection, mic capture, model-audio playback, data-channel events, and function-call handling. |
| `src/ui/ConversationPanel.tsx` | Text input, session controls, status, transcripts. |
| `src/assistant/types.ts` | Shared contract: `FlowDiagram`, `AssistantAction`, `AssistantProvider`. |

### Server (dev only)

| Module | Responsibility |
|--------|----------------|
| `server/realtimePlugin.ts` | Vite dev-server middleware exposing `POST /api/realtime/token`. Mints an ephemeral OpenAI client secret and embeds the session instructions + tool definitions. The standard API key stays here and never reaches the browser. |

> The token endpoint is currently a Vite **dev** middleware. A production
> deployment needs an equivalent trusted endpoint (see
> [`decisions/ADR-0002-openai-realtime-webrtc.md`](decisions/ADR-0002-openai-realtime-webrtc.md)).

## Request / event flow

### Live session (voice or text)

1. User clicks **Start voice session**. `RealtimeClient.connect()` fetches an
   ephemeral token from `/api/realtime/token`.
2. It opens a `RTCPeerConnection` (mic track in, model audio out, `oai-events`
   data channel) and completes the SDP handshake with `…/v1/realtime/calls`.
3. User speaks or types. The model decides to call a tool.
4. The client receives `response.function_call_arguments.done`, runs the tool
   via `App`'s `onToolCall`, then replies with `function_call_output` +
   `response.create`.
5. Tool handlers normalize args and draw onto TLDraw. The canvas updates.

## Tools (the contract)

| Tool | Purpose |
|------|---------|
| `draw_canvas` | Full vocabulary: any geo shape, sticky notes, text labels, connectors, with color/fill/size/position. Primary. |
| `draw_flow` | Linear flowchart shortcut. |
| `capture_canvas` | Screenshots the canvas and returns it to the model as an `input_image` for a look-then-realign vision loop. |

Full schemas and behaviors are in [`SPEC.md`](SPEC.md).

## Key principles

- **The canvas is a projection, never the source of truth.** Each draw call
  replaces what the previous call drew; the durable record is the tool-call
  intent, not TLDraw's element JSON.
  ([ADR-0003](decisions/ADR-0003-canvas-as-projection.md))
- **The API key is server-side only.** The browser uses short-lived ephemeral
  tokens. ([ADR-0002](decisions/ADR-0002-openai-realtime-webrtc.md))
- **Untrusted args are validated before they touch the canvas.** See
  `normalizeFlow.ts` / `normalizeCanvasElements`.
- **Tool args are validated against real TLDraw enums.** Style values
  (geo/color/fill/size) are mirrored from the installed schema to avoid runtime
  validation errors. ([ADR-0004](decisions/ADR-0004-full-tldraw-vocabulary.md))

## Tech stack

- React 18 + TypeScript 5, bundled by Vite 5.
- TLDraw 3.15 as the canvas/render engine.
- OpenAI Realtime API (`gpt-realtime-2`) over WebRTC for voice + text + tools.

## Known constraints

- The token endpoint is dev-only (Vite middleware).
- Realtime image input must ride in a `user`-role message; the screenshot is
  labelled as an automated capture so the model doesn't thank the user for it.
- The production bundle is large (TLDraw); code-splitting is a future task.
