# ADR-0005: Screenshot vision feedback loop (`capture_canvas`)

## Status
Accepted

## Date
2026-06-24

## Context
The agent draws "blind" — it emits element coordinates but can't see the rendered
result, so layouts overlap or drift. We wanted it to be able to look at what it
drew and fix it, the way a person glances at the whiteboard and straightens
things.

## Decision
Add a `capture_canvas` tool. When called, the client screenshots the canvas
(`editor.toImage`, PNG data URL) and feeds it back to the model as an
`input_image` so it can assess the layout and issue a corrective draw call. This
is a model-driven (probabilistic) loop — the agent chooses when to look — not a
forced draw→capture→fix cycle on every turn.

## Alternatives Considered

### No vision; trust the coordinates
- Pros: simplest.
- Cons: overlaps and messy layouts with no recovery path. Rejected.

### Deterministic auto-capture after every draw
- Pros: guarantees a self-check.
- Cons: doubles latency/cost on every turn and removes agent judgment.
  Rejected — expose the tool and instruct the agent on when it's worth it.

## Consequences
- Realtime image input must be sent as a `user`-role message. The screenshot is
  prefixed `[AUTOMATED SYSTEM MESSAGE — not from the user]` and the session
  instructions tell the agent not to thank the user for screenshots — without
  this, the agent misattributes the capture to the user.
- `RealtimeClient` special-cases a tool result containing an `image` field:
  it sends the normal `function_call_output`, then the image message, then
  `response.create`.
- Adds a real but bounded latency/token cost whenever the agent chooses to look.
