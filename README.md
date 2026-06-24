# Lumen-Light

Lumen Light is a realtime thinking surface for conversations that are too important to leave as plain transcripts.

It listens to live discussion as it becomes useful structure: highlights, cards, diagrams, staged whiteboard changes, and memory-enrichment artifacts. The goal is to let a conversation become a working surface while it is happening, then leave behind clean records that external memory systems can trust.

## Current trunk

The canonical project remains this root **Lumen-Light** repository. The current
product trunk lives in [`refined-lumen-light/`](refined-lumen-light/) while the
repo is being promoted into a clean canvas-first baseline.

That app is the active Beacon Table direction: TLDraw as the main surface,
OpenAI Realtime voice/text, tool-driven drawing, and a canvas-as-projection
runtime contract. The older root-level briefing review code remains source
material for provenance, staged artifacts, source spans, and export behavior.

## Why it exists

Conversation is where many decisions, questions, corrections, and design insights first appear. Standard transcripts preserve the words after the fact, but they flatten the live shape of the work: what mattered, what changed, what needs review, and what should become durable.

Lumen Light exists to make that shape visible. Important text can be highlighted, ideas can become cards, relationships can become diagrams, and memory systems can receive structured artifacts instead of raw dumps.

## Core idea

```text
voice/text input
      |
      v
turn queue + semantic parser
      |
      +--> text light layer ---------> highlighted transcript
      |
      +--> canvas planner -----------> cards / diagrams / whiteboard
      |
      +--> artifact emitter ---------> OpenReflect / external memory systems
```

The live surface stays interactive and reversible. Long-term memory systems handle enrichment, provenance, recall, and insight over time.

## What Lumen Light manages

- A dependency-free browser highlighter for static HTML.
- Realtime transcript-to-canvas updates.
- Semantic text state such as speaker, state, intensity, and emphasis.
- Cards, diagrams, and whiteboard objects derived from conversation.
- Staging and live modes for agent-assisted canvas changes.
- Structured memory-enrichment artifacts for OpenReflect and external memory systems.
- Public-safe validation of synthetic artifact records.

## Design principles

- Preserve plain text as the fallback source of truth.
- Keep visual emphasis sparse, meaningful, and reversible.
- Separate live collaboration from durable memory enrichment.
- Prefer structured artifacts over transcript dumping.
- Keep public framework code separate from private operational data.
- Make every automated update inspectable before it becomes durable state.

## Repository layout

```text
.
├── AGENTS.md
├── README.md
├── ROADMAP.md
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CONVERSATION-SURFACE-MODEL.md
│   ├── FEATURE-MAP.md
│   └── PRD.md
├── examples/
│   ├── conversation-artifact.example.json
│   ├── highlight-artifact.example.json
│   ├── staged-card-artifact.example.json
│   ├── turn-queue.example.json
│   └── static-highlight-demo.html
├── prompts/
│   └── validate-artifact.prompt.md
├── refined-lumen-light/
│   ├── PRD.md
│   ├── docs/
│   ├── server/
│   └── src/
├── schemas/
│   └── conversation-artifact.schema.json
├── scripts/
│   └── validate_artifact.py
├── src/
│   └── static-highlighter/
│       └── lumen-light.js
└── prototypes/
    └── lumen-light-whiteboard-prototype/
```

## Current status

Lumen Light is being consolidated around the canvas-first Beacon Table app in
`refined-lumen-light/`. The root-level implementation still defines the
evidence-linked briefing/review contract, artifact schema, synthetic examples,
deterministic validation script, and browser demo that should be ported forward.

The conversation-surface model consolidates earlier prototype lessons into public primitives: turns, normalized items, staged changes, live surface state, and artifact export packets.

See `docs/FEATURE-MAP.md` for the master feature map and roadmap.
See `ROADMAP.md` for the staged public development path.
See `docs/TRUNK-BASELINE-PLAN-2026-06-24.md` for the current trunk promotion
plan.

Run the current canvas-first app:

```bash
cd refined-lumen-light
npm install
npm run dev
```

Run its verification gates:

```bash
cd refined-lumen-light
npm run typecheck
npm run build
```

Run the public-safe eval:

```bash
python3 -m pip install -r requirements.txt
python3 scripts/validate_artifact.py examples/conversation-artifact.example.json
python3 scripts/validate_artifact.py examples/highlight-artifact.example.json
python3 scripts/validate_artifact.py examples/staged-card-artifact.example.json
python3 -m unittest discover -s test
node --check src/static-highlighter/lumen-light.js
```

Open the static demo in a browser:

```text
examples/static-highlight-demo.html
```

## Briefing review demo

The briefing review demo is the first assistant/operator-controlled product
loop: load source material, step through scripted agent briefing turns, watch
the referenced source span highlight, accept/reject/edit the staged artifacts,
project the reviewed artifacts into the visual surface, and export the accepted
packet as JSON. There is no voice or model call in this slice — it runs off a
deterministic fixture — but Excalidraw/whiteboard projection is part of the
intended integrated surface from the beginning.

Run the Node test harness (artifact state machine + source anchoring):

```bash
npm test
```

Open the demo locally. It fetches a JSON fixture, so serve over HTTP rather
than opening the file directly:

```bash
python3 -m http.server 8787
```

```text
http://localhost:8787/examples/briefing-review-demo.html
```

Manual loop: click a briefing turn (or use Next/Previous), confirm the source
span highlights and that the artifact appears as a card on the Excalidraw
projection board (the active turn's card is focused). Accept one artifact and
reject or edit another, and watch the projection update — accepted/edited cards
restyle and rejected cards drop out of the board. Then click "Export accepted" —
the packet should contain accepted artifacts only, each with a source span
reference. "Debug export (all)" includes every state, and the "Show rejected
(debug)" toggle re-includes rejected cards in the projection.

The Excalidraw projection is a *view* of Lumen artifact state, not a source of
truth. Artifacts are mapped deterministically into Excalidraw skeleton element
JSON (the same shape the whiteboard prototype feeds to
`convertToExcalidrawElements`) and re-projected on every change; the element JSON
is never made durable.

Relevant files:

```text
src/briefing-review/state.js                  artifact state machine + export packet
src/briefing-review/source-pane.js            scoped source span anchoring + rendering
src/briefing-review/excalidraw-projection.js  deterministic artifact -> Excalidraw mapping
src/briefing-review/demo.js                   browser demo controller (operator actions)
examples/briefing-session.example.json        synthetic fixture
examples/briefing-review-demo.html            demo page
test/briefing-review/                         Node tests for anchoring, state, projection
```

Expected validator output:

```text
LUMEN_LIGHT_ARTIFACT_OK
```

## Public/private model

Use this repository as the generic upstream. Keep environment-specific customizations in private downstream repositories or private branches.

```text
empathos/lumen-light     public generic framework
private downstream fork  local credentials, IDs, deployment, logs
```

This keeps the public framework reusable while preserving operational privacy.
