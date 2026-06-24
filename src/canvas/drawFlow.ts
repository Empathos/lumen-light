import {
  createShapeId,
  toRichText,
  type Editor,
  type TLShapeId,
} from 'tldraw'
import type { FlowDiagram, FlowNodeKind } from '../assistant/types'

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

/**
 * Project a FlowDiagram onto the TLDraw canvas.
 *
 * The canvas is a *view* of assistant output, never the source of truth, so each
 * redraw deletes the shapes from the previous projection (passed in via
 * `previousIds`) and returns the ids it created for the next call to clean up.
 * Shapes the user adds or edits by hand are left untouched.
 */
export function drawFlowDiagram(
  editor: Editor,
  diagram: FlowDiagram,
  previousIds: TLShapeId[] = [],
): TLShapeId[] {
  if (previousIds.length) {
    const existing = previousIds.filter((id) => editor.getShape(id))
    if (existing.length) editor.deleteShapes(existing)
  }

  const createdIds: TLShapeId[] = []
  const nodeShapeIds = new Map<string, TLShapeId>()

  editor.run(() => {
    diagram.nodes.forEach((node, i) => {
      const id = createShapeId()
      nodeShapeIds.set(node.id, id)
      createdIds.push(id)
      editor.createShape({
        id,
        type: 'geo',
        x: ORIGIN_X,
        y: ORIGIN_Y + i * GAP_Y,
        props: {
          geo: geoFor(node.kind),
          w: NODE_W,
          h: NODE_H,
          richText: toRichText(node.label),
          align: 'middle',
          verticalAlign: 'middle',
          size: 's',
        },
      })
    })

    diagram.edges.forEach((edge) => {
      const fromId = nodeShapeIds.get(edge.from)
      const toId = nodeShapeIds.get(edge.to)
      if (!fromId || !toId) return

      const arrowId = createShapeId()
      createdIds.push(arrowId)
      editor.createShape({
        id: arrowId,
        type: 'arrow',
        props: {
          // NOTE: in this tldraw version the arrow shape uses a plain `text`
          // string for its label, while geo shapes use `richText`.
          text: edge.label ?? '',
          size: 's',
        },
      })

      editor.createBindings([
        {
          fromId: arrowId,
          toId: fromId,
          type: 'arrow',
          props: {
            terminal: 'start',
            normalizedAnchor: { x: 0.5, y: 1 },
            isExact: false,
            isPrecise: false,
          },
        },
        {
          fromId: arrowId,
          toId: toId,
          type: 'arrow',
          props: {
            terminal: 'end',
            normalizedAnchor: { x: 0.5, y: 0 },
            isExact: false,
            isPrecise: false,
          },
        },
      ])
    })
  })

  if (createdIds.length) {
    editor.zoomToFit({ animation: { duration: 250 } })
  }

  return createdIds
}
