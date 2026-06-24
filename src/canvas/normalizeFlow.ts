import type { FlowDiagram, FlowEdge, FlowNode, FlowNodeKind } from '../assistant/types'

const KINDS: FlowNodeKind[] = ['start', 'process', 'decision', 'end']

function asKind(value: unknown): FlowNodeKind {
  return KINDS.includes(value as FlowNodeKind) ? (value as FlowNodeKind) : 'process'
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value)
}

/**
 * Coerce arbitrary tool-call arguments into a valid FlowDiagram. The realtime
 * model is well-behaved with the JSON schema, but we never trust raw input that
 * is about to mutate the canvas, so we validate and drop anything malformed.
 */
export function normalizeFlowDiagram(raw: unknown): FlowDiagram {
  const obj = (raw ?? {}) as Record<string, unknown>

  const rawNodes = Array.isArray(obj.nodes) ? obj.nodes : []
  const nodes: FlowNode[] = []
  const seenIds = new Set<string>()

  for (const item of rawNodes) {
    if (!item || typeof item !== 'object') continue
    const n = item as Record<string, unknown>
    const id = asString(n.id).trim()
    const label = asString(n.label).trim()
    if (!id || seenIds.has(id)) continue
    seenIds.add(id)
    nodes.push({ id, label: label || id, kind: asKind(n.kind) })
  }

  const rawEdges = Array.isArray(obj.edges) ? obj.edges : []
  const edges: FlowEdge[] = []
  for (const item of rawEdges) {
    if (!item || typeof item !== 'object') continue
    const e = item as Record<string, unknown>
    const from = asString(e.from).trim()
    const to = asString(e.to).trim()
    if (!seenIds.has(from) || !seenIds.has(to)) continue
    const label = asString(e.label).trim()
    edges.push(label ? { from, to, label } : { from, to })
  }

  const title = asString(obj.title).trim()
  return title ? { title, nodes, edges } : { nodes, edges }
}
