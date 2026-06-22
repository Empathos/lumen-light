# Lumen Light — Product & Repo Review

**Reviewer role:** Senior PM / technical product reviewer
**Date:** 2026-06-23
**Scope:** Full repo — PRD, supporting docs, schema, fixtures, owned code (`src/`), and the whiteboard prototype. Read-only.

---

## 1. Verdict

**The product POV is now genuinely good. The PRD is ~80% of a strong user-facing document but still carries architecture-manifesto weight it should shed. The repo, however, does not yet implement the thesis in *either* codebase — and the schema, which is your most-owned asset, does not encode the one idea the PRD calls the "core trust experience."**

Three things are true at once and the team should hold all three:

1. **The narrative is right.** "Grounded briefing surface, tri-state visibility, evidence-linked export packet" is a defensible, differentiated POV. Keep it.
2. **The voice correction is right.** The OpenAI Realtime research is accurate and the sequencing (text loop → voice on top) is correct.
3. **The build reality is harsher than any single doc admits.** Between the two codebases you own, *neither* implements the grounded-briefing loop. The static highlighter highlights text but has no agent, no provenance, and no schema linkage. The prototype drives Excalidraw from a transcript but has no source grounding, no staging gate, and no artifact — it is the exact "canvas JSON as source of truth" pattern the PRD forbids.

The gap is not feasibility. It is that the durable contract (`schemas/conversation-artifact.schema.json`) is the thing you most need to fix *before* anything else, and it is currently the thing least aligned with the PRD.

---

## 2. Strongest Product POV (what to protect)

Lumen Light's defensible wedge is **provenance-bound interpretation**: the agent is allowed to *interpret* ("this pricing discussion is really an enterprise-onboarding risk"), and the UI makes the interpretation traceable to the exact source span while keeping three layers visibly separate — **source / inference / accepted**. The durable output is an evidence-linked packet, not a transcript or a screenshot.

That is the moat. Everything else (whiteboard, voice, live capture) is a *modality* layered on top of it. The PRD's "Surface As Projection" and "Review Before Durability" principles correctly subordinate the flashy parts to the contract. Hold that line.

**The single most important consequence:** the moat lives in the artifact schema, not in the canvas or the voice session. Right now the schema does not express it (see §4). Fix the schema first.

---

## 3. PRD Critique

**What's strong:** Clear thesis, a real "magic moment," a tri-state principle, an honest "Current Repo Reality" section, and a correct voice framing with a concrete current-vs-target diagram. This is a large improvement over the "architecture manifesto" the PM eval criticized.

**Where it's still too broad / unfixed:**

- **Persona still unresolved.** §"Who Opens This On Monday" lists *eight* personas ("founder, researcher, strategist, product lead, coach, analyst, facilitator, or reviewer") and only gestures at "sense-maker." The PM eval explicitly told you to **commit to one v0 user** ("the sense-maker working through a dense doc/transcript alone"). The PRD softened the language but did not commit. Pick one. An audience is not a target.
- **It is still half an internal doc.** "MVP Scope," "Feature Map," "Build Sequence," "Current Repo Reality," and provider tool names (`highlight_source_span`, `gpt-realtime-2`) belong in an architecture appendix or a separate engineering doc. A user-facing PRD should not contain `surface_id`/`pane_id`/`document_id`. The PM eval's recommended structure (§8 of `PM-PRODUCT-EVALUATION`) was not adopted; I'd adopt it.
- **Tri-state is asserted but never specified.** The PRD says tri-state is "the core trust experience" but never says how a reader *sees* the three layers (color? column? badge?) or how the schema represents them. The most important UX claim has no design or data definition behind it.
- **The "load a document" path silently breaks the schema.** MVP requires "load a document or transcript," but the schema requires `source_turn_ids` (`minItems: 1`). A highlight created from a document has no conversational turn. As written, document-first artifacts cannot validate. This is a real contradiction, not a nitpick (see §4).
- **Provider names leak into the user-facing doc.** "OpenAI Realtime And Voice" names `gpt-realtime-2`, ephemeral credentials, and WebRTC. The PRD's own "Provider Adapters" principle says the contract should stay Lumen-owned and (per PM eval) user copy should say "low-latency voice." Move the provider specifics to the research doc / appendix.

**Verdict on the PRD:** Ship-able as an internal product brief today. One more pass — commit to one persona, move architecture to an appendix, define tri-state concretely — makes it a real user-facing PRD.

---

## 4. Repo Reality Check

| Claim in PRD/docs | Repo reality | Status |
|---|---|---|
| Dependency-free static highlighter | Real, ~300 lines, clean (`src/static-highlighter/lumen-light.js`) | ✅ Owned |
| Repeated-text disambiguation | `findRange` is a single `indexOf` with prefix/suffix context only; first match wins | ⚠️ Weak |
| `surface_id` / `pane_id` / `document_id` identity | Highlighter stores `page` (pathname) + `author` only; no surface/pane/document IDs | ❌ Absent |
| Stale-highlight *reporting* | `restoreAll` only `console.info`s a count; skips silently | ⚠️ Partial |
| Highlight → artifact contract | Highlighter export shape `{id, exact, prefix, suffix, timestamp, page, author}` **does not match** the artifact schema at all; no mapping layer | ❌ Disconnected |
| Tri-state (source / inference / accepted) | **No schema field** for provenance/author or approval state. `author` is only `primary`/`partner` | ❌ Absent in contract |
| Artifact kinds: claim, decision, question, risk, action, insight | Schema enum = `highlight, card, diagram_node, diagram_edge, decision, question, action`. **Missing claim, risk, insight**; has `card` the PRD doesn't list | ❌ Schema ≠ PRD |
| Export *packet* schema | Schema validates a **single artifact**; no packet wrapper | ❌ Absent |
| Staging / accept-reject / review loop | Prototype "staging" is a system-prompt primer, not an approval gate. No accept/reject anywhere | ❌ Absent |
| Whiteboard is a projection over normalized items | Prototype edits raw element JSON via line-numbered ops; `normalizeWhiteboardElements` is a no-op | ❌ Contradicts PRD |
| Agent-statement → source-span binding (the magic moment) | Exists in zero code, in either codebase | ❌ Unbuilt |

**Two-codebase honesty problem:** The owned code (`src/`) can highlight but has no agent, no provenance, no schema link. The prototype has an agent but no grounding, no staging, no artifact. The "agent points at evidence while briefing" loop — your entire thesis — is implemented **nowhere**. The PRD's "Current Repo Reality" section is honest about voice, but understates that the *grounded text loop itself* is also unbuilt in owned code.

**README is the wrong front door.** `README.md` still describes the *old* product — "a realtime thinking surface for conversations," OpenReflect memory enrichment, "conversation becomes a working surface while it is happening." It never mentions briefing, tri-state, source grounding, or voice. A visitor on Monday reads the README, not `docs/PRD.md`, and meets a different product. This is the most user-visible inconsistency in the repo.

**Doc sprawl.** Five overlapping planning docs (PRD, FEATURE-MAP, CONVERSATION-SURFACE-MODEL, ARCHITECTURE, ROADMAP) plus three review docs plus the research doc plus the packet. They disagree:
- `FEATURE-MAP` normalized-item kinds and `ARCHITECTURE` both omit claim/risk/insight (match the schema, not the PRD).
- `ROADMAP` is organized by *canvas/highlighting capability* (Phase 0–6); `FEATURE-MAP` has its own Phase 0–7; the PRD has Phase 1–4 by *user capability*. Three different phase numberings for one product.
- `CONVERSATION-SURFACE-MODEL` references "Beacon Table prototype" while `FEATURE-MAP`/research reference "AutoPreso." Pick one provenance story.

---

## 5. OpenAI Realtime / WebRTC Integration Assessment

**The research doc (`OPENAI-REALTIME-WEBRTC-RESEARCH-2026-06-23.md`) is the strongest doc in the repo.** It correctly:
- Separates *API capability* (`gpt-realtime-2`, WebRTC, ephemeral secrets, voice output, realtime tools, barge-in — all real) from *repo state* (transcription-only over WebSocket).
- Identifies the exact current loop (mic → app WS → `?intent=transcription` → transcript queue → `gpt-5.5` text agent → Excalidraw) vs. the target (mic/speaker over WebRTC → `gpt-realtime-2` voice session → Lumen tool calls).
- Proposes the right tool surface (`highlight_source_span`, `create_staged_artifact`, `request_human_approval`, etc.) and insists tool calls be reviewable, not silent writes.

**Where I'd push back / add precision:**

- **Voice is gated on the schema, not just "a stable loop."** The doc says build voice once the provenance loop is "stable enough to receive tool calls." Be sharper: `create_staged_artifact` and `highlight_source_span` *cannot exist* until the schema encodes provenance/approval/source-span (§4). So the voice spike's true dependency is the **schema fix + staging registry**, not a vague "stable loop." Make that an explicit blocker.
- **Don't let the (correct) feasibility argument invert the sequence.** The research doc's confidence is justified, but the risk the PM eval named is still live: a team that reads "voice is real and on the official path" may start the WebRTC spike on the borrowed Excalidraw prototype before the artifact contract exists. That would put the hardest, least-owned component on top of the least-owned code. Keep voice as the *first modality after* the owned text loop — Phase C, not Phase A.
- **Server endpoint is genuinely net-new.** There is no ephemeral-secret minting endpoint today; the prototype server forwards raw audio frames over its own WS. The browser currently holds no OpenAI key (good), but the WebRTC path needs a new trusted `/session` endpoint. Scope it as new work, not a refactor.
- **The prototype is reusable as concepts, not code, for voice.** Turn queue, agent-provider adapter, and settings store are reusable patterns. But agent *voice output* is 0% built, and the prototype's direct-canvas-mutation model is the wrong substrate. Don't "extend" the prototype into voice; build the tool layer against the new artifact contract.

**Bottom line:** Voice is feasible, correctly scoped, and correctly sequenced *as long as* the schema/staging work lands first. Tighten the dependency language so "stable enough" reads as "schema encodes provenance + a staging registry exists."

---

## 6. MVP Feature List (mandatory)

Build the grounded text loop in owned code. An MVP is done when **one** user can:

1. **Load a document/transcript** into a Lumen-owned source pane that registers `surface_id`, `pane_id`, `document_id`.
2. **Create + re-anchor source highlights**, with repeated-text disambiguation and *reported* (not silent) stale highlights.
3. **See agent briefing turns** in text/chat, each carrying source-span references.
4. **Activate the cited highlight** when a briefing turn references it (the magic-moment binding).
5. **See staged artifacts** for `claim, decision, question, risk, action, insight`, proposed from interpretation.
6. **Accept / reject / edit** each staged artifact; rejected items keep evidence but lose live projection.
7. **See tri-state visibly** — source text vs. agent inference vs. accepted artifact distinguishable without explanation.
8. **Export a packet** that validates against a packet-level schema, with per-artifact `source_span`, provenance/author, approval state, and `kind`.
9. **Import that packet** and reconstruct review state (highlights re-anchor).
10. **Validate fixtures deterministically**, including a highlight → artifact → export → re-import round-trip test.

No voice, no Excalidraw on the critical path. DOM review cards are fine for the staging surface.

---

## 7. Not-Now List (explicit)

- Realtime spoken narration / `gpt-realtime-2` voice session — **first modality after MVP**, not in it.
- Excalidraw spatial whiteboard as a *required* surface — keep as a parallel prototype.
- Live-meeting capture / multi-participant facilitation.
- Cross-origin iframe highlighting as the primary path.
- Auto-accept / policy approval — MVP is 100% human-reviewed.
- Memory-enrichment *inbound* return path / OpenReflect ingestion — define the outbound packet only.
- Generated images / AV recaps.
- Provider names in user-facing copy.
- Canvas-engine JSON as a source of truth.

---

## 8. Next Build Sequence

I largely endorse the PM eval's Phase A/B/C/D. The one change I'd make: **insert a Phase 0 schema fix before everything**, because it's the true blocker for both the text loop and voice.

**Phase 0 — Fix the contract (days, not weeks).**
- Reconcile the `kind` enum to the PRD (add `claim`, `risk`, `insight`; decide `card`'s fate).
- Add provenance/author (`source` / `agent_inference` / `human`), an approval `state`, and an `interpretation_of` link from inference → source span.
- Make `source_turn_ids` optional when `source_span` is present (document-first path).
- Add `schemas/export-packet.schema.json` + a packet fixture; extend `validate_artifact.py` and tests.

**Phase A — Own the loop in text.** Source pane w/ identity → highlight↔artifact mapping layer → staging/review UI (accept/reject/edit) → export+import round-trip → round-trip tests. (PM eval §6 Phase A.)

**Phase B — Agent as grounded text briefer.** Briefing turns carrying span refs that drive highlight activation; tri-state UI; agent behind an adapter.

**Phase C — Voice as the first new modality.** New ephemeral-secret endpoint → browser WebRTC client → `gpt-realtime-2` voice → Lumen function tools writing *staged* (never accepted) artifacts → capture spoken turns as provenance → barge-in.

**Phase D — Productized canvas + live capture.** Componentize Excalidraw into a renderer over normalized items; then live/multi-user.

---

## 9. Concrete File-Level Recommendations

**Schema & fixtures (highest leverage):**
- `schemas/conversation-artifact.schema.json` — add `claim`, `risk`, `insight` to enum; add top-level `provenance.author` (`source`/`agent_inference`/`human`), `approval_state` (`staged`/`accepted`/`rejected`/`edited`), and `interpretation_of`; relax `source_turn_ids` required-ness when `source_span` exists. This is the #1 fix — the moat lives here and tri-state currently has no representation.
- Add `schemas/export-packet.schema.json` (wraps accepted artifacts + source + provenance + import metadata).
- Add fixtures: `examples/export-packet.example.json`, plus `claim`, `risk`, `insight` artifact examples. Reconcile `staged-card-artifact.example.json` if `card` is dropped.
- `scripts/validate_artifact.py` + `test/test_validate_artifact.py` — validate packets and a highlight→artifact→export→import round-trip.

**Owned code:**
- `src/static-highlighter/lumen-light.js` — emit normalized highlight artifacts matching the schema; accept `surface_id`/`pane_id`/`document_id`; harden repeated-text disambiguation (currently first-match `indexOf`); turn the silent skip count into a reported stale-highlight list.
- Add new Lumen-owned modules: source-pane registry, artifact registry, staging/review surface, packet assembler/importer. (None exist.)

**Docs:**
- `README.md` — **rewrite to match the PRD.** It currently describes the old "realtime thinking surface / OpenReflect" product and is the de-facto front door. Highest user-visible inconsistency.
- `docs/PRD.md` — commit to one persona; move MVP Scope / Feature Map / Build Sequence / provider names to an appendix or engineering doc; add a concrete tri-state UX + data definition.
- `docs/FEATURE-MAP.md` + `docs/ARCHITECTURE.md` — align item kinds with the PRD; promote span-binding and tri-state to headline differentiators; state Excalidraw-is-a-renderer explicitly.
- `ROADMAP.md` — re-number to match the PRD's user-capability phases. Three different phase numberings across docs today.
- Reconcile the "AutoPreso" vs "Beacon Table" provenance references.
- Consider archiving the three review docs (`PRD-REFINEMENT-ANALYSIS`, `OPUS-PRD-SECOND-PASS-BRIEF`, `PM-PRODUCT-EVALUATION`) and this packet under `docs/reviews/` so the planning surface isn't mistaken for the spec.

**Prototype:**
- `prototypes/lumen-light-whiteboard-prototype/` — keep on a parallel track. Reuse turn-queue / agent-adapter / settings *concepts*. Do not extend it into voice or treat its direct-canvas mutation as the artifact model.

---

## 10. Disagreements With Current Framing

1. **"The PRD now combines four threads" is treated as done; I'd treat it as the risk.** Combining the threads is what reintroduced the breadth the PM eval warned against (eight personas, every phase in the user-facing doc). The combine improved the *narrative* and regressed the *focus*. One more subtractive pass is needed.

2. **The repo is framed as "transcription slice exists, voice is the gap." The real gap is the contract.** The honest status is that the *grounded text loop* — the thing that's supposedly low-risk and owned — is also unbuilt, and the schema doesn't encode tri-state. Voice is not the long pole; the artifact contract is. I'd lead the reality section with that.

3. **The schema is described as a shipped moat; functionally it's a single-artifact validator that contradicts the PRD's own kind list and omits provenance.** Calling it "the only owned part" (PM eval) is fair for the *highlighter*; for the *schema* it overstates readiness. The schema is owned but wrong, which is worse than unbuilt because docs cite it as done.

4. **Mild disagreement with the research doc's "build voice once the loop is stable enough."** "Stable enough" is too soft and invites a premature WebRTC spike. The hard gate is concrete: provenance+approval in the schema and a staging registry that can receive `create_staged_artifact`. State the blocker, not a vibe.

5. **Agreement, for the record:** the voice *feasibility* call is correct, the text-loop-first *sequencing* is correct, and the "surface is a projection / review before durability" principles are the right spine. Don't relitigate those — protect them.

---

**One-sentence close:** The story and the sequencing are right; the work now is unglamorous — make the schema express tri-state and provenance, connect the highlighter to it, build the accept/reject loop in owned DOM, and fix the README so the front door matches the product — *then* let the voice briefer speak on top of a loop that already works.
