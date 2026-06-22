# Lumen Light Opus Implementation Build Memo

Reviewer: Claude Code Opus
Date: 2026-06-23
Mode: coding planner, not philosophy

## Verdict

The implementation build plan in
`docs/IMPLEMENTATION-BUILD-PLAN-2026-06-23.md` is directionally correct and
well-sequenced: text loop, schema, adapter, Excalidraw projection, then voice.

Three corrections matter:

1. Do not touch `src/static-highlighter/lumen-light.js` in the first PR. Reuse
   its anchoring strategy in a new scoped module, then unify later.
2. Sequence schema reconciliation after the first local demo. The current
   schema contradicts the demo shape, so validating too early would pull the
   team back into schema-first drift.
3. Decide the host runtime before voice. The first demo can be framework-free
   ESM; voice later needs a server for ephemeral Realtime session credentials.

The smallest first PR should make Lumen Light testable locally with zero new
runtime dependencies and no build step.

## Repo Reality Check

What exists and runs:

- `src/static-highlighter/lumen-light.js`: a working dependency-free
  highlighter with prefix/suffix re-anchoring, but it is a global
  `window.lumen` singleton tied to `document.body` and `localStorage`.
- `schemas/conversation-artifact.schema.json`,
  `scripts/validate_artifact.py`, and `test/test_validate_artifact.py`:
  deterministic validation of current fixtures.
- `prototypes/lumen-light-whiteboard-prototype/`: a separate Node 24
  Express/WebSocket app with Excalidraw, transcription, a text agent, and a
  substantial Node test suite.

What does not exist:

- a combined source-pane, briefing-pane, and staging UI
- a root JavaScript test harness
- packet-level export/import schema
- speech-to-speech voice or Realtime tool bindings

Current contradictions:

- `schemas/conversation-artifact.schema.json` requires `source_turn_ids`,
  which blocks document-first artifacts that only have `source_span`.
- The schema is missing `claim`, `risk`, and `insight`.
- Approval state exists only inside `surface.state`, which conflates projection
  state with artifact approval state.
- `src/static-highlighter/lumen-light.js` is not scoped enough for a
  per-session source pane.
- The Excalidraw prototype is a separate runtime and should not be the first
  product surface.

## First PR Recommendation

Build a local grounded briefing review demo: text only, no dependencies, no
build step.

The demo should:

- render one synthetic source document
- render scripted agent briefing turns
- activate the referenced source span when a turn is clicked
- show proposed artifacts in a staging pane
- allow accept, reject, and edit
- export accepted artifacts as JSON

The first PR export should use its own briefing-packet shape. It should not be
forced through the current artifact schema yet.

## First PR File-Level Change List

Add:

- `package.json`: root zero-dependency Node test harness with
  `node --test test/briefing-review`
- `src/briefing-review/state.js`: pure artifact state machine with
  `stage`, `accept`, `reject`, `edit`, and `exportAccepted`
- `src/briefing-review/source-pane.js`: scoped source-span anchoring and
  activation
- `examples/briefing-session.example.json`: synthetic source text, scripted
  briefing turns, and proposed artifacts
- `examples/briefing-review-demo.html`: browser demo with source, briefing,
  and staging panes
- `test/briefing-review/state.test.js`
- `test/briefing-review/anchor.test.js`

Modify:

- `README.md`: add a "Run the briefing demo" section

Do not modify:

- `src/static-highlighter/lumen-light.js` in the first PR

## First PR Test Plan

Use root `node --test` for pure logic tests:

- staged to accepted sets state correctly
- staged to rejected sets state correctly
- edit records edited text and state
- illegal transitions are rejected
- `exportAccepted` returns accepted artifacts by default
- debug export can include rejected artifacts
- span resolver returns correct offsets for exact match
- repeated text is disambiguated with prefix/suffix
- missing span reports a skip instead of mis-highlighting
- every scripted briefing turn references an existing source span/artifact

Keep the existing Python validation tests green:

```bash
python3 -m unittest discover -s test
```

Keep the prototype test suite green when the prototype is touched:

```bash
cd prototypes/lumen-light-whiteboard-prototype
node --test
```

## Reuse Guidance

Reuse from `src/static-highlighter/`:

- the prefix/suffix anchoring strategy
- skip-rather-than-force behavior when a span cannot be re-anchored

Do not reuse from `src/static-highlighter/` in the first PR:

- the IIFE wrapper
- `window.lumen`
- `localStorage` persistence
- document-wide singleton behavior

Reuse from the Excalidraw prototype later:

- skeleton element shape
- artifact-to-visual mapping concepts
- agent/provider and settings concepts after the text loop is stable

Keep out of the first product slice:

- the whiteboard system prompt
- prompt-cache warmup loop
- line-numbered whiteboard edit tools
- React/Excalidraw runtime

## Agent Adapter Placement

Add the future agent adapter at:

```text
src/briefing-review/agent-adapter.js
```

Use a stable `briefing_turn` interface:

- `turn_id`
- `speaker`
- `text`
- `source_span_refs`
- `proposed_artifact_ids`

Start with a deterministic fixture-backed adapter. Add the model-backed
adapter later. Model output may only create staged artifacts; human approval is
the only path to accepted artifacts.

## OpenAI Realtime Sequencing

Realtime voice feasibility is settled by the research doc. It should follow
the local text loop.

Order:

1. Build the briefing-review loop as portable ESM.
2. Mount it under a server after the local demo works.
3. Add a trusted endpoint to mint ephemeral `gpt-realtime-2` session
   credentials.
4. Add a browser WebRTC client.
5. Bind Lumen tools:
   - `highlight_source_span`
   - `focus_artifact`
   - `create_staged_artifact`
   - `request_human_review`
6. Tool calls write staged artifacts or active highlights only.
7. Spoken turns are captured as briefing turns.

Voice is deferred until after the first ten commits.

## Not Now

- speech-to-speech voice and Realtime tool bindings
- Excalidraw projection
- React/CDN whiteboard runtime as the MVP surface
- cross-origin iframe highlighting
- multi-user collaboration
- memory return path
- generated AV
- refactoring `lumen-light.js` before the scoped source-pane module proves the
  interaction

## Risks That Could Block A Local Test

- Schema collision if the first demo export is forced through the current
  artifact schema too early.
- Browser `file://` module issues. Mitigation: document
  `python3 -m http.server` as the demo run path.
- No root JavaScript test harness today. Mitigation: first commit adds one.
- Anchoring failure for scripted spans. Mitigation: tests must assert
  skip-with-report instead of wrong-place highlighting.

## Next 10 Commits

1. `chore(root): add zero-dep node test harness`
   Add root `package.json`, `type: module`, and a Node test command for
   `test/briefing-review`.

2. `feat(source-pane): add scoped anchor module`
   Add `src/briefing-review/source-pane.js` with scoped prefix/suffix
   anchoring, `data-span-id`, and activation. Add anchor tests.

3. `feat(briefing-review): add artifact state machine`
   Add `src/briefing-review/state.js` with stage, accept, reject, edit, and
   export behavior. Add state tests.

4. `feat(fixtures): add synthetic briefing session`
   Add `examples/briefing-session.example.json` with source text, scripted
   briefing turns, and proposed artifacts across required kinds.

5. `feat(demo): add briefing review page`
   Add `examples/briefing-review-demo.html` with source, briefing, and staging
   panes.

6. `feat(demo): add controls and run docs`
   Add accept/reject/edit/export controls and README instructions. This is the
   end of the first PR/MVP slice.

7. `feat(schema): reconcile artifact contract`
   Add missing artifact kinds, approval state, and document-first source-span
   support. Update validator and fixtures.

8. `feat(schema): add export packet schema`
   Add `schemas/export-packet.schema.json`, packet fixture, and validator path.

9. `refactor(highlighter): share anchoring core`
   Extract common anchoring into a shared module and point both the static
   highlighter and briefing demo at it.

10. `feat(adapter): add briefing-turn adapter seam`
    Add fixture-backed adapter behind the stable `briefing_turn` interface and
    tests that malformed output is rejected.

After commit 10: mount the briefing review surface under the prototype server,
then do the `gpt-realtime-2` voice spike, then add Excalidraw projection.
