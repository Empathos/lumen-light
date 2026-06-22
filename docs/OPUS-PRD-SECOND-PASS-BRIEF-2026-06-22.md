# Lumen Light Opus PRD Second-Pass Brief

Prepared: 2026-06-22

Purpose: provide a revised product framing for a second high-effort Opus review
after discussion clarified that Lumen Light is not only an artifact pipeline.
It is a multimodal human-agent interaction surface.

## Why This Second Pass Exists

The prior Opus pass correctly identified a major product truth:

- Lumen Light's durable moat is the provenance-preserving artifact contract.
- The visible surface is a projection.
- The durable output is evidence-linked artifacts that can be reviewed,
  exported, and later enriched by memory systems.

That analysis was useful, but it under-described the finished product
experience. It treated the whiteboard mostly as a prototype risk or visual
projection layer. The newer product insight is that the whiteboard, source
highlighting, chat, and future audio/video layer are not incidental UI. They are
additional modalities through which the human and the agent communicate.

The second review should analyze Lumen Light as both:

1. a provenance-preserving artifact system, and
2. a multimodal interaction surface between a human and an AI agent.

## Revised Product Thesis

Lumen Light is a shared briefing and thinking surface where a human and an AI
agent work through source material together using realtime voice, chat, source
highlighting, whiteboarding, and eventually richer audio/video.

The product breaks the agent out of a scrolling text window. Instead of the
assistant only replying in chat, the agent can point to evidence, explain it,
highlight relevant passages, arrange concepts on a whiteboard, and help the
human review or accept durable artifacts.

The agent's role is closer to a live briefer or presenter than a passive
summarizer. It is responsible for helping the human move through the material:
introducing what matters, calling attention to evidence, explaining why a
passage is important, arranging the shared visual surface, and pausing for
human correction or approval.

The human can inspect the source, follow the agent's interpretation, correct or
redirect the agent, approve or reject proposed artifacts, and export a sourced
packet of decisions, questions, actions, claims, risks, and insights.

## Monday-Morning Answer

Who opens this?

A facilitator, researcher, strategist, founder, coach, product lead, analyst, or
reviewer who needs to understand and preserve meaning from a complex document,
transcript, meeting, research session, or planning conversation.

To do what?

To have an AI agent brief them through the material while keeping the briefing
grounded in the source. The agent talks or chats about the content, highlights
the evidence it is referring to, and builds a parallel whiteboard or briefing
surface of emerging artifacts.

The intended prototype/MVP interaction layer includes the OpenAI Realtime API
for low-latency spoken agent interaction. The user should be able to experience
the agent as a live briefer: speaking through material, pointing at source
evidence, and updating the visual surface as the briefing unfolds.

Instead of what?

- reading alone
- asking questions in a detached chatbot window
- trusting an unsourced AI summary
- manually copying insights into notes or a whiteboard
- keeping only a raw transcript
- saving a whiteboard screenshot that loses provenance
- dumping conversation data into memory without review

## Core Experience

The user opens Lumen Light with source material: a document, transcript, live
conversation, meeting notes, research interview, or imported briefing packet.

The interface gives the human and agent several coordinated surfaces:

- a source pane, where the document or transcript remains inspectable
- a chat or briefing pane, where the agent explains and discusses the material
- a realtime voice layer, using OpenAI Realtime API in the prototype/MVP path
- a highlight layer, where relevant source spans are visibly grounded
- a whiteboard or visual surface, where the agent and human arrange emerging
  claims, decisions, questions, risks, actions, and relationships
- a review/staging layer, where agent-proposed artifacts can be accepted,
  rejected, edited, or deferred

The agent's explanation may be interpretive. It does not have to merely repeat
the source text. It can say, in effect, "this section is really about the risk
of X," while the UI shows which passage is being interpreted and which visual or
structured artifact is being created from that interpretation.

The important distinction is visible:

- what the source literally says
- what the agent is inferring or explaining
- what the human has accepted as a durable artifact

## Finished-State Product POV

Finished Lumen Light should feel less like a chatbot and less like a generic
canvas. It should feel like an agent-led briefing room.

The agent is not just answering. It is presenting, pointing, arranging,
highlighting, and co-thinking with the human. Its closest role model is a live
briefer: someone who has prepared the material, understands the structure, can
walk the room through it, and can respond when the audience asks for
clarification, evidence, or a different framing.

The whiteboard is valuable because it gives the agent and human a shared visual
workspace. The source highlights are valuable because they keep interpretation
grounded. The artifact contract is valuable because it preserves what should
survive after the session ends.

This means the product's finished-state promise is:

> Understand complex material with an AI agent through a grounded, multimodal
> briefing surface, then leave with reviewable artifacts whose evidence trail is
> intact.

## MVP And Prototype Direction

For the MVP/prototype, keep the existing Excalidraw-based whiteboard surface.
It already proves that a browser-embedded canvas can sit inside the Lumen
experience and receive agent-driven updates.

Do not rewrite the canvas engine yet.

Instead, establish the product architecture so Excalidraw is a renderer, not
the core data model. The stable product model should be Lumen's own artifact
and interaction model:

- source material
- source spans and highlights
- agent briefing turns
- realtime voice turns
- human responses and approvals
- normalized items
- staged artifacts
- accepted artifacts
- visual projection metadata
- export packet

Excalidraw can render the whiteboard for now. Later renderers could include
TLDraw, React Flow, DOM cards, SVG, a custom canvas, or a video composition
surface. That future flexibility depends on keeping the durable model above the
canvas library.

## Feature Implications

### 1. Source Pane

The source pane must remain inspectable and stable. It can show documents,
transcripts, meeting notes, imported text, or generated briefing packets.

Key features:

- source span anchoring
- highlight rendering
- repeated-text disambiguation
- stale highlight handling
- pane identity
- source metadata

### 2. Agent Briefing And Voice Layer

The agent needs visible and spoken modalities for explaining the source. The
prototype/MVP path should explicitly account for OpenAI Realtime API as the
low-latency voice layer. Chat remains useful, but the product should not be
designed as chat-first with audio bolted on later.

Key features:

- agent explanations
- realtime spoken briefing turns
- user questions and redirects
- low-latency interruption/correction loop
- references from agent messages to source spans
- references from agent messages to whiteboard/artifact objects
- distinction between literal source content and agent interpretation
- transcript capture of spoken agent/human turns when needed for provenance

The briefer role matters here. The agent is not simply waiting for questions.
It is actively guiding attention through the material, using voice, text,
highlights, and the whiteboard as coordinated presentation channels.

### 3. Highlight Layer

Highlights are not only annotations. They are the agent's pointing mechanism.

Key features:

- manual user highlights
- agent-proposed highlights
- active highlight synchronized with agent explanation
- highlight-to-artifact links
- reviewable provenance

### 4. Whiteboard / Shared Visual Surface

The whiteboard is a communication modality, not the durable record itself.

Key features:

- embedded Excalidraw prototype
- agent-created cards, arrows, groupings, diagrams, and emphasis
- user edits
- viewport movement to the current talking point
- staging and live modes
- screenshots or visual snapshots as secondary artifacts, not primary memory

### 5. Artifact Review Layer

The review layer is where transient interpretation becomes durable.

Key features:

- staged artifacts
- accept/reject/edit actions
- artifact type: claim, decision, question, action, risk, insight, diagram node,
  diagram edge
- evidence references
- confidence or uncertainty notes
- human approval state

### 6. Export Packet

The export packet is the durable output after the interaction.

Key features:

- accepted artifacts
- evidence references
- source span IDs
- agent interpretation references
- human approval metadata
- optional visual projection metadata
- memory-enrichment hints

### 7. Realtime Audio And Future AV

Audio is part of the intended interaction model, not only a distant add-on. The
prototype/MVP should use the OpenAI Realtime API to explore the core experience:
the user hears the agent talk through the material while the interface
highlights source passages and updates the visual surface.

Future AV could combine:

- agent narration
- source highlighting
- whiteboard movement
- artifact review
- generated walkthroughs or recap videos

Full video/AV generation should be treated as a future-generation capability,
not an MVP blocker. Realtime spoken briefing, however, should be considered part
of the core product exploration because it changes how the human experiences
the agent: as a briefer inside a shared surface, not merely text in a chat pane.

## What Opus Should Re-Assess

Please perform a fresh, high-effort product and PRD review using this revised
framing. Read the repository as implementation evidence, but judge the product
through the lens above.

Assess:

1. Whether the revised thesis is clearer and more user-facing than the prior
   artifact-pipeline framing.
2. Whether the Monday-morning user, task, and alternative are now clear enough.
3. Which features are required for the MVP to demonstrate the multimodal
   human-agent interaction surface.
4. Which features should be deferred to avoid turning the MVP into a general
   canvas, meeting recorder, or AV production tool.
5. How the PRD should describe the relationship between source text, agent
   interpretation, whiteboard projection, human approval, and durable artifact.
6. Whether the Excalidraw prototype should remain as the MVP canvas renderer.
7. How OpenAI Realtime API should fit into the MVP without making the
   user-facing PRD overly provider-specific.
8. How to describe the agent's briefer/presenter role in concrete product
   terms.
9. Where the current repo already supports this framing.
10. Where the current repo contradicts, obscures, or under-specifies this
   framing.
11. What the user-facing PRD should say in its first 500 words.
12. What build sequence would best move from current repo state to a coherent
    MVP.

## Desired Output From Opus

Return:

- a concise product POV
- a rewritten user-facing PRD opening
- the MVP feature list
- the not-now list
- the clearest finished-state narrative
- the highest-risk ambiguities
- recommended repo/docs/code changes
- any disagreement with this brief

Be direct. If this framing is too broad, say where. If the artifact contract
should still be primary, explain how to present it without losing the
human-agent interaction surface.
