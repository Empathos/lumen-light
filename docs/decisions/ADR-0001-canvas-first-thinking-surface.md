# ADR-0001: Canvas-first thinking surface (not a chat window)

## Status
Accepted

## Date
2026-06-24

## Context
The original Lumen Light concept was a source-document + review-list product with
a chat/briefing pane. The canvas-first direction is different: the user wants to think
out loud and watch an AI collaborator turn the conversation into visual structure
in real time. The question was what the primary surface should be.

## Decision
Make a large open whiteboard (TLDraw) the main stage. The assistant draws on it
as the user talks or types; any chat/transcript is secondary. The canvas is the
product, not a feature bolted onto a chat.

## Alternatives Considered

### Chat-first with a canvas panel
- Pros: familiar; easy to build.
- Cons: keeps the agent "trapped in a message thread"; the visual surface becomes
  an afterthought. Rejected — it contradicts the core insight that the canvas is
  where coherence is created.

### Source-document + review list (original product)
- Pros: strong provenance story.
- Cons: not the live, generative, think-out-loud experience the canvas-first vision
  targets. Deferred, not adopted, for v0.

## Consequences
- Requires a programmable canvas the agent can draw into (TLDraw).
- The UI is split: canvas as the dominant surface, a slim conversation/control
  panel beside it.
- Trust/provenance (a strength of the original) becomes an open question on a
  live creative canvas — tracked in `PRD.md` and `SPEC.md`.
