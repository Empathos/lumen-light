/**
 * The Lumen assistant contract.
 *
 * Both the text input path and the (future) OpenAI Realtime voice path produce
 * the SAME actions. The canvas only ever reacts to actions, so input modality is
 * decoupled from canvas behavior. This is the seam that lets us build over text
 * now and add voice later without redesigning anything.
 */

export type FlowNodeKind = 'start' | 'process' | 'decision' | 'end'

export interface FlowNode {
  id: string
  label: string
  kind: FlowNodeKind
}

export interface FlowEdge {
  from: string
  to: string
  label?: string
}

export interface FlowDiagram {
  title?: string
  nodes: FlowNode[]
  edges: FlowEdge[]
}

/**
 * An action the assistant asks the surface to perform. This is intentionally a
 * small, extensible discriminated union — new capabilities (highlight a source
 * passage, generate an image, etc.) become new action variants.
 */
export type AssistantAction =
  | { type: 'message'; text: string }
  | { type: 'draw_flow'; diagram: FlowDiagram }

export interface ConversationEntry {
  role: 'user' | 'assistant'
  text: string
}

export interface AssistantTurnInput {
  userText: string
  history: ConversationEntry[]
}

/**
 * A pluggable assistant backend. The mock provider is deterministic and runs
 * with no network/keys; a realtime/LLM provider can implement the same shape.
 */
export interface AssistantProvider {
  readonly name: string
  respond(input: AssistantTurnInput): Promise<AssistantAction[]>
}
