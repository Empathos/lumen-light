# Lumen Light / Beacon Table Deep Analysis - 2026-06-24

## BLUF

Lumen Light has a strong product spine and a working technical base. The repo is
not just speculative docs: the evidence-linked briefing review loop has tests,
the refined TLDraw app builds, the OpenAI Realtime WebRTC path matches the
official ephemeral-token pattern, and the older whiteboard prototype has broad
coverage.

The main product risk is directional split. The top-level Lumen Light model is
grounded briefing with source spans, staging, accepted artifacts, and export
packets. `refined-lumen-light` is a canvas-first live collaborator. Both are
valuable, but the MVP should deliberately merge them around one hero loop:

```text
source / conversation -> agent briefing -> highlight evidence
  -> draw structure on canvas -> stage artifact -> accept/export
```

## Repository Shape

- Top-level repo: public framework, product docs, schemas, synthetic examples,
  static highlighter, briefing-review demo.
- `src/briefing-review/`: current durable-state proof point for source
  anchoring, staged review, export packets, and deterministic projection.
- `refined-lumen-light/`: current canvas-first React/TLDraw + OpenAI Realtime
  app.
- `prototypes/lumen-light-whiteboard-prototype/`: earlier, larger
  AutoPreso-derived whiteboard loop with server, settings, transcription,
  staging/live mode, screenshots, and model provider abstractions.

## What Is Solid

- The top-level product thesis is coherent: Lumen Light is not "chat plus
  canvas"; it is an evidence-linked briefing/thinking surface.
- The trust model is implemented in the briefing review slice:
  agent artifacts enter as staged, accepted export requires source-span
  references, edits preserve original text, and default export excludes
  rejected/staged items.
- Source anchoring is cautious: exact text plus prefix/suffix context is used
  when available, ambiguous spans are skipped rather than mis-anchored.
- Canvas projection is correctly treated as a view, not durable truth. Both the
  Excalidraw projection and refined TLDraw app preserve this principle.
- `refined-lumen-light` has the right technical seam: voice and text both route
  to the same tool handlers before touching the canvas.
- The OpenAI Realtime implementation uses the documented WebRTC +
  ephemeral-token shape: server mints a client secret, browser posts SDP to
  `/v1/realtime/calls` with the ephemeral key.
- Security boundary is sane: `.env.local` is gitignored and the standard API key
  stays server-side.

## Current Verification

Ran on 2026-06-24:

- `npm test` at repo root: 31/31 passing.
- `python3 -m unittest discover -s test`: 2/2 passing.
- Fixture validation:
  - `examples/conversation-artifact.example.json`: OK.
  - `examples/highlight-artifact.example.json`: OK.
  - `examples/staged-card-artifact.example.json`: OK.
- `node --check src/static-highlighter/lumen-light.js`: OK.
- `npm run typecheck && npm run build` in `refined-lumen-light`: passing.
  Vite warns that the production bundle is large because TLDraw dominates the
  bundle.
- `npm test` in `prototypes/lumen-light-whiteboard-prototype`: 224 passing,
  1 skipped browser smoke test because Chrome is not configured for that test.

## Main Gap

The repo has two strong halves that are not yet one product:

- The top-level briefing review demo proves evidence, staging, acceptance, and
  export.
- The refined app proves live voice/text -> tools -> TLDraw canvas.

What is missing is the integrated Beacon Table loop where the same live agent
can point at source evidence, draw the structure, and produce reviewable
artifacts in one interface.

## Risks

1. Product drift toward "AI draws diagrams" without the source/evidence contract.
   That would make the demo flashier but less defensible.
2. Product drift toward "review workflow" without the live shared-surface magic.
   That would make the product trustworthy but less alive.
3. The refined app currently has no persistence/export path, so the user does
   not clearly leave with a durable record.
4. The document briefing mode is still planned, not implemented, in the refined
   app.
5. There are no unit tests yet for the refined app's pure canvas normalizers,
   even though the docs name them as priority targets.
6. The Realtime endpoint is currently Vite dev middleware. Production needs a
   trusted endpoint with a safety identifier and deployment-specific controls.
7. Bundle size needs later attention, but it should not block the MVP.

## Recommended Next Slice

Build one integrated, deterministic hero demo before expanding infrastructure:

1. In `refined-lumen-light`, add a source pane with a synthetic document.
2. Add `highlight_source` and `focus_source` tools.
3. Add a local staged-artifact queue using the proven top-level review-state
   rules.
4. Let typed text first drive the whole loop through the same live tool contract:
   brief turn -> source highlight -> TLDraw drawing -> staged artifact.
5. Add accept/reject/edit/export for staged artifacts.
6. Then wire the same tools into the Realtime session.

Done test:

```text
Given a synthetic source document, a typed prompt produces a visible source
highlight, a TLDraw structure, and a staged artifact. The user accepts it and
exports a packet that preserves the evidence span. The same tool contract is
available to the Realtime voice session.
```

## Working Judgment

The right path is not to choose between the original Lumen Light and the refined
canvas app. The product is the fusion: Beacon Table should feel like a live
thinking canvas, but its durable output must remain evidence-linked,
reviewable, and exportable.

The strongest near-term move is to make the integrated source-highlight +
canvas-draw + staged-artifact loop demonstrable before adding more planning
surface.
