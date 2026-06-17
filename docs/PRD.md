# Lumen Light PRD

## Product thesis

Lumen Light turns live conversation into a structured thinking surface. It should help a user see what is happening in a conversation while producing artifacts that memory systems can enrich later.

## Goals

- Capture live turns from voice or text input.
- Produce a readable transcript with optional semantic light.
- Convert selected ideas into cards, diagrams, and whiteboard objects.
- Support staging mode before agent-generated canvas changes go live.
- Emit structured artifacts for OpenReflect and external memory systems.
- Validate public examples without private data.

## Non-goals

- Replacing long-term memory systems.
- Storing private transcripts in the public repo.
- Building a general-purpose design canvas before the conversation loop works.
- Hiding agent edits from user inspection.

## Primary users

- People using live conversation for planning, design, coaching, or research.
- Teams that want conversation-derived artifacts to feed memory and insight systems.
- Developers building provenance-aware memory integrations.

## v0.1 requirements

- Define a conversation artifact schema.
- Define the conversation surface model: turns, normalized items, staged changes, live surface, and export packets.
- Validate synthetic artifact records.
- Document the realtime loop and public/private model.
- Keep the surface architecture independent from any single memory backend.

## Success criteria

- Synthetic artifacts validate deterministically.
- The architecture separates live surface state from memory-enrichment output.
- Beacon Table prototype concepts are distilled into public product primitives rather than copied as legacy files.
- Public docs explain the product without private operational context.
