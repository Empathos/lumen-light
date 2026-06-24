import type { Plugin, Connect } from 'vite'
import type { ServerResponse } from 'node:http'

/**
 * Dev-server endpoints that proxy the Inworld Realtime WebRTC handshake.
 *
 * Inworld's Realtime API speaks the OpenAI Realtime protocol (data channel
 * `oai-events`, identical event names), but authenticates the signaling
 * endpoints with `Authorization: Bearer <API_KEY>` and has no ephemeral-token
 * mechanism. To keep the key off the client, we proxy the two signaling steps:
 *
 *   GET  /api/realtime/ice   -> Inworld GET  /v1/realtime/ice-servers
 *   POST /api/realtime/call  -> Inworld POST /v1/realtime/calls (with session)
 *
 * The session (instructions + tools + router model + voice stack) is attached
 * server-side on the call, so the realtime model can call Lumen tools the moment
 * the session opens. The API key NEVER leaves the server.
 */

export interface RealtimeEnv {
  apiKey?: string
  /** Inworld router id (preferred) or concrete model id for session.model. */
  model?: string
  /** Inworld voice name for TTS output. */
  voice?: string
  /** STT model id; defaults to inworld/inworld-stt-1. */
  sttModel?: string
  /** TTS model id; defaults to inworld-tts-2. */
  ttsModel?: string
}

const INWORLD_BASE = 'https://api.inworld.ai/v1/realtime'

const INSTRUCTIONS = `You are Lumen, a thinking-canvas collaborator.

The user thinks out loud — by voice or text — and a shared whiteboard sits
between you. Your job is to visualize their ideas on that canvas as the
conversation unfolds, so it becomes coherent and memorable.

You have the full visual vocabulary of a whiteboard. Use draw_canvas as your
primary tool. Don't limit yourself to flowcharts — choose whatever representation
fits the idea:
- mind maps and concept maps (a central shape with branches)
- sticky notes ("note") for brainstormed ideas, pros/cons, questions
- labelled shapes for entities, systems, people, options
- comparisons and quadrants, timelines, groupings, hierarchies
- free text labels ("text") for headings and annotations
- connectors (type "connector" with from/to element ids) to show relationships

Use color and fill meaningfully (e.g. green for positive, red for risk, yellow
sticky notes for raw ideas). Vary shapes — circles, diamonds, clouds, stars,
hexagons — when it helps meaning. Give every element a unique "id" so connectors
can reference them. You may set x/y (canvas pixels, ~250px apart) to control
layout, or omit them to auto-arrange.

draw_flow is a shortcut for simple linear step-by-step processes only; prefer
draw_canvas for everything richer.

Always pass the COMPLETE set of elements you want visible — each call replaces
what the previous call drew. Speak briefly and naturally while you draw; the
canvas is the main output, not your words. Don't read the diagram aloud
element-by-element.

You cannot see the canvas unless you look. After drawing something non-trivial,
call capture_canvas to get a screenshot of how it actually rendered. Inspect it
for overlapping shapes, bad spacing, off-screen or cut-off elements, and
connectors going to the wrong place — then call draw_canvas again with corrected
x/y/w/h to clean it up. Use this look-then-fix loop especially when you place
elements by coordinates. Don't over-do it: a quick check and one realignment
pass is usually enough.

IMPORTANT: the screenshot returned after capture_canvas is generated
automatically by the app — it is NOT provided by the user. Never thank the user
for screenshots, never say "thanks for the screenshot", and don't talk about
images being shared with you. Just look and silently adjust the canvas.`

const DRAW_FLOW_TOOL = {
  type: 'function',
  name: 'draw_flow',
  description:
    'Create or replace the flow diagram on the shared canvas to represent the structure of what the user is discussing. Always pass the COMPLETE diagram; it replaces whatever was there before.',
  parameters: {
    type: 'object',
    additionalProperties: false,
    required: ['nodes', 'edges'],
    properties: {
      title: {
        type: 'string',
        description: 'Optional short title for the diagram.',
      },
      nodes: {
        type: 'array',
        description: 'The diagram nodes.',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'label', 'kind'],
          properties: {
            id: { type: 'string', description: 'Unique id used to reference this node in edges.' },
            label: { type: 'string', description: 'Short node label (max ~6 words).' },
            kind: {
              type: 'string',
              enum: ['start', 'process', 'decision', 'end'],
            },
          },
        },
      },
      edges: {
        type: 'array',
        description: 'Directed connections between nodes.',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['from', 'to'],
          properties: {
            from: { type: 'string', description: 'Source node id.' },
            to: { type: 'string', description: 'Target node id.' },
            label: { type: 'string', description: 'Optional edge label.' },
          },
        },
      },
    },
  },
}

const GEO_SHAPES = [
  'cloud', 'rectangle', 'ellipse', 'triangle', 'diamond', 'pentagon', 'hexagon',
  'octagon', 'star', 'rhombus', 'rhombus-2', 'oval', 'trapezoid', 'arrow-right',
  'arrow-left', 'arrow-up', 'arrow-down', 'x-box', 'check-box', 'heart',
]
const CANVAS_COLORS = [
  'black', 'grey', 'light-violet', 'violet', 'blue', 'light-blue', 'yellow',
  'orange', 'green', 'light-green', 'light-red', 'red', 'white',
]
const CANVAS_FILLS = ['none', 'semi', 'solid', 'pattern', 'fill']
const CANVAS_SIZES = ['s', 'm', 'l', 'xl']

const DRAW_CANVAS_TOOL = {
  type: 'function',
  name: 'draw_canvas',
  description:
    'Draw or replace the contents of the shared whiteboard using the full visual vocabulary: any shape, sticky notes, text labels, and connectors. Use this for mind maps, concept maps, comparisons, hierarchies, brainstorms — anything, not just flowcharts. Always pass the COMPLETE set of elements; it replaces whatever was there before.',
  parameters: {
    type: 'object',
    additionalProperties: false,
    required: ['elements'],
    properties: {
      title: { type: 'string', description: 'Optional short title for the board.' },
      elements: {
        type: 'array',
        description: 'Every element that should be visible on the canvas.',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'type'],
          properties: {
            id: { type: 'string', description: 'Unique id; referenced by connectors.' },
            type: {
              type: 'string',
              enum: ['shape', 'text', 'note', 'connector'],
              description:
                '"shape" = a geometric shape; "note" = sticky note; "text" = free text label; "connector" = an arrow between two elements.',
            },
            geo: {
              type: 'string',
              enum: GEO_SHAPES,
              description: 'For type "shape": which geometric shape to draw.',
            },
            text: { type: 'string', description: 'Label/content text (or connector label).' },
            x: { type: 'number', description: 'Optional canvas x in pixels.' },
            y: { type: 'number', description: 'Optional canvas y in pixels.' },
            w: { type: 'number', description: 'Optional width for shapes.' },
            h: { type: 'number', description: 'Optional height for shapes.' },
            color: { type: 'string', enum: CANVAS_COLORS, description: 'Optional color.' },
            fill: { type: 'string', enum: CANVAS_FILLS, description: 'Optional fill style for shapes.' },
            size: { type: 'string', enum: CANVAS_SIZES, description: 'Optional size (text/stroke scale).' },
            from: { type: 'string', description: 'For type "connector": source element id.' },
            to: { type: 'string', description: 'For type "connector": target element id.' },
          },
        },
      },
    },
  },
}

const CAPTURE_CANVAS_TOOL = {
  type: 'function',
  name: 'capture_canvas',
  description:
    'Take a screenshot of the current canvas so you can see how it actually rendered. Returns the image to you. Use it after drawing to verify layout (overlaps, spacing, off-screen or cut-off elements, misrouted connectors), then call draw_canvas again to realign if needed.',
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {},
  },
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(payload))
}

function readBody(req: Connect.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

/** The session config attached to every Inworld call (model, voice, tools). */
function buildSession(env: RealtimeEnv) {
  return {
    type: 'realtime',
    model: env.model || 'inworld/lumen-router',
    instructions: INSTRUCTIONS,
    output_modalities: ['audio', 'text'],
    audio: {
      input: {
        transcription: { model: env.sttModel || 'inworld/inworld-stt-1' },
        turn_detection: { type: 'semantic_vad', eagerness: 'medium' },
      },
      output: {
        model: env.ttsModel || 'inworld-tts-2',
        voice: env.voice || 'Ashley',
        speed: 1.0,
      },
    },
    tools: [DRAW_CANVAS_TOOL, DRAW_FLOW_TOOL, CAPTURE_CANVAS_TOOL],
    tool_choice: 'auto',
  }
}

export function lumenRealtimePlugin(env: RealtimeEnv): Plugin {
  return {
    name: 'lumen-realtime',
    configureServer(server) {
      // Step 1: hand the browser STUN/TURN config (key stays here).
      server.middlewares.use(
        '/api/realtime/ice',
        async (_req: Connect.IncomingMessage, res: ServerResponse) => {
          if (!env.apiKey) {
            sendJson(res, 500, { error: 'INWORLD_API_KEY is not set. Add it to .env.local.' })
            return
          }
          try {
            const r = await fetch(`${INWORLD_BASE}/ice-servers`, {
              headers: { Authorization: `Bearer ${env.apiKey}` },
            })
            const text = await r.text()
            res.statusCode = r.status
            res.setHeader('content-type', 'application/json')
            res.end(text)
          } catch (err) {
            sendJson(res, 500, { error: err instanceof Error ? err.message : String(err) })
          }
        },
      )

      // Step 2: proxy the SDP offer to Inworld with the session config attached,
      // return the SDP answer. The API key never reaches the browser.
      server.middlewares.use(
        '/api/realtime/call',
        async (req: Connect.IncomingMessage, res: ServerResponse) => {
          if (!env.apiKey) {
            sendJson(res, 500, { error: 'INWORLD_API_KEY is not set. Add it to .env.local.' })
            return
          }
          try {
            const body = await readBody(req)
            const { sdp } = JSON.parse(body || '{}') as { sdp?: string }
            if (!sdp) {
              sendJson(res, 400, { error: 'Missing sdp offer in request body.' })
              return
            }
            const r = await fetch(`${INWORLD_BASE}/calls`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${env.apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ sdp, session: buildSession(env) }),
            })
            const text = await r.text()
            res.statusCode = r.status
            res.setHeader('content-type', 'application/json')
            res.end(text)
          } catch (err) {
            sendJson(res, 500, { error: err instanceof Error ? err.message : String(err) })
          }
        },
      )
    },
  }
}
