import { createShapeId, toRichText, type Editor, type TLShapeId } from 'tldraw'

/**
 * A general, free-form canvas vocabulary. Unlike `drawFlow` (which only knows
 * about linear flowcharts), this exposes most of what TLDraw can draw: any geo
 * shape, sticky notes, free text labels, and connectors — with colors, fills,
 * sizes, and positions. The realtime model fills these in via the `draw_canvas`
 * tool.
 *
 * The canvas remains a *view*: each call replaces the shapes created by the
 * previous call (shapes the user adds by hand are left alone).
 */

export const GEO_SHAPES = [
  'cloud', 'rectangle', 'ellipse', 'triangle', 'diamond', 'pentagon', 'hexagon',
  'octagon', 'star', 'rhombus', 'rhombus-2', 'oval', 'trapezoid', 'arrow-right',
  'arrow-left', 'arrow-up', 'arrow-down', 'x-box', 'check-box', 'heart',
] as const

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

export function drawCanvasElements(
  editor: Editor,
  elements: CanvasElement[],
  previousIds: TLShapeId[] = [],
): TLShapeId[] {
  if (previousIds.length) {
    const existing = previousIds.filter((id) => editor.getShape(id))
    if (existing.length) editor.deleteShapes(existing)
  }

  const created: TLShapeId[] = []
  const idMap = new Map<string, TLShapeId>()
  let autoIndex = 0

  editor.run(() => {
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

      const id = createShapeId()
      idMap.set(el.id, id)
      created.push(id)

      if (el.type === 'text') {
        editor.createShape({
          id,
          type: 'text',
          x,
          y,
          props: {
            richText: toRichText(el.text ?? ''),
            ...(el.color ? { color: el.color } : {}),
            ...(el.size ? { size: el.size } : {}),
          },
        })
      } else if (el.type === 'note') {
        editor.createShape({
          id,
          type: 'note',
          x,
          y,
          props: {
            richText: toRichText(el.text ?? ''),
            ...(el.color ? { color: el.color } : {}),
            ...(el.size ? { size: el.size } : {}),
          },
        })
      } else {
        editor.createShape({
          id,
          type: 'geo',
          x,
          y,
          props: {
            geo: el.geo ?? 'rectangle',
            w: el.w ?? 200,
            h: el.h ?? 120,
            richText: toRichText(el.text ?? ''),
            align: 'middle',
            verticalAlign: 'middle',
            ...(el.color ? { color: el.color } : {}),
            ...(el.fill ? { fill: el.fill } : {}),
            ...(el.size ? { size: el.size } : {}),
          },
        })
      }
    }

    // Pass 2: connectors (arrows bound to nodes).
    for (const el of elements) {
      if (el.type !== 'connector') continue
      const fromId = el.from ? idMap.get(el.from) : undefined
      const toId = el.to ? idMap.get(el.to) : undefined
      if (!fromId || !toId) continue

      const arrowId = createShapeId()
      created.push(arrowId)
      editor.createShape({
        id: arrowId,
        type: 'arrow',
        props: {
          text: el.text ?? '',
          ...(el.color ? { color: el.color } : {}),
          ...(el.size ? { size: el.size } : {}),
        },
      })
      editor.createBindings([
        {
          fromId: arrowId,
          toId: fromId,
          type: 'arrow',
          props: { terminal: 'start', normalizedAnchor: { x: 0.5, y: 0.5 }, isExact: false, isPrecise: false },
        },
        {
          fromId: arrowId,
          toId: toId,
          type: 'arrow',
          props: { terminal: 'end', normalizedAnchor: { x: 0.5, y: 0.5 }, isExact: false, isPrecise: false },
        },
      ])
    }
  })

  if (created.length) {
    editor.zoomToFit({ animation: { duration: 250 } })
  }

  return created
}
