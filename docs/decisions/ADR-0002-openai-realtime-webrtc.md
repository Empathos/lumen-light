# ADR-0002: OpenAI Realtime over WebRTC with ephemeral tokens

## Status
Accepted

## Date
2026-06-24

## Context
The product is voice-first (with text as an equal input). We need low-latency
spoken interaction where the model can also call tools to drive the canvas. The
browser must never hold a standard OpenAI API key.

## Decision
Use the OpenAI Realtime API (`gpt-realtime-2`) over a browser **WebRTC** peer
connection. A server endpoint mints a short-lived **ephemeral client secret**
(`POST /v1/realtime/client_secrets`); the browser uses that to complete the SDP
handshake (`POST /v1/realtime/calls`). Tools are configured at token-mint time so
they're active the moment the session opens. Function calls follow
`response.function_call_arguments.done` → run tool → `function_call_output` →
`response.create`.

## Alternatives Considered

### WebSocket transcription + separate text agent (the original prototype)
- Pros: already existed; simple.
- Cons: not true speech-to-speech; higher latency; more plumbing. Rejected for
  the live briefer; WebRTC is OpenAI's recommended browser transport.

### Standard API key in the browser / chat-completions
- Pros: simplest to wire.
- Cons: leaks the key to clients; not low-latency voice. Rejected outright.

### Agents SDK (`RealtimeAgent`/`RealtimeSession`) helpers
- Pros: higher-level ergonomics.
- Cons: more abstraction than needed for a focused tool-driven loop. Deferred;
  the raw WebRTC interface is well understood and verified against current docs.

## Consequences
- A trusted server endpoint is required. Currently a Vite **dev** middleware
  (`server/realtimePlugin.ts`); production needs an equivalent.
- Endpoints/event names were verified against current OpenAI docs because the
  Realtime API shape changes often.
- Image input (for `capture_canvas`) must ride in a `user`-role message
  (see ADR-0005).
