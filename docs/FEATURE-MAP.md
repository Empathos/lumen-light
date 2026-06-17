# Lumen Light Feature Map

This feature map is the master planning surface for Lumen Light. It connects
the public product model to implementation phases without binding the repo to
private deployments, transcripts, credentials, or provider-specific runtime
configuration.

## Product Spine

```text
source material
  -> event stream
  -> turn queue
  -> normalized items
  -> staged surface changes
  -> accepted live surface
  -> artifact export packet
  -> external memory enrichment
```

The core rule is that the visible surface is a projection. Durable systems
consume accepted artifacts with evidence references, not raw canvas state.

## Feature Areas

### 1. Source Material Ingestion

Purpose: accept evidence from multiple user-facing surfaces.

Features:

- voice transcript chunks
- typed turns
- document highlights
- manual card edits
- agent suggestions
- imported source notes
- source metadata for documents, panes, sessions, and surfaces

Public contract:

- source material becomes structured events before it affects the surface
- private transcripts and deployment identifiers stay outside the public repo

### 2. Event Stream

Purpose: normalize UI and integration activity before downstream processing.

Features:

- event IDs
- event type
- timestamp
- source kind
- source surface or pane identity
- raw text or selected span
- parent session reference

Public contract:

- events are transient evidence
- accepted artifacts are durable output

### 3. Turn Queue

Purpose: group noisy input into stable conversation evidence.

Features:

- `turn_id`
- speaker label
- text
- timestamp
- source kind: voice, typed, highlight, manual edit, agent
- optional source event references
- filler/noise filtering before item extraction

Current fixture:

- `examples/turn-queue.example.json`

### 4. Text Light and Highlighting

Purpose: preserve meaningful attention over source text while keeping plain
text recoverable.

Features:

- manual browser highlights
- partner/API-created highlights
- source span anchoring with selector, exact text, prefix, and suffix
- highlight import/export
- re-anchoring after reload
- repeated-text disambiguation
- stale-highlight handling
- read-only review mode

Nested-window rule:

- each pane owns its local DOM selection and visual highlight rendering
- the parent Lumen surface owns the artifact model
- pane-local highlights emit normalized highlight artifacts upward
- durable highlight records include surface, pane, document, and source-span identity

Same-origin iframe behavior:

- child frame can run a highlighter runtime and send highlight events to the
  parent surface with `postMessage`

Cross-origin iframe behavior:

- direct DOM highlighting is not assumed
- highlights require provider anchors, imported source text, or a Lumen-owned
  rendering proxy

Internal pane behavior:

- preferred path for product work
- render documents inside Lumen-owned panes and register each pane with the
  parent surface

### 5. Normalized Item Layer

Purpose: convert turns and highlights into stable meaning units independent of
any canvas engine.

Item kinds:

- highlight
- card
- decision
- question
- action
- diagram node
- diagram edge

Features:

- item IDs
- item kind
- text
- source turn IDs
- optional source span
- confidence
- memory-enrichment hints

Current schema:

- `schemas/conversation-artifact.schema.json`

### 6. Staging Layer

Purpose: prevent transient model output from becoming live or durable without
review.

States:

- staged
- live
- rejected
- archived

Features:

- proposed artifacts
- proposed surface operations
- user or policy approval
- rejection without evidence loss
- accepted artifacts promoted to live surface

### 7. Live Surface

Purpose: provide an inspectable thinking surface during a session.

Surface objects:

- highlighted transcript spans
- cards
- diagram nodes
- diagram edges
- groups
- viewport focus
- accepted annotations

Operations:

- insert
- update
- delete
- connect
- focus viewport
- replace projection

Product rule:

- surface state may be rearranged or reset
- normalized items and evidence references remain durable

### 8. Shared Briefing and Review Page

Purpose: make the first product loop useful without waiting for full realtime
whiteboarding.

Features:

- static document or transcript review
- local highlights
- artifact export
- artifact import
- read-only review mode
- accepted decisions/questions/actions summary
- public-safe briefing packet examples

### 9. Realtime Conversation Surface

Purpose: connect live conversation to visible structure.

Features:

- realtime voice or text input adapter
- turn queue updates
- fast visual projection loop
- slower synthesis/advisory loop
- staged model-proposed cards and diagrams
- deterministic layout warnings
- viewport focus suggestions

Provider boundary:

- OpenAI Realtime, Gemini Realtime, or other provider integrations should be
  adapters, not core product assumptions

### 10. Shared Canvas and Whiteboard

Purpose: move from text review to spatial collaboration.

Features:

- cards
- arrows
- groups
- lightweight diagrams
- freehand marks
- generated visual object slots
- canvas import/export
- layout guard checks

Guard checks:

- node overlap
- label overflow
- disconnected islands
- duplicate cards
- unreadable zoom density
- excessive transcript-like cards

### 11. Artifact Export Packet

Purpose: provide durable output for external memory and review systems.

Features:

- accepted artifacts
- source turn IDs
- source spans
- surface projection metadata
- confidence
- memory-enrichment hints
- unresolved questions
- actions
- accepted synthesis notes

Product rule:

- memory systems consume export packets, not screenshots or raw canvas dumps

### 12. Integrations and Control Surfaces

Purpose: allow downstream products to use Lumen Light without making the public
repo operationally specific.

Features:

- generic memory backend examples
- plugin boundaries
- MCP boundaries
- NotebookLM-style briefing packets
- provider adapter boundaries
- private downstream control-plane support

Public/private rule:

- public upstream holds reusable framework code, schemas, docs, and synthetic
  examples
- private downstream repositories hold live IDs, credentials, logs,
  transcripts, and deployment configuration

## Roadmap

### Phase 0: Public Product Contract

Status: current.

Scope:

- product thesis
- static highlighter
- conversation surface model
- artifact schema
- fixture validation
- public/private operating model

Exit criteria:

- all public fixtures validate
- public audit passes
- docs explain turns, normalized items, staging, live surface, and export packet

### Phase 1: Shared Highlighting and Briefing Page

Goal: make Lumen useful as a review surface before full realtime canvas work.

Build:

- highlight import
- artifact export from browser highlights
- repeated-text re-anchoring
- stale-highlight reporting
- read-only review mode
- shared briefing page example
- fixture-backed highlight tests

Exit criteria:

- a user can load a document, highlight text, export artifacts, reload/import,
  and review accepted items

### Phase 2: Pane and Nested-Window Highlighting

Goal: support documents and sub-surfaces inside a larger Lumen session.

Build:

- pane registration
- pane-local highlighter instances
- parent-surface artifact registry
- `surface_id`, `pane_id`, and `document_id` source-span fields
- same-origin iframe event bridge
- cross-origin boundary documentation

Exit criteria:

- a highlight created inside a nested pane appears visually in that pane and
  exports as a parent-level artifact with pane/document identity

### Phase 3: Normalized Items and Staging

Goal: make conversation-derived cards, decisions, questions, and actions real.

Build:

- item extraction fixture
- staged item examples
- staged/live/rejected/archived workflow
- approval semantics
- artifact packet example

Exit criteria:

- staged items can be accepted or rejected without losing evidence references

### Phase 4: Live Conversation Surface

Goal: connect live input to visible structure.

Build:

- turn queue ingestion adapter
- fast projection loop interface
- slow synthesis/advisory interface
- model-proposed staged cards
- deterministic layout warnings
- viewport focus operation

Exit criteria:

- synthetic live turns can produce staged surface changes and accepted artifacts
  without provider-specific code in the core contract

### Phase 5: Shared Canvas and Whiteboard

Goal: add spatial collaboration over normalized items.

Build:

- card canvas
- diagram nodes and edges
- groups
- freehand marks
- layout guard
- canvas state import/export
- projection reset/rebuild

Exit criteria:

- canvas objects are visibly useful while remaining projections of normalized
  items

### Phase 6: Generated and Rich Visual Objects

Goal: support richer visual artifacts without losing inspectability.

Build:

- generated-object slots
- provider-neutral media metadata
- accept/revise/pin/discard workflow
- prompt/private-metadata separation

Exit criteria:

- generated objects can be reviewed and exported without exposing private
  prompts or credentials

### Phase 7: Integration Surfaces

Goal: make Lumen usable by downstream memory and product systems.

Build:

- generic memory backend examples
- plugin/MCP boundaries
- NotebookLM-style briefing packet examples
- public-safe adapter examples
- private downstream configuration guidance

Exit criteria:

- downstream systems can consume Lumen artifacts without depending on private
  operational details
