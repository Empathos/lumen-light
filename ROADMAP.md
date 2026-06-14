# Lumen Light Roadmap

This roadmap keeps the public repo focused on reusable product substance.
Environment-specific deployment, private transcripts, and operational logs belong
in private downstream repositories or branches.

## Phase 0: Public Baseline

Status: current

- Define the public product thesis and architecture.
- Publish a dependency-free static HTML highlighter.
- Provide a synthetic artifact schema and fixture.
- Keep examples public-safe and deterministic.
- Document the public/private operating model.

## Phase 1: Highlight Runtime

Goal: make the browser highlighter useful as a small standalone tool.

- Improve re-anchoring for repeated text and changed documents.
- Add import support for previously exported highlight records.
- Add an optional read-only mode for published documents.
- Add fixture-backed tests for highlight record shape.
- Keep the runtime dependency-free unless a concrete need appears.

## Phase 2: Artifact Contract

Goal: turn highlights and surface objects into durable memory-enrichment records.

- Align highlight export records with the conversation artifact schema.
- Add separate examples for highlights, questions, decisions, and actions.
- Add a deterministic validator path for every public fixture.
- Define confidence, provenance, and source-span fields clearly.

## Phase 3: Conversation Surface

Goal: connect live conversation to an inspectable thinking surface.

- Define a turn queue format for voice and text input.
- Add staging semantics for agent-proposed cards and diagrams.
- Keep automated surface changes reviewable before they become live state.
- Document how external memory systems should consume emitted artifacts.

## Phase 4: Integrations

Goal: support downstream products without binding the public repo to one private stack.

- Provide generic integration examples for memory backends.
- Add adapter boundaries for storage, retrieval, and provenance systems.
- Keep real credentials, hostnames, IDs, transcripts, and deployment manifests out of the public upstream.

## Near-Term Criteria

The next public release should be able to:

- run the static highlight demo locally,
- validate all synthetic fixtures,
- export browser highlights as structured records,
- explain how public artifacts map to private operational use,
- remain useful without any private infrastructure.
