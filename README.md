# Lumen Light

Lumen Light is a realtime thinking surface for conversations that are too important to leave as plain transcripts.

It listens to live discussion as it becomes useful structure: highlights, cards, diagrams, staged whiteboard changes, and memory-enrichment artifacts. The goal is to let a conversation become a working surface while it is happening, then leave behind clean records that external memory systems can trust.

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

Lumen Light is staged as a public product skeleton with a working static HTML highlight runtime. The current implementation defines the core architecture, product requirements, artifact schema, synthetic example, deterministic validation script, and browser demo.

The conversation-surface model consolidates earlier prototype lessons into public primitives: turns, normalized items, staged changes, live surface state, and artifact export packets.

See `docs/FEATURE-MAP.md` for the master feature map and roadmap.
See `ROADMAP.md` for the staged public development path.

Run the public-safe eval:

```bash
python3 -m pip install -r requirements.txt
python3 scripts/validate_artifact.py examples/conversation-artifact.example.json
python3 scripts/validate_artifact.py examples/highlight-artifact.example.json
python3 scripts/validate_artifact.py examples/staged-card-artifact.example.json
node --check src/static-highlighter/lumen-light.js
```

Open the static demo in a browser:

```text
examples/static-highlight-demo.html
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
