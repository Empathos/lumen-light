# Contributing to Lumen-Light / Beacon Table

Thanks for working on Lumen Light. This guide covers how we make changes so the
codebase stays coherent. Read it alongside the [SPEC](docs/SPEC.md),
[ARCHITECTURE](docs/ARCHITECTURE.md), and [decisions](docs/decisions/).

## Setup

```bash
npm install
cp .env.local.example .env.local   # then add your OPENAI_API_KEY (if any)
npm run dev                         # http://localhost:5180
```

Realtime voice/text requires an OpenAI API key. Keep the key in `.env.local`;
never commit it.
A key only unlocks the live voice/text Realtime session.

## How we work

We follow a spec-first, decision-recording process (mirroring the Cursor/Anthropic
agent-skills conventions this project is documented under):

1. **Spec before code.** For anything beyond a trivial fix, update
   [`docs/SPEC.md`](docs/SPEC.md) first so intent is explicit. The spec is a
   living document — change it when scope or contract changes.
2. **Record decisions.** Any significant or hard-to-reverse choice (a dependency,
   the tool contract, the canvas model, a transport) gets an ADR in
   [`docs/decisions/`](docs/decisions/). Copy the format of an existing ADR;
   number sequentially; never delete an ADR — supersede it.
3. **Implement incrementally.** Small, reviewable changes. Keep the central seam
   intact: input modality must stay decoupled from canvas behavior
   ([ADR-0003](docs/decisions/ADR-0003-canvas-as-projection.md)).
4. **Verify.** See [`docs/TESTING.md`](docs/TESTING.md).

## Coding standards

- TypeScript strict mode; function components; no default exports for modules.
- **Comment the *why*, not the *what*.** No comments that restate the code.
- **Validate untrusted input before it touches the canvas.** Tool args come from
  a model — normalize and drop invalid pieces (`normalizeFlow.ts`,
  `normalizeCanvasElements`).
- **Mirror TLDraw enums from the installed schema.** Don't guess style values;
  TLDraw v3 validates strictly (see
  [ADR-0004](docs/decisions/ADR-0004-full-tldraw-vocabulary.md)).
- Keep the canvas a projection: each draw call replaces the previous call's
  shapes and leaves user-drawn shapes alone.

## Boundaries

- **Always:** keep the API key server-side; run `npm run typecheck` before
  committing; update the spec/ADRs when behavior or decisions change.
- **Ask first:** adding dependencies; changing the tool contract
  (`draw_canvas` / `draw_flow` / `capture_canvas`); adding a production token
  backend; changing the canvas-as-projection model.
- **Never:** commit `.env.local` or any secret; put a standard API key in the
  browser; treat TLDraw element JSON as the durable source of truth.

## Commits & PRs

- Small, focused, present-tense commits (`feat(canvas): …`, `fix(realtime): …`,
  `docs: …`).
- In the PR description, link the spec section or ADR the change implements.
- Confirm `npm run typecheck` and `npm run build` pass, and that no secret is in
  the diff, before requesting review.
