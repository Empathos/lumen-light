# Lumen Light Implementation Build Plan

Prepared: 2026-06-23

Purpose: turn the current product framing into codeable, testable steps. This
is not a philosophy document. It is the build plan for getting Lumen Light into
a local testable state.

For the overnight implementation spec with concrete data shapes, UI behavior,
acceptance criteria, and out-of-scope boundaries, use
`docs/OVERNIGHT-BRIEFING-REVIEW-BUILD-SPEC-2026-06-23.md`.

## Build Target

Build a local agent-led briefing surface where one user can load source
material, see an agent briefing about that material, watch the referenced
source spans highlight, review proposed whiteboard/review artifacts, and export
the accepted results.

The user-facing experience is:

```text
source document/transcript
  + agent chat/briefing
  + synchronized highlights
  + staged review cards
  + optional Excalidraw projection
  -> accepted export packet
```

Provenance is an enabling trust layer. It should be implemented in the data
model, but it is not the headline user experience.

## Current Starting Point

Useful code already exists:

- `src/static-highlighter/lumen-light.js` highlights static HTML source text.
- `examples/static-highlight-demo.html` demonstrates local highlighting.
- `schemas/conversation-artifact.schema.json` validates single artifacts.
- `scripts/validate_artifact.py` validates public JSON fixtures.
- `prototypes/lumen-light-whiteboard-prototype/` has an Excalidraw-based
  transcript-to-whiteboard prototype with tests.

Main gap:

- there is no single local app that combines source pane, agent briefing pane,
  synchronized highlight activation, staged artifacts, accept/reject/edit, and
  export.

## Sprint 1: Local Briefing Review Page

Goal: create the smallest testable product loop without voice.

Build:

1. Add a Lumen-owned review page under `examples/briefing-review-demo.html` or
   a small `src/briefing-review/` module.
2. Render one synthetic source document/transcript.
3. Render an agent briefing pane with scripted turns.
4. Each scripted agent turn includes:
   - text the agent says
   - one source-span reference
   - one proposed artifact
5. Clicking or playing a briefing turn activates the matching highlight in the
   source pane.
6. Proposed artifacts appear in a staging/review area.
7. User can accept, reject, or edit each proposed artifact.
8. Accepted artifacts export as JSON.

Acceptance tests:

- opening the demo shows source, briefing, and staging panes
- activating a briefing turn highlights the expected source span
- accepting an artifact changes its state to accepted
- rejecting an artifact changes its state to rejected
- exported JSON includes only accepted artifacts unless a debug option includes
  rejected artifacts
- existing artifact validation still passes

Files likely touched:

- `examples/briefing-review-demo.html`
- `src/static-highlighter/lumen-light.js`
- new `src/briefing-review/*.js`
- new `examples/briefing-session.example.json`
- `test/` for schema/export validation

## Sprint 2: Artifact Contract That Supports The Demo

Goal: make the data contract match the product loop.

Build:

1. Add artifact kinds used by the product:
   - `claim`
   - `decision`
   - `question`
   - `risk`
   - `action`
   - `insight`
   - `highlight`
2. Add approval state:
   - `staged`
   - `accepted`
   - `rejected`
   - `edited`
3. Add origin/provenance fields that distinguish:
   - source text
   - agent interpretation
   - human approval/edit
4. Allow document-first artifacts that have `source_span` but no
   `source_turn_ids`.
5. Add packet-level export schema.

Acceptance tests:

- each artifact kind has a valid fixture
- staged, accepted, rejected, and edited examples validate
- document-first artifact validates with `source_span`
- packet fixture validates
- invalid packets fail deterministically

Files likely touched:

- `schemas/conversation-artifact.schema.json`
- new `schemas/export-packet.schema.json`
- `examples/*.example.json`
- `scripts/validate_artifact.py`
- `test/test_validate_artifact.py`

## Sprint 3: Agent-Briefing Adapter

Goal: replace scripted briefing turns with an agent adapter while keeping the
same UI contract.

Build:

1. Define a local `briefing_turn` shape:
   - `turn_id`
   - `speaker`
   - `text`
   - `source_span_refs`
   - `proposed_artifact_ids`
2. Add a deterministic fixture-backed adapter first.
3. Add a model-backed adapter second.
4. Ensure model output can only create staged artifacts.
5. Keep human approval as the only path to accepted artifacts.

Acceptance tests:

- fixture adapter produces repeatable briefing turns
- model adapter output is parsed into the same shape
- malformed model output is rejected
- model-created artifacts are always staged

Files likely touched:

- new `src/briefing-review/briefing-turns.js`
- new `src/briefing-review/agent-adapter.js`
- new fixtures under `examples/`
- tests for adapter parsing and failure cases

## Sprint 4: Excalidraw Projection

Goal: keep Excalidraw as a projection surface, not the durable source of truth.

Build:

1. Map accepted or staged artifacts to Excalidraw elements.
2. Add a button or mode that projects current artifacts onto the existing
   Excalidraw prototype.
3. Keep artifact JSON as the durable state.
4. Treat Excalidraw element JSON as view/projection state only.

Acceptance tests:

- artifact card maps to deterministic Excalidraw element
- rejected artifacts are not projected by default
- changing projection does not mutate accepted artifact content

Files likely touched:

- `prototypes/lumen-light-whiteboard-prototype/src/whiteboard-elements.js`
- new bridge module between `src/briefing-review/` and prototype code
- prototype tests

## Sprint 5: OpenAI Realtime Voice Briefer

Goal: add voice after the text briefing loop is testable.

Build:

1. Add trusted endpoint to mint ephemeral Realtime session credentials.
2. Add browser WebRTC client for `gpt-realtime-2`.
3. Define Realtime tools:
   - `highlight_source_span`
   - `create_staged_artifact`
   - `focus_artifact`
   - `request_human_review`
4. Tool calls write staged artifacts or active highlights only.
5. Spoken turns are captured as briefing turns.
6. Barge-in/interruption keeps UI state consistent.

Acceptance tests:

- browser never receives a long-lived API key
- Realtime tool call creates staged artifact, not accepted artifact
- interruption does not auto-accept anything
- text fallback still works when voice is unavailable

Files likely touched:

- prototype server or new app server endpoint
- browser WebRTC client module
- briefing-turn adapter
- tests/mocks for tool calls

## Immediate First PR

The first PR should not touch voice or Excalidraw.

Implement:

1. `examples/briefing-session.example.json`
2. `examples/briefing-review-demo.html`
3. a tiny review UI that:
   - renders source text
   - renders scripted agent turns
   - highlights the referenced source span
   - shows staged artifacts
   - accepts/rejects artifacts
   - exports accepted JSON
4. tests for artifact state transitions and export shape

Definition of done:

- a local browser demo proves the core product interaction
- the demo can be shown without explaining architecture first
- the user can test the loop in under five minutes

## Opus Review Guardrail

Any future Opus review should answer implementation questions only:

- What code should change first?
- What is the first PR?
- What test proves it works?
- What should be explicitly deferred?
- What existing file contradicts the next build step?

Do not ask Opus to re-evaluate the moat, the philosophy, or whether
provenance matters. Treat source linkage as an implementation requirement and
keep the review focused on building a testable product.
