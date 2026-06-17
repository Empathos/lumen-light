# Lumen Light Architecture

## Runtime loop

```text
input stream
  -> turn queue
  -> normalized item layer
  -> surface planner
  -> staged surface change
  -> user or policy approval
  -> live surface state
  -> artifact emission
```

## Modules

- `browser highlighter`: lets a reader select text in static HTML and preserve reversible visual emphasis.
- `turn queue`: buffers speech or text turns into meaningful chunks.
- `normalized item layer`: converts turns, highlights, and notes into stable highlights, cards, decisions, questions, actions, and diagram items.
- `text light`: assigns optional state metadata to transcript spans without changing the underlying text.
- `surface planner`: proposes cards, diagrams, and whiteboard changes from normalized items.
- `staging layer`: keeps proposed changes inspectable before they become live state.
- `artifact emitter`: writes structured records for memory enrichment.

See `docs/CONVERSATION-SURFACE-MODEL.md` for the consolidated conversation-surface model.

## Static HTML highlighter

The public browser runtime lives at `src/lumen-light.js`.

It is intentionally small:

- no dependencies
- manual gold highlights from selected text
- purple partner highlights through `window.lumen.highlight(text)`
- local persistence with `localStorage`
- export through `window.lumen.export()`
- page-local clear through `window.lumen.clear()`

The highlighter stores exact selected text plus a short prefix and suffix. On reload, it uses that context to re-anchor highlights into the current DOM. If the source document changes too much, a highlight may be skipped rather than forced into the wrong place.

## Memory integration boundary

Lumen Light sends structured artifacts outward. It does not need to own durable recall, provenance, or long-term insight. OpenReflect or other memory systems can enrich artifacts and return context, suggestions, or related prior material.

The live surface is not the source of truth. It is a projection of turn evidence
and normalized items. Durable systems should consume accepted artifacts and
their source turn references rather than a raw canvas dump.

## Public artifact contract

Each artifact should include:

- stable artifact ID
- source turn IDs
- artifact kind
- human-readable text
- optional surface object metadata
- memory-enrichment hints
- provenance and confidence fields
