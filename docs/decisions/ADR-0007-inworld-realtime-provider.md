# ADR-0007: Inworld Realtime provider (proxied signaling + router)

## Status
Accepted (branch `v0.5-inworld-62426`)

## Date
2026-06-24

## Context
This iteration branch swaps the realtime "brain + voice" from OpenAI to Inworld
to get more natural realtime voice and access to model routing. The goal was the
most realistic realtime voice with routing to an advanced model, without
disturbing the canvas seam (ADR-0003) or the tool contract (ADR-0004).

Inworld implements the OpenAI Realtime protocol: the data channel is still
`oai-events`, the events are identical (`response.function_call_arguments.done`
→ `function_call_output` → `response.create`), and tool/function schemas have the
same shape. So most of our realtime code is reusable as-is.

Two things are genuinely different from OpenAI:
1. **Auth/signaling.** Inworld authenticates `POST /v1/realtime/calls` and
   `GET /v1/realtime/ice-servers` with `Authorization: Bearer <API_KEY>` and has
   no ephemeral-token (`ek_…`) mechanism. A browser talking to Inworld directly
   would have to hold the key.
2. **Decomposed pipeline + router.** OpenAI bundles STT+LLM+TTS into
   `gpt-realtime`. Inworld separates them: `session.model` (LLM or a router id),
   `session.audio.input.transcription.model` (STT), and
   `session.audio.output.{model,voice}` (TTS).

## Decision
- **Proxy the signaling through our dev server** so the API key stays server-side
  (upholding the security principle from ADR-0002). The browser calls
  `GET /api/realtime/ice` and `POST /api/realtime/call`; the server attaches the
  session config and forwards both to Inworld with the Bearer key.
- **Use Inworld's full voice stack** for realism: `inworld/inworld-stt-1`,
  `inworld-tts-2`, a premium voice, and `semantic_vad` ("Smart Turn") for natural
  turn-taking.
- **Point `session.model` at a single Inworld router** whose primary is a
  balanced fast frontier model with a fallback variant. Voice realism is
  independent of the LLM, so a heavier brain only costs response latency.
- **Branch-local swap** — no cross-provider abstraction yet (see Consequences).

## Alternatives Considered

### Browser holds the key (Inworld's quickstart `/api/config` style)
- Pros: simplest; one fewer server round-trip.
- Cons: leaks the API key to the client. Rejected — violates ADR-0002.

### OpenAI Agents SDK over Inworld's WebRTC proxy
- Pros: handles the WebRTC lifecycle for you.
- Cons: more abstraction than our focused tool loop needs, and we already have a
  working raw client. Deferred.

### A/B or CEL conditional routing now
- Pros: compare models / route by context.
- Cons: premature; the goal here is one good realtime path. A single fixed router
  gets failover for free and evolves into A/B later. Deferred.

### Provider abstraction across openai/inworld/ultravox now
- Pros: DRY across the three provider branches.
- Cons: the right seam isn't clear until all three exist. Chose a branch-local
  swap; we'll factor the abstraction once we can compare the branches.

## Consequences
- New signaling shape: `GET /api/realtime/ice` + `POST /api/realtime/call`
  (replacing OpenAI's single `/api/realtime/token` mint). This **supersedes the
  transport/auth specifics of ADR-0002 on this branch**; the key-stays-server
  principle is preserved.
- `RealtimeClient` constructs `RTCPeerConnection({ iceServers })` and does a
  JSON SDP exchange; everything below `connect()` (events, tools, the
  `capture_canvas` → `input_image` loop) is unchanged.
- Requires an Inworld API key and a router (`scripts/create-inworld-router.sh`
  or the Portal). The offline mock still works with no key.
- `server_vad` behaves differently on Inworld (Silero + Smart Turn); we use
  `semantic_vad`, so any prior OpenAI VAD tuning does not carry over.
