import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import type { ExcalidrawElementSkeleton } from '@excalidraw/excalidraw/data/transform'
import { commitSkeleton, connectorPoints, type Rect } from './excalidrawScene'

/**
 * A general, free-form canvas vocabulary projected onto Excalidraw. Unlike
 * `drawFlow` (which only knows linear flowcharts), this exposes the shapes
 * Excalidraw can draw: its three generic shapes, free text, sticky-style notes,
 * and bound connectors — with colors, fills, sizes, and positions. The realtime
 * model fills these in via the `draw_canvas` tool.
 *
 * The canvas remains a *view*: each call replaces the elements created by the
 * previous call (elements the user adds by hand are left alone).
 */

// Excalidraw only has three generic closed shapes. This is the documented
// trade-off vs. TLDraw's richer geo set; anything else falls back to rectangle.
export const GEO_SHAPES = ['rectangle', 'ellipse', 'diamond'] as const

export const CANVAS_COLORS = [
  'black', 'grey', 'light-violet', 'violet', 'blue', 'light-blue', 'yellow',
  'orange', 'green', 'light-green', 'light-red', 'red', 'white',
] as const

export const CANVAS_FILLS = ['none', 'semi', 'solid', 'pattern', 'fill'] as const
export const CANVAS_SIZES = ['s', 'm', 'l', 'xl'] as const
export const ELEMENT_TYPES = ['shape', 'text', 'note', 'connector'] as const

type GeoShape = (typeof GEO_SHAPES)[number]
type CanvasColor = (typeof CANVAS_COLORS)[number]
type CanvasFill = (typeof CANVAS_FILLS)[number]
type CanvasSize = (typeof CANVAS_SIZES)[number]
type ElementType = (typeof ELEMENT_TYPES)[number]

export interface CanvasElement {
  id: string
  type: ElementType
  geo?: GeoShape
  text?: string
  x?: number
  y?: number
  w?: number
  h?: number
  color?: CanvasColor
  fill?: CanvasFill
  size?: CanvasSize
  from?: string
  to?: string
}

// Stroke (and bound-label) color: the saturated, readable version of each color.
const COLOR_HEX: Record<CanvasColor, string> = {
  black: '#1e1e1e',
  grey: '#495057',
  'light-violet': '#7048e8',
  violet: '#6741d9',
  blue: '#1971c2',
  'light-blue': '#1c7ed6',
  yellow: '#f08c00',
  orange: '#e8590c',
  green: '#2f9e44',
  'light-green': '#37b24d',
  'light-red': '#f03e3e',
  red: '#e03131',
  white: '#343a40',
}

// Background fill: a light tint so a dark stroke + bound label stay readable.
const TINT_HEX: Record<CanvasColor, string> = {
  black: '#e9ecef',
  grey: '#e9ecef',
  'light-violet': '#e5dbff',
  violet: '#d0bfff',
  blue: '#a5d8ff',
  'light-blue': '#d0ebff',
  yellow: '#ffec99',
  orange: '#ffd8a8',
  green: '#b2f2bb',
  'light-green': '#d3f9d8',
  'light-red': '#ffe3e3',
  red: '#ffc9c9',
  white: '#f8f9fa',
}

const FONT_SIZE: Record<CanvasSize, number> = { s: 16, m: 20, l: 28, xl: 36 }
const STROKE_WIDTH: Record<CanvasSize, number> = { s: 1, m: 2, l: 2, xl: 4 }
type FillStyle = 'hachure' | 'cross-hatch' | 'solid'

function strokeColor(color?: CanvasColor): string {
  return color ? COLOR_HEX[color] : '#1e1e1e'
}

function fillFor(
  fill?: CanvasFill,
  color?: CanvasColor,
): { backgroundColor: string; fillStyle?: FillStyle } {
  if (!fill || fill === 'none') return { backgroundColor: 'transparent' }
  const bg = color ? TINT_HEX[color] : '#a5d8ff'
  if (fill === 'semi') return { backgroundColor: bg, fillStyle: 'hachure' }
  if (fill === 'pattern') return { backgroundColor: bg, fillStyle: 'cross-hatch' }
  return { backgroundColor: bg, fillStyle: 'solid' }
}

function oneOf<T extends readonly string[]>(
  list: T,
  value: unknown,
): T[number] | undefined {
  return typeof value === 'string' && (list as readonly string[]).includes(value)
    ? (value as T[number])
    : undefined
}

function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

/** Coerce arbitrary tool args into a clean, validated element list. */
export function normalizeCanvasElements(raw: unknown): CanvasElement[] {
  const obj = (raw ?? {}) as Record<string, unknown>
  const list = Array.isArray(obj.elements) ? obj.elements : []
  const out: CanvasElement[] = []
  const seen = new Set<string>()

  for (const item of list) {
    if (!item || typeof item !== 'object') continue
    const e = item as Record<string, unknown>
    const id = str(e.id).trim()
    const type = oneOf(ELEMENT_TYPES, e.type)
    if (!id || seen.has(id) || !type) continue
    seen.add(id)

    out.push({
      id,
      type,
      geo: oneOf(GEO_SHAPES, e.geo),
      text: str(e.text).trim() || undefined,
      x: num(e.x),
      y: num(e.y),
      w: num(e.w),
      h: num(e.h),
      color: oneOf(CANVAS_COLORS, e.color),
      fill: oneOf(CANVAS_FILLS, e.fill),
      size: oneOf(CANVAS_SIZES, e.size),
      from: str(e.from).trim() || undefined,
      to: str(e.to).trim() || undefined,
    })
  }
  return out
}

const GRID_X = 280
const GRID_Y = 220
const GRID_COLS = 4
const ORIGIN_X = 120
const ORIGIN_Y = 120

// Prefix so assistant element ids are stable and distinct from user-drawn ones.
const skeletonId = (id: string) => `lumen-${id}`

export function drawCanvasElements(
  api: ExcalidrawImperativeAPI,
  elements: CanvasElement[],
): number {
  const skeleton: ExcalidrawElementSkeleton[] = []
  const rects = new Map<string, Rect>()
  let autoIndex = 0

  // Pass 1: nodes (shapes, notes, text).
  for (const el of elements) {
    if (el.type === 'connector') continue

    let x = el.x
    let y = el.y
    if (x === undefined || y === undefined) {
      const col = autoIndex % GRID_COLS
      const row = Math.floor(autoIndex / GRID_COLS)
      x = ORIGIN_X + col * GRID_X
      y = ORIGIN_Y + row * GRID_Y
      autoIndex++
    }

    const id = skeletonId(el.id)

    if (el.type === 'text') {
      const fontSize = FONT_SIZE[el.size ?? 'm']
      const text = el.text ?? ''
      rects.set(el.id, { x, y, w: Math.max(40, text.length * fontSize * 0.55), h: fontSize * 1.4 })
      skeleton.push({
        type: 'text',
        id,
        x,
        y,
        text,
        fontSize,
        strokeColor: strokeColor(el.color),
      })
      continue
    }

    const w = el.w ?? 200
    const h = el.h ?? 120
    rects.set(el.id, { x, y, w, h })

    if (el.type === 'note') {
      // Excalidraw has no native sticky note; emulate with a filled, rounded
      // rectangle carrying a centered label. Dark stroke keeps the label legible.
      skeleton.push({
        type: 'rectangle',
        id,
        x,
        y,
        width: w,
        height: h,
        strokeColor: '#1e1e1e',
        backgroundColor: el.color ? TINT_HEX[el.color] : '#ffec99',
        fillStyle: 'solid',
        roundness: { type: 3 },
        ...(el.text ? { label: { text: el.text } } : {}),
      })
      continue
    }

    // type === 'shape'
    const { backgroundColor, fillStyle } = fillFor(el.fill, el.color)
    skeleton.push({
      type: el.geo ?? 'rectangle',
      id,
      x,
      y,
      width: w,
      height: h,
      strokeColor: strokeColor(el.color),
      strokeWidth: STROKE_WIDTH[el.size ?? 'm'],
      backgroundColor,
      ...(fillStyle ? { fillStyle } : {}),
      ...(el.text ? { label: { text: el.text } } : {}),
    })
  }

  // Pass 2: connectors (arrows routed border-to-border, bound for dragging).
  for (const el of elements) {
    if (el.type !== 'connector') continue
    const from = el.from ? rects.get(el.from) : undefined
    const to = el.to ? rects.get(el.to) : undefined
    if (!from || !to) continue

    const { start, end } = connectorPoints(from, to)
    skeleton.push({
      type: 'arrow',
      x: start.x,
      y: start.y,
      width: end.x - start.x,
      height: end.y - start.y,
      points: [
        [0, 0],
        [end.x - start.x, end.y - start.y],
      ],
      strokeColor: strokeColor(el.color),
      strokeWidth: STROKE_WIDTH[el.size ?? 'm'],
      start: { id: skeletonId(el.from!) },
      end: { id: skeletonId(el.to!) },
      ...(el.text ? { label: { text: el.text } } : {}),
    })
  }

  return commitSkeleton(api, skeleton)
}
