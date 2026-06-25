import { convertToExcalidrawElements } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import type { ExcalidrawElementSkeleton } from '@excalidraw/excalidraw/data/transform'

/**
 * Shared Excalidraw plumbing for the assistant draw tools.
 *
 * The canvas is a *view* of assistant output, not the source of truth. Every
 * assistant-created element is tagged with `customData.lumen` so a redraw can
 * remove the previous projection while leaving anything the user drew by hand
 * untouched.
 */

const LUMEN_TAG = 'lumen'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

interface Point {
  x: number
  y: number
}

/** Intersection of the ray from a rect's center toward `toward` with its border. */
function borderPoint(rect: Rect, toward: Point): Point {
  const cx = rect.x + rect.w / 2
  const cy = rect.y + rect.h / 2
  const dx = toward.x - cx
  const dy = toward.y - cy
  if (dx === 0 && dy === 0) return { x: cx, y: cy }
  const hw = rect.w / 2
  const hh = rect.h / 2
  const scale = 1 / Math.max(Math.abs(dx) / hw, Math.abs(dy) / hh)
  return { x: cx + dx * scale, y: cy + dy * scale }
}

/**
 * Border-to-border endpoints for a connector between two rectangles.
 * `convertToExcalidrawElements` records arrow bindings but does NOT route the
 * geometry, so we compute explicit points here and keep the bindings for
 * interactive dragging.
 */
export function connectorPoints(from: Rect, to: Rect): { start: Point; end: Point } {
  const fromCenter = { x: from.x + from.w / 2, y: from.y + from.h / 2 }
  const toCenter = { x: to.x + to.w / 2, y: to.y + to.h / 2 }
  return {
    start: borderPoint(from, toCenter),
    end: borderPoint(to, fromCenter),
  }
}

function isLumenElement(el: { customData?: Record<string, unknown> | null }): boolean {
  return el.customData?.[LUMEN_TAG] === true
}

/**
 * Convert a skeleton, tag everything it produced (containers + auto-generated
 * bound labels), drop the previous assistant projection, and commit. Returns
 * the number of elements added.
 */
export function commitSkeleton(
  api: ExcalidrawImperativeAPI,
  skeleton: ExcalidrawElementSkeleton[],
): number {
  if (skeleton.length === 0) return 0

  const created = convertToExcalidrawElements(skeleton, { regenerateIds: false })
  const tagged = created.map((el) => ({
    ...el,
    customData: { ...(el.customData ?? {}), [LUMEN_TAG]: true },
  }))

  const kept = api.getSceneElements().filter((el) => !isLumenElement(el))
  api.updateScene({ elements: [...kept, ...tagged] })

  if (tagged.length) {
    api.scrollToContent(tagged, { fitToContent: true, animate: true, duration: 250 })
  }
  return tagged.length
}
