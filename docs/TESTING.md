# Testing

How we verify Lumen-Light / Beacon Table today, and where it's headed. This is honest
about current coverage: the gates are real, the automated test suite is not built
yet, and this doc names the priority targets.

## Current gates (run before every commit)

```bash
npm run typecheck   # tsc -b, no emit — strict type contract across the app
npm run build       # tsc -b && vite build — catches what dev mode hides
```

Both must pass clean. Strict TypeScript is doing a lot of the heavy lifting:
the tool contract in `src/assistant/types.ts` and the canvas projectors are all
statically checked.

## Manual / browser verification

Because the core experience is a live canvas, the most valuable check is opening
it and exercising the flow:

1. `npm run dev`, open http://localhost:5180.
2. **Local dev mock:** type `Idea -> Sketch -> Build -> Ship` before starting a
   session and confirm a flow diagram renders. This is development scaffolding
   for exercising `mockProvider -> drawFlow -> TLDraw`, not a product
   requirement.
3. **Live path (needs a key):** start a session, speak or type an open-ended
   prompt, and confirm the agent calls `draw_canvas` with varied shapes/notes,
   and occasionally `capture_canvas` to realign.

Dev-only console hooks make canvas paths testable without the model:

```js
window.__lumenDrawCanvas([{ id: 'a', type: 'note', text: 'hi' }])
window.__lumenCapture()
```

## Automated browser tests (recommended next step)

Drive the running app with Playwright. This project is documented under the
agent-skills conventions, so use the **`webapp-testing`** skill: it manages
server lifecycle (`scripts/with_server.py`) and runs native Python Playwright
scripts. Reconnaissance-then-action: navigate, wait for `networkidle`,
screenshot/inspect to find selectors, then assert.

Good first end-to-end checks:
- Offline `A -> B -> C` produces the expected node/edge count on the canvas.
- A malformed dev-hook `draw_canvas` payload draws the valid parts and never
  crashes the page.

## Unit tests (highest-value targets)

The pure functions are easy, fast, and protect the contract. No runner is wired
up yet; Vitest is the natural fit for a Vite project. Prioritize:

| Target | What to assert |
|--------|----------------|
| `normalizeFlow.ts` | dangling edges dropped; bad `kind` coerced; ids deduped |
| `drawCanvas.ts` → `normalizeCanvasElements` | invalid enums dropped; connectors to unknown ids skipped; missing x/y auto-grids |
| `mockProvider.ts` | `A -> B -> C` yields the expected `draw_flow` diagram |

## What we deliberately don't test (yet)

- The OpenAI Realtime WebRTC handshake (external, networked, key-gated) — verify
  manually against current OpenAI docs, which change often
  ([ADR-0002](decisions/ADR-0002-openai-realtime-webrtc.md)).
- TLDraw's own rendering internals.

## Definition of done for a change

- `npm run typecheck` and `npm run build` pass.
- The relevant path was exercised in the browser against the live tool contract.
- New pure logic ships with unit tests once a runner exists.
- No secret in the diff.
