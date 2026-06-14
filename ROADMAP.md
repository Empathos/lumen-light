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

## Phase 1: Shared Highlighting and Briefing Page

Goal: make the browser highlighter useful as a shared briefing surface.

- Improve re-anchoring for repeated text and changed documents.
- Add import support for previously exported highlight records.
- Add an optional read-only mode for published documents.
- Add fixture-backed tests for highlight record shape.
- Add a public-safe shared briefing page pattern for review sessions.
- Keep the runtime dependency-free unless a concrete need appears.

## Phase 2: Shared Canvas and Whiteboard

Goal: move from highlighted text to a shared visual workspace.

- Add a canvas where participants can draw, annotate, and place shapes.
- Support cards, arrows, groups, freehand marks, and lightweight diagrams.
- Let realtime model sessions propose visual objects during discussion.
- Keep model-proposed objects staged until accepted by the user or policy.
- Preserve plain text, surface state, and provenance as separate layers.

## Phase 3: Generated Whiteboard Objects

Goal: let visual objects become richer than simple shapes without losing inspectability.

- Add object slots that can hold generated images, thumbnails, and visual variants.
- Support OpenAI image generation for whiteboard objects.
- Keep provider boundaries open for additional image models and adapters.
- Store generated-object metadata separately from private prompts or credentials.
- Allow generated objects to be accepted, revised, pinned, or discarded.

## Phase 4: Artifact Contract

- Align highlight export records with the conversation artifact schema.
- Add separate examples for highlights, questions, decisions, and actions.
- Add a deterministic validator path for every public fixture.
- Define confidence, provenance, and source-span fields clearly.

## Phase 5: Conversation Surface

Goal: connect live conversation to an inspectable thinking surface.

- Define a turn queue format for voice and text input.
- Add staging semantics for agent-proposed cards and diagrams.
- Support realtime model integrations, including OpenAI Realtime and Gemini Realtime style adapters.
- Keep automated surface changes reviewable before they become live state.
- Document how external memory systems should consume emitted artifacts.

## Phase 6: Integrations and Control Surfaces

Goal: support downstream products without binding the public repo to one private stack.

- Add NotebookLM-oriented export/import patterns for briefing packets and source bundles.
- Define plugin and MCP boundaries for controlling Lumen Light.
- Define plugin and MCP boundaries for external systems that consume Lumen Light artifacts.
- Provide generic integration examples for memory backends.
- Add adapter boundaries for storage, retrieval, and provenance systems.
- Keep real credentials, hostnames, IDs, transcripts, and deployment manifests out of the public upstream.

## Near-Term Criteria

The next public release should be able to:

- run the static highlight demo locally,
- validate all synthetic fixtures,
- export browser highlights as structured records,
- use a shared briefing page as a review surface,
- explain how public artifacts map to private operational use,
- remain useful without any private infrastructure.
