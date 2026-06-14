# Lumen Light

Lumen Light is a realtime thinking surface for turning live conversation into structured text, cards, diagrams, whiteboard state, and memory-enrichment artifacts.

The project combines a visual collaboration surface with a semantic text layer. It keeps the live workspace useful in the moment while producing durable, structured artifacts that can enrich OpenReflect or other external memory systems.

## Why it exists

Conversation is where many decisions, questions, corrections, and design insights first appear. Standard transcripts preserve words, but they do not preserve enough structure to help people think with the conversation while it is happening.

Lumen Light exists to make conversation operationally visible: important text can be highlighted, ideas can become cards, relationships can become diagrams, and memory systems can receive structured artifacts instead of raw dumps.

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
│   └── PRD.md
├── examples/
│   ├── conversation-artifact.example.json
│   └── static-highlight-demo.html
├── prompts/
│   └── validate-artifact.prompt.md
├── schemas/
│   └── conversation-artifact.schema.json
├── scripts/
│   └── validate_artifact.py
└── src/
    └── lumen-light.js
```

## Current status

Lumen Light is staged as a public product skeleton with a working static HTML highlight runtime. The current implementation defines the core architecture, product requirements, artifact schema, synthetic example, deterministic validation script, and browser demo.

See `ROADMAP.md` for the staged public development path.

Run the public-safe eval:

```bash
python3 scripts/validate_artifact.py examples/conversation-artifact.example.json
node --check src/lumen-light.js
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
