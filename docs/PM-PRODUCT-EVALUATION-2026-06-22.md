# Lumen Light Product Evaluation

Prepared: 2026-06-22

Source: Claude Code on `burrow`, model `opus`, high effort, acting as senior
product manager. Read-only pass over the repo using
`docs/OPUS-PRD-SECOND-PASS-BRIEF-2026-06-22.md` as the primary framing.

## 1. Executive PM POV

The second-pass brief is a genuine improvement in ambition but a regression in
focus. It correctly names something the first pass under-weighted: the surfaces
of voice, highlight, whiteboard, and chat are communication modalities, not
chrome. But it over-corrects into a vision of an agent-led briefing room with
realtime spoken narration, multimodal coordination, and future AV that the
repository cannot yet support and that would take quarters, not weeks, to make
real.

Two facts from the code should anchor every decision:

1. The durable contract is real and small. The schema and static highlighter
   are shipped, dependency-free, and tested. This is the only part of the repo
   that is owned.
2. The briefer does not exist yet. The whiteboard prototype is borrowed
   AutoPreso code. Its voice path is speech-to-text input only: the human speaks
   and a silent agent draws Excalidraw shapes. There is no agent voice output,
   no text-to-speech, no spoken narration, and no pointing at evidence while
   talking. The brief's centerpiece experience is unbuilt.

Product POV: adopt the second-pass brief's framing of a multimodal briefing
surface and agent-as-briefer as the north-star narrative, but reject its
sequencing. The first pass's "artifact contract is the moat, canvas is the demo"
is the engineering spine. The second pass's "grounded multimodal briefing" is
the user-facing promise. The synthesis is to build the grounded briefing loop
first: source, agent explanation, synchronized highlight, staged artifact, and
export. Voice should be the first modality added on top of that loop, not the
foundation underneath it.

The single biggest risk is that the team reads "Realtime API is core, not bolted
on later" as permission to start with WebRTC voice plumbing. That would put the
hardest, least-owned, most provider-specific component first, on top of borrowed
canvas code, before the artifact loop is load-bearing.

## 2. What The Finished Product Should Feel Like

Finished Lumen Light feels like sitting with a sharp analyst who has already
read the document and walks you through it: pointing at the exact lines as they
talk, sketching the structure as it emerges, and never asking you to trust a
claim you cannot trace back to the page.

The finished-state feel has four qualities:

- Grounded, not generative. Every time the agent says "this section is really
  about the risk of X," the corresponding source span lights up. The user never
  wonders where that came from because interpretation and evidence are visually
  bound.
- Three visible layers, always distinguishable: what the source literally says,
  what the agent is inferring, and what the human has accepted as durable. This
  tri-state is the product's signature and trust mechanism.
- Reversible and auditable. The canvas can be wiped, highlights re-anchored,
  and the session re-run, while the evidence trail survives because it lives in
  the artifact model, not the pixels.
- You leave with something defensible. Not a screenshot, not a transcript: an
  export packet where each decision, question, or risk links to the words that
  produced it.

The voice layer should eventually make this feel alive rather than studied, but
the felt quality above is achievable without voice. That is why voice should
not gate the MVP.

## 3. Primary User And Monday-Morning Job

The second brief lists many possible personas: facilitator, researcher,
strategist, founder, coach, product lead, analyst, and reviewer. That is an
audience, not a target. Commit to one v0 user.

Primary v0 user: the sense-maker working through a dense document or transcript
alone or for a small group. This could be a strategist, analyst, researcher, or
product lead who has already captured material and needs to extract defensible
meaning from it.

Monday-morning job:

> I have this 40-page strategy doc, research transcript, or meeting record. I
> need to understand what actually matters in it, and walk away with a sourced
> summary of the decisions, questions, risks, and actions that I can defend to
> my team without re-reading the whole thing or trusting an unsourced AI
> summary.

Instead of reading alone, pasting into a detached chatbot, trusting an unsourced
summary, or keeping a raw transcript nobody will reopen.

This user should win over the live-meeting facilitator for v0 because the
live-meeting job requires realtime voice and transcription to be excellent. That
is the riskiest, least-owned capability. The pre-existing document/transcript
job is completable today with the highlighter, artifact schema, and a briefing
review page, while still showcasing the grounded-briefing thesis.

## 4. MVP Promise And Non-Goals

MVP promise:

> Open a document or transcript, have an AI agent brief you through it with
> every claim grounded in a visible source highlight, review and accept the
> decisions, questions, risks, and actions it surfaces, and export a sourced
> packet whose evidence trail is intact.

MVP includes:

- Source pane rendered in a Lumen-owned internal DOM, not a cross-origin iframe.
- Agent briefing in chat/text first, where each agent statement can reference
  and activate a source span.
- Synchronized highlight: as the agent explains a point, the cited span lights
  up.
- Artifact staging/review: agent proposes claim, decision, question, risk, and
  action items; human accepts, rejects, or edits; accepted items become durable.
- Export packet conforming to the artifact schema, with source-span and turn
  provenance.
- Import of a previously exported packet.

Non-goals for MVP:

- Realtime spoken agent narration or OpenAI Realtime voice. This is the first
  modality after MVP, not in it.
- The Excalidraw spatial whiteboard as a required surface. Keep it as a
  parallel prototype; do not put it on the MVP critical path. A briefing review
  surface can use DOM cards.
- Live meeting capture or multi-participant sessions. Single user,
  pre-existing material.
- Cross-origin iframe highlighting. Use Lumen-owned panes only.
- Memory-enrichment return path or OpenReflect inbound. Define the outbound
  packet; defer inbound enrichment.
- Generated visual objects, AV recap video, or image generation.
- Auto-accept or policy approval. For MVP, every artifact should be
  human-reviewed.

## 5. Feature Priority Stack

Ranked by contribution to the product thesis divided by cost and risk.

1. Artifact schema and validation: P0. The moat. Already shipped; extend it
   rather than rebuilding.
2. Lumen-owned source pane and highlighter: P0. The grounding substrate.
   Highlighter exists; pane identity and import need work.
3. Agent-statement to source-span binding: P0. This is the grounded-briefing
   thesis and the agent's pointing mechanism.
4. Staging/review UI: P0. This is where interpretation becomes durable. Schema
   supports it; UI is absent.
5. Export packet and import round-trip: P0. The Monday-morning payoff.
6. Tri-state visibility: P0. Source, inference, and accepted artifact must be
   visibly distinct.
7. Agent briefing in chat/text: P1. Needed to demo, but the binding matters
   more than the chat surface.
8. Realtime spoken agent briefing: P1. The brief's centerpiece, but unbuilt and
   high-risk. Make it the first post-MVP modality.
9. Turn-queue ingestion for live or voice input: P2. Prototype has concepts to
   reuse later.
10. Excalidraw spatial whiteboard, componentized: P2. Demo, not moat.
11. Pane/nested-window highlighting: P2. Needed only when multi-doc sessions
   matter.
12. Memory enrichment return path, MCP/plugin, and AV: P3. Future-generation.

The feature map should promote span-binding and tri-state visibility from
implicit concepts to headline product differentiators.

## 6. Required Next Build Sequence

### Phase A: Make The Loop Owned And Complete

Goal: a single user can load a doc, get a grounded briefing, review and accept
artifacts, export, and re-import, all in Lumen-owned code with no provider
voice.

1. Promote the highlighter into a source pane component with `surface_id`,
   `pane_id`, and `document_id` identity.
2. Build the artifact mapping layer: highlight records plus agent proposals to
   conversation-artifact schema objects.
3. Build the review/staging page: list staged artifacts, accept/reject/edit,
   show evidence span on hover or click, and support read-only review mode.
4. Wire export packet and import: accepted artifacts plus provenance;
   re-anchor highlights and restore artifacts.
5. Add fixture-backed tests for the highlight-to-artifact-to-export round-trip.
   Extend the existing validator to cover packet-level shape.

### Phase B: Add The Agent As A Grounded Text Briefer

1. Introduce an agent that produces briefing turns carrying source-span
   references and proposed artifacts.
2. Use the span reference to drive highlight activation so explanation and
   evidence are visually bound.
3. Implement tri-state UI: source text, agent inference, and accepted artifact
   should be distinct.
4. Keep the agent provider behind an adapter boundary.

### Phase C: Add Voice As The First New Modality

1. Add OpenAI Realtime API spoken briefing on top of the working text loop.
2. The agent speaks its briefing turns while the highlight and staged artifact
   update as it talks.
3. Build low-latency interruption and correction.
4. Capture spoken turns into transcript/turn-queue for provenance.
5. Keep Realtime strictly behind an adapter; the user-facing PRD should say
   low-latency voice, not name a provider.

### Phase D: Spatial Canvas And Live Capture

1. Componentize the Excalidraw loop into a renderer over normalized items.
2. Treat live meeting capture and multi-participant sessions as later work.

The discipline is Phase A before Phase B before Phase C. Voice is compelling
and risky; it should sit on a loop that already works in text.

## 7. Key Product Risks And Mitigations

- Voice-first inversion. The brief says Realtime is core, not bolted on later,
  which could make the team start with WebRTC voice on borrowed canvas code.
  Mitigation: sequence voice as Phase C. The text loop must demo the full thesis
  alone.
- The briefer does not exist. The repo voice path is speech-to-text input only;
  the agent never speaks. Mitigation: name the gap explicitly and scope agent
  voice output as net-new.
- Scope gravity from many personas, feature areas, and phases. Mitigation:
  commit to one v0 user and the P0 feature set.
- Canvas overweight. Most code lives in the prototype, but it is borrowed and
  not the moat. Mitigation: keep Excalidraw on a parallel track and make the MVP
  review surface DOM cards.
- Highlight re-anchoring fragility. Current re-anchor depends on exact text and
  context; provenance depends on it. Mitigation: harden re-anchoring and stale
  highlight reporting in Phase A.
- Provider leakage into product promise. Mitigation: adapter boundary in code;
  user-facing PRD says low-latency voice.
- Undefined approval policy and auto-accept. Mitigation: for MVP, all artifacts
  are human-reviewed.
- Interpretation/source confusion. Mitigation: tri-state visibility is a hard
  requirement from Phase A.

## 8. User-Facing PRD Rewrite Guidance

The current PRD reads as an architecture manifesto. It should be rewritten
around the user, not the pipeline.

Recommended structure:

1. One-liner and magic moment.
2. Problem and one target user.
3. Product principles: grounding, tri-state visibility, reversibility, and
   provenance.
4. The v0 grounded-briefing loop as a user-completable task.
5. Artifact and export-packet model in user terms: every decision links to its
   source.
6. Trust, privacy, and data posture.
7. Roadmap by user capability: text briefing to spoken briefing to spatial
   canvas to live capture.
8. User-facing success metrics.
9. Non-goals.
10. Appendix: contract and architecture.

Suggested opening:

> Lumen Light is a grounded briefing surface. You bring a document, transcript,
> or set of notes; an AI agent walks you through what matters in it, and every
> claim it makes is anchored to the exact passage that supports it, lit up in
> the source as the agent explains. You see three things clearly and separately:
> what the source literally says, what the agent is inferring, and what you have
> accepted as durable. Nothing the agent proposes becomes a lasting record until
> you review it. When you are done, Lumen Light does not hand you a screenshot or
> a raw transcript. It gives you an export packet: the decisions, questions,
> risks, and actions you accepted, each linked back to the source words that
> produced it, ready to defend or to feed into your own systems.

Keep out of the user-facing PRD: model IDs, provider runtime details, prototype
internals, named dependencies on OpenReflect, and engineering acceptance
criteria.

User-facing success metrics to add:

- Percentage of accepted artifacts with a valid, resolvable evidence reference,
  target 100%.
- Highlight re-anchor success rate on reload, target greater than 95% on
  unedited documents.
- Time from session end to usable sourced summary, target less than 30 seconds.
- Acceptance rate of agent-proposed artifacts.
- Percentage of exported summaries usable without major rewrite, judged by the
  user.

## 9. Concrete Acceptance Criteria For The Next Build Pass

The next pass is done when a single user, in Lumen-owned code with no voice and
no Excalidraw, can:

1. Load a static document or transcript into a Lumen-owned source pane that
   registers `surface_id`, `pane_id`, and `document_id`.
2. See agent-proposed or API-created highlights appear on the correct spans,
   including at least one repeated-text case disambiguated correctly.
3. Reload/import and have at least 95% of highlights re-anchor, with skipped
   highlights reported rather than silently dropped.
4. See staged artifacts for at least claim, decision, question, and action;
   risk and insight should be added if included in the schema.
5. Accept, reject, or edit each staged artifact. Rejected items lose live
   projection but retain evidence references.
6. Export a packet that validates and includes, per accepted artifact:
   `source_turn_ids`, `source_span`, `confidence`, and `kind`.
7. Re-import that packet and reconstruct the review state.
8. Pass a fixture-backed round-trip test: highlight to artifact to export to
   re-import.
9. Visually distinguish source text, agent inference, and accepted artifact.
10. Keep provider-specific code out of the core artifact/loop path.

Schema gaps to close:

- Add `risk` and `insight` to the `kind` enum.
- Add a packet-level wrapper schema; the current schema validates a single
  artifact, not an export packet.

## 10. Specific Repo, Docs, And Code Areas To Modify Next

Docs:

- `docs/PRD.md`: full user-facing rewrite. Move architecture to appendix.
- `docs/FEATURE-MAP.md`: promote span-binding and tri-state visibility to
  headline differentiators; mark realtime voice as Phase C rather than a
  co-equal MVP pillar; add explicit not-now boundaries.
- `ROADMAP.md`: reorder by user-capability phases: text briefing, spoken
  briefing, canvas, live capture.
- `docs/ARCHITECTURE.md`: add the tri-state model and the
  agent-statement-to-span-reference contract; state explicitly that Excalidraw
  is a renderer over normalized items.
- Add a short `docs/BRIEFER-ROLE.md` or equivalent section defining the agent's
  briefer role and honestly noting the current speech-to-text-only gap versus
  spoken-output target.

Schema and fixtures:

- `schemas/conversation-artifact.schema.json`: add `risk` and `insight` to the
  `kind` enum; consider a provenance author field for source, agent-inference,
  and human; add an `interpretation_of` link from inference artifact to source
  span.
- Add `schemas/export-packet.schema.json`.
- Add `examples/export-packet.example.json`, plus fixtures for `risk` and
  `insight`.
- Extend `scripts/validate_artifact.py` and its tests to validate packets and
  round-trips.

Code:

- `src/static-highlighter/lumen-light.js`: extend it to emit normalized
  highlight artifacts, accept pane identity, and harden repeated-text
  disambiguation and stale-highlight reporting.
- Add Lumen-owned modules for source pane registration, artifact registry,
  review surface, and export packet assembly/import.
- Keep `prototypes/lumen-light-whiteboard-prototype/` on a parallel track.
  Reuse its transcript turn queue, agent provider adapter, and staging concepts
  later, but do not put it on the MVP critical path. When voice lands, the work
  is agent audio output, which this prototype does not currently implement.

## Bottom Line

Keep the second brief's narrative: a grounded, multimodal briefing surface where
an agent briefs a human through source material. But build it from the moat
outward: own the source-to-highlight-to-artifact-to-export loop in text first,
prove the grounding and tri-state trust UX, then add the agent's voice as the
first new modality, then add the spatial canvas and live capture.

Voice is the most compelling part of the vision and the least built part of the
repo. It earns its place on top of a working loop, not underneath an empty one.
