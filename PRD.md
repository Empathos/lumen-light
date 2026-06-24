# Lumen-Light / Beacon Table - Product Requirements (v0 Draft)

Status: working draft. UX-first, high-level. This PRD describes the current
canvas-first Lumen-Light / Beacon Table product direction.

> **Where things live:** this PRD is the *product* view (what/why/for whom).
> The *engineering* views live beside it — runtime contract in
> [`docs/SPEC.md`](docs/SPEC.md), structure in
> [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), and the reasoning behind key
> choices in [`docs/decisions/`](docs/decisions/). How to run and contribute is
> in [`README.md`](README.md) and [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## 1. What It Is

Lumen Light is a **thinking canvas with a live AI collaborator**.

You open a large open whiteboard. You talk or type. As you do, an AI assistant
listens and **draws alongside you in real time** — turning loose conversation
into flow diagrams, structure, and supporting visuals so the ideas become
coherent while you're still working through them.

It is not a chat window with a canvas bolted on. The **canvas is the main stage**,
and the assistant is a creative partner drawing on it with you.

One sentence:

> **Lumen Light is a voice-and-text whiteboard where an AI collaborator diagrams
> your conversation as it happens, and can brief you through documents by talking,
> highlighting, and drawing the connections live.**

---

## 2. Who It's For

The first user is a **thinker working through something complex out loud**:
a founder, researcher, strategist, product lead, facilitator, coach, or analyst.

They reach for Lumen Light when they want to:

- think out loud and watch the structure of their thoughts appear
- make a messy conversation coherent without stopping to draw it themselves
- be briefed on a dense document instead of reading it alone
- leave with a visual artifact that captures the thinking, not just a transcript

---

## 3. What It Does (Core Capabilities)

### 3.1 Live conversation-to-diagram (hero feature)

As the user speaks or types, the assistant extracts the key points and **draws
them on the canvas in real time** — primarily as **flow diagrams** that bring
structure and coherence to what's being said.

- Diagrams appear and update as the conversation moves.
- The canvas content is **supplemental** — it supports and clarifies what the
  user is saying, rather than transcribing it.
- Shapes follow a **defined visual schema** (starting with UML-style flow shapes)
  so output is consistent and legible, not random scribbles.

### 3.2 Voice and text input (both first-class)

- **Voice** is the headline experience: speak naturally, the canvas responds.
- **Text chat** is an equal input path and drives the **same** assistant actions.
- Both feed **one shared canvas**. The user can mix modes freely.

### 3.3 Document briefing mode

When the user provides a document and asks to be briefed, the assistant acts like
a **Toastmaster / live presenter**:

- walks through the document section by section, talking it through
- **highlights the interesting passages** as it discusses them
- **draws the correlations** between ideas visually on the canvas
- guides the user's attention rather than dumping a summary

### 3.4 Creative visuals and generated media

The assistant is allowed to be **creative** in how it represents ideas:
diagrams, infographics, arrangements, emphasis — and, as a layered-in capability,
**generated pictures/media** to enrich the canvas.

### 3.5 A canvas you leave with

The session produces a **visual artifact** — the populated canvas — that captures
the shape of the thinking, not just a chat log.

---

## 4. How It Works (User's-Eye View)

The experience, end to end:

```text
open canvas
  -> user speaks or types
  -> assistant understands the point
  -> assistant draws / updates flow diagram on the canvas (live)
  -> conversation continues, canvas keeps pace
```

Document briefing:

```text
user loads a document + asks for a briefing
  -> assistant walks through it section by section (talking)
  -> highlights the passage it's discussing
  -> draws the connections between passages on the canvas
  -> user follows along, asks questions, redirects
```

The user always stays in control: they can interrupt, redirect, edit the canvas
directly, and steer what the assistant focuses on.

---

## 5. Trust Model (carried forward, sharpened)

Even on a creative canvas, the user must be able to tell **what's grounded from
what's invented**. We keep a clear distinction between:

1. **Source** — what a provided document literally says.
2. **Assistant interpretation** — what the AI is inferring, structuring, or drawing.
3. **What the user has kept** — what the user accepts/edits as theirs.

When the assistant briefs from a document, anything it draws should be traceable
back to the passage it came from. Creativity is encouraged; ungrounded claims
dressed up as fact are not.

> Note: in the original product this was a strict "stage everything before it's
> durable" review gate. On a live creative canvas this needs a lighter touch —
> exact mechanism is an open question (see §8).

---

## 6. Key Technology Direction (high-level only)

Detailed architecture is deferred, but the intended direction is:

- **Canvas:** TLDraw (programmable shapes, supports an assistant drawing into it).
- **Live voice:** OpenAI Realtime API.
- **Assistant → canvas:** a defined shape schema (UML-style to start) the
  assistant emits to create/update diagrams.
- **Build order advantage:** because voice and text trigger the *same* canvas
  actions, the whole loop can be built and tested over **text first**, then voice
  layered on without redesign.

---

## 7. What's In vs. Out for v0

**In:**

- open canvas as the main surface
- text-driven live conversation-to-flow-diagram
- voice-driven live conversation-to-flow-diagram (OpenAI Realtime)
- document briefing mode with passage highlighting + connection drawing
- a defined starter shape schema

**Later (not v0):**

- generated pictures / rich media on the canvas
- multi-user / live collaboration
- deep memory / export-to-external-systems integration
- advanced creative visual styles beyond the starter schema

---

## 8. Open Questions

- How light or strict should the trust/review model be on a live canvas?
- What exactly is the starter shape schema (which UML-style shapes for v0)?
- How does the user correct or reshape what the assistant drew?
- What's the smallest first runnable slice (the "hero demo")?
- Does the session persist / what does the user leave with concretely?

---

## 9. Related Documents

| Document | Purpose |
|----------|---------|
| [`docs/SPEC.md`](docs/SPEC.md) | Runtime contract: tools, commands, structure, boundaries, success criteria. |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | How the pieces fit together and the data/event flow. |
| [`docs/decisions/`](docs/decisions/) | ADRs — why the key technical choices were made. |
| [`docs/TESTING.md`](docs/TESTING.md) | How changes are verified. |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | How we work: spec-first, decision-recording, coding standards. |
| [`README.md`](README.md) | Overview, setup, and run instructions. |

_This draft is a living document — it is updated as decisions land. Significant
changes should be reflected here and, where they're architectural, recorded as an
ADR in [`docs/decisions/`](docs/decisions/)._
