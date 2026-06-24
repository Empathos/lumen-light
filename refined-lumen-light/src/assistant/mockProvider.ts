import type {
  AssistantAction,
  AssistantProvider,
  AssistantTurnInput,
  FlowDiagram,
  FlowNode,
  FlowNodeKind,
} from './types'

const MAX_LABEL = 64

function truncate(text: string, max = MAX_LABEL): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean
}

/**
 * Turn free text into an ordered list of steps. Tries, in order:
 *   1. explicit arrow syntax:        "plan -> build -> ship"
 *   2. line / numbered-list / connective splits ("then", ";", newlines)
 *   3. sentence splitting as a fallback
 */
function splitSteps(text: string): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  if (/->|→/.test(trimmed)) {
    return trimmed
      .split(/->|→/)
      .map((s) => s.trim())
      .filter(Boolean)
  }

  const listLike = trimmed
    .split(/\n|;|\bthen\b|\bnext\b|\bafter that\b/i)
    .map((s) => s.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, '').trim())
    .filter(Boolean)
  if (listLike.length > 1) return listLike

  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (sentences.length > 1) return sentences

  return [trimmed]
}

function classify(label: string, index: number, total: number): FlowNodeKind {
  if (total > 1 && index === 0) return 'start'
  if (total > 1 && index === total - 1) return 'end'
  if (/\?\s*$/.test(label) || /^(if|whether|should|does|can|when)\b/i.test(label)) {
    return 'decision'
  }
  return 'process'
}

export function textToFlow(text: string): FlowDiagram {
  const steps = splitSteps(text)
  const nodes: FlowNode[] = steps.map((label, i) => ({
    id: `n${i}`,
    label: truncate(label),
    kind: classify(label, i, steps.length),
  }))
  const edges = nodes.slice(1).map((node, i) => ({
    from: nodes[i].id,
    to: node.id,
  }))
  return { nodes, edges }
}

/**
 * Deterministic local mock. This is development scaffolding for exercising the
 * canvas loop; the product path is the live realtime collaborator.
 */
export class MockAssistantProvider implements AssistantProvider {
  readonly name = 'mock'

  async respond({ userText }: AssistantTurnInput): Promise<AssistantAction[]> {
    const diagram = textToFlow(userText)
    const actions: AssistantAction[] = []

    if (diagram.nodes.length >= 2) {
      actions.push({
        type: 'message',
        text: `Mapped that into a ${diagram.nodes.length}-step flow — drawn on the canvas.`,
      })
      actions.push({ type: 'draw_flow', diagram })
    } else if (diagram.nodes.length === 1) {
      actions.push({
        type: 'message',
        text: 'Got a single idea — added it as a node. Add more steps (try "A -> B -> C") and I\'ll connect them.',
      })
      actions.push({ type: 'draw_flow', diagram })
    } else {
      actions.push({
        type: 'message',
        text: 'I couldn\'t find anything to diagram there. Try describing it as steps.',
      })
    }

    return actions
  }
}
