# Contract Port Plan - 2026-06-24

## Purpose

The canvas-first app should become the Lumen-Light / Beacon Table trunk without
losing the older implementation's strongest contract: grounded briefing,
source spans, staged artifacts, human review, and evidence-linked export.

## Source Material To Port

- `src/briefing-review/source-pane.js`: source span anchoring and active
  highlight rendering.
- `src/briefing-review/state.js`: staged artifact state machine,
  accept/reject/edit behavior, and accepted-only export packets.
- `src/briefing-review/excalidraw-projection.js`: deterministic projection of
  reviewed artifacts into a visual surface.
- `examples/briefing-session.example.json`: synthetic fixture for a grounded
  briefing loop.
- `schemas/conversation-artifact.schema.json`: durable artifact schema.
- `test/briefing-review/`: current anchoring, state, and projection tests.

## Target In The Canvas-First App

Add the smallest integrated loop inside the current app:

```text
source pane
  -> agent briefing turn
  -> highlight_source / focus_source
  -> draw_canvas or draw_flow
  -> staged artifact
  -> accept / reject / edit
  -> evidence-linked export packet
```

## Commit Sequence

1. Add a synthetic source fixture and source-pane state.
2. Port source-span anchoring as TypeScript with tests.
3. Add `highlight_source` and `focus_source` tools to the realtime contract.
4. Port staged artifact state as TypeScript with tests.
5. Add review controls and accepted-only export.
6. Wire the same contract into the live Realtime session.

## Done Test

Given a synthetic source document, a text or voice prompt should produce:

- a visible source highlight,
- a canvas drawing,
- a staged artifact linked to the evidence span,
- an accepted export packet containing only reviewed artifacts and source
  references.

This is the baseline branch point for feature work beyond trunk promotion.
