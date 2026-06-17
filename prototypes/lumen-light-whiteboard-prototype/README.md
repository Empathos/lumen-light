# Lumen Light Whiteboard Prototype

This is the runnable whiteboard prototype area for Lumen Light.

It was extracted from the MIT-licensed AutoPreso project and renamed so we can stand it up, study the working loop, and then componentize it into Lumen-owned modules.

## What It Contains

- local Express/WebSocket server
- browser whiteboard surface using Excalidraw
- staging and live modes
- transcript queue and chunking
- whiteboard agent tool loop
- OpenAI, Codex, Ollama, and simulator agent provider paths
- OpenAI Realtime and optional Moonshine transcription paths

## How To Run

```bash
npm install
npm start -- --no-open
```

Default URL:

```text
http://127.0.0.1:3210
```

The server binds to localhost only.

## Prototype Boundary

This directory is intentionally separate from the small static highlighter in `../../src/static-highlighter/`.

The highlighter remains the minimal dependency-free baseline. This prototype is the larger live whiteboard surface we will componentize into Lumen Light primitives.

## Upstream

Source project: https://github.com/kunchenguid/autopreso

License: MIT. See `LICENSE` and `UPSTREAM.md`.
