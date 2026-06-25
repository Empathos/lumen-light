import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import type { ExcalidrawElementSkeleton } from '@excalidraw/excalidraw/data/transform'
import type { FlowDiagram, FlowNodeKind } from '../assistant/types'
import { commitSkeleton, connectorPoints, type Rect } from './excalidrawScene'

const NODE_W = 220
const NODE_H = 90
const GAP_Y = 150
const ORIGIN_X = 240
const ORIGIN_Y = 120

type GeoType = 'rectangle' | 'diamond' | 'ellipse'

function geoFor(kind: FlowNodeKind): GeoType {
  switch (kind) {
    case 'decision':
      return 'diamond'
    case 'start':
    case 'end':
      return 'ellipse'
    default:
      return 'rectangle'
  }
}

const skeletonId = (id: string) => `lumen-${id}`

/**
 * Project a FlowDiagram onto the Excalidraw canvas.
 *
 * The canvas is a *view* of assistant output, never the source of truth, so each
 * redraw replaces the previous assistant projection (tracked via `customData`)
 * while leaving anything the user drew by hand untouched.
 */
export function drawFlowDiagram(
  api: ExcalidrawImperativeAPI,
  diagram: FlowDiagram,
): number {
  const skeleton: ExcalidrawElementSkeleton[] = []
  const rects = new Map<string, Rect>()

  diagram.nodes.forEach((node, i) => {
    const rect: Rect = { x: ORIGIN_X, y: ORIGIN_Y + i * GAP_Y, w: NODE_W, h: NODE_H }
    rects.set(node.id, rect)
    skeleton.push({
      type: geoFor(node.kind),
      id: skeletonId(node.id),
      x: rect.x,
      y: rect.y,
      width: rect.w,
      height: rect.h,
      strokeColor: '#1e1e1e',
      label: { text: node.label },
    })
  })

  diagram.edges.forEach((edge) => {
    const from = rects.get(edge.from)
    const to = rects.get(edge.to)
    if (!from || !to) return
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
      strokeColor: '#1e1e1e',
      start: { id: skeletonId(edge.from) },
      end: { id: skeletonId(edge.to) },
      ...(edge.label ? { label: { text: edge.label } } : {}),
    })
  })

  return commitSkeleton(api, skeleton)
}
