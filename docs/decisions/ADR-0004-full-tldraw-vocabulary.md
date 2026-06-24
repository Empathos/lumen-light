# ADR-0004: Expose the full TLDraw vocabulary via `draw_canvas`

## Status
Accepted

## Date
2026-06-24

## Context
The first working loop only drew flowcharts (`draw_flow`). For an open-ended
"think out loud and watch it become visual" experience, the agent needs to make
mind maps, comparisons, sticky-note clusters, labelled diagrams — not just
boxes-and-arrows. The user explicitly asked for "free rein to all shapes, objects
and notes TLDraw has."

## Decision
Add a general `draw_canvas` tool whose element model covers TLDraw's full
practical vocabulary: every geo shape, sticky notes, free text, and connectors,
with color/fill/size/position. Keep `draw_flow` as a convenient shortcut for the
common linear-flow case.

## Alternatives Considered

### Keep only `draw_flow`
- Pros: tiny, fully validated surface.
- Cons: everything looks like a flowchart; defeats the creative-canvas goal.
  Rejected.

### One mega-tool with freeform TLDraw JSON pass-through
- Pros: maximally expressive.
- Cons: the model produces JSON that fails TLDraw's strict v3 validation
  (e.g. `geo.richText` vs `arrow.text`); no safety net. Rejected in favor of a
  curated element model we normalize.

## Consequences
- Enum values (geo/color/fill/size) are mirrored from the installed TLDraw schema
  so the agent can't request a value the renderer rejects.
- `normalizeCanvasElements` drops invalid elements and dangling connectors before
  drawing, so a bad tool call degrades gracefully instead of crashing.
- The session instructions actively encourage variety so the agent uses the
  vocabulary rather than defaulting to rectangles.
- Two draw tools coexist; both obey the replace-previous rule (ADR-0003).
