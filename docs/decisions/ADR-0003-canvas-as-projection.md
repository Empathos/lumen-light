# ADR-0003: The canvas is a projection of tool calls, not the source of truth

## Status
Accepted

## Date
2026-06-24

## Context
The assistant draws on TLDraw. TLDraw has its own rich document/element JSON. We
needed to decide whether that element JSON is the durable record, or whether it's
a rendered view of something more abstract.

## Decision
Treat the canvas as a **projection**. The meaningful intent is the tool call
(`draw_canvas` / `draw_flow` element model); TLDraw shapes are a rendering of it.
Each draw call deletes the shapes created by the previous call and re-projects,
tracking only the ids it created (so user-drawn shapes are never touched).

## Alternatives Considered

### TLDraw element JSON as the source of truth
- Pros: no mapping layer; persistence is "just save the document".
- Cons: couples the product model to a specific canvas engine; makes the durable
  record engine-specific JSON rather than portable intent. Rejected — it
  contradicts the product's "surface as projection" principle inherited from the
  original Lumen Light.

### Append-only drawing (never replace)
- Pros: simplest.
- Cons: the canvas piles up and desyncs from the conversation's current
  structure. Rejected in favor of replace-on-each-call.

## Consequences
- A normalization + projection layer is required (`drawCanvas.ts`, `drawFlow.ts`,
  `normalizeFlow.ts`).
- Portability/persistence can target the abstract model later, independent of
  TLDraw.
- "Replace previous" means the agent must always send the complete intended
  state in each draw call — documented in `SPEC.md` and the session instructions.
