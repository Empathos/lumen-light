# Conversation Surface Model

This document consolidates the useful Beacon Table prototype concepts into
Lumen Light without copying prototype files or private deployment assumptions.

The product model is:

```text
source material
  -> event stream
  -> turn queue
  -> normalized items
  -> staged surface changes
  -> accepted live surface
  -> artifact export packet
```

The key distinction is that the visual surface is a projection. The durable
contract is the normalized item and artifact stream.

## Source Material

Lumen Light can accept multiple evidence sources:

- spoken transcript chunks
- typed conversation turns
- selected document highlights
- manual card edits
- agent suggestions
- imported source notes

Each source event should be reduced into stable turn records before it affects
the surface.

## Turn Queue

A turn is the smallest public unit of conversation evidence.

```json
{
  "turn_id": "turn_001",
  "speaker": "facilitator",
  "text": "Let's keep semantic highlighting separate from durable memory.",
  "timestamp": "2026-01-01T12:00:00Z",
  "source": "typed"
}
```

The turn queue should filter filler and transport noise before downstream
models or deterministic processors create surface changes.

## Normalized Items

Normalized items are conversation-derived meaning units:

- highlight
- card
- decision
- question
- action
- diagram node
- diagram edge

These items are independent from any particular canvas engine. A card can be
rendered on a whiteboard, listed in a briefing page, or exported to a memory
system without changing its identity.

## Staged Changes

Agent-generated updates should begin as staged surface changes.

```text
turn evidence -> proposed item -> staged surface object -> review -> live object
```

Staging allows the UI to stay useful in real time while preventing transient
model output from becoming durable state without review.

## Live Surface

The live surface is what participants see during the session:

- highlighted transcript spans
- cards
- diagram nodes
- diagram edges
- viewport focus
- accepted annotations

The live surface can be reset, rearranged, or replaced without destroying the
underlying evidence trail.

## Artifact Export Packet

An export packet should contain:

- accepted artifacts
- source turn IDs
- optional source spans
- surface projection metadata
- confidence
- memory-enrichment hints
- unresolved questions and actions

Memory systems consume the export packet, not the transient canvas state.

## Implementation Rules

- Keep plain text and turn records recoverable.
- Treat canvas objects as projections of normalized items.
- Make staged/live state explicit in the artifact schema.
- Keep provider-specific realtime adapters outside the core contract.
- Validate every public fixture against the schema.
- Keep private transcripts, local paths, credentials, and operational logs out
  of the public repository.
