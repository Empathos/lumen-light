import { useCallback, useEffect, useRef, useState } from 'react'
import type { Editor, TLShapeId } from 'tldraw'
import { LumenCanvas } from './canvas/LumenCanvas'
import { drawFlowDiagram } from './canvas/drawFlow'
import { normalizeFlowDiagram } from './canvas/normalizeFlow'
import { drawCanvasElements, normalizeCanvasElements } from './canvas/drawCanvas'
import { ConversationPanel } from './ui/ConversationPanel'
import { MockAssistantProvider } from './assistant/mockProvider'
import { RealtimeClient, type RealtimeStatus } from './realtime/RealtimeClient'
import type { ConversationEntry } from './assistant/types'

export function App() {
  const editorRef = useRef<Editor | null>(null)
  const drawnIdsRef = useRef<TLShapeId[]>([])
  const mockRef = useRef(new MockAssistantProvider())
  const clientRef = useRef<RealtimeClient | null>(null)

  const [messages, setMessages] = useState<ConversationEntry[]>([])
  const [status, setStatus] = useState<RealtimeStatus>('idle')
  const [micOn, setMicOn] = useState(false)
  const [busy, setBusy] = useState(false)

  const addMessage = useCallback((entry: ConversationEntry) => {
    setMessages((prev) => [...prev, entry])
  }, [])

  const handleReady = useCallback((editor: Editor) => {
    editorRef.current = editor
  }, [])

  const drawFlowFromArgs = useCallback((args: unknown) => {
    if (!editorRef.current) return { ok: false, error: 'canvas not ready' }
    const diagram = normalizeFlowDiagram(args)
    if (diagram.nodes.length === 0) return { ok: false, error: 'no nodes' }
    drawnIdsRef.current = drawFlowDiagram(editorRef.current, diagram, drawnIdsRef.current)
    return { ok: true, nodes: diagram.nodes.length, edges: diagram.edges.length }
  }, [])

  const drawCanvasFromArgs = useCallback((args: unknown) => {
    if (!editorRef.current) return { ok: false, error: 'canvas not ready' }
    const elements = normalizeCanvasElements(args)
    if (elements.length === 0) return { ok: false, error: 'no elements' }
    drawnIdsRef.current = drawCanvasElements(editorRef.current, elements, drawnIdsRef.current)
    return { ok: true, elements: elements.length }
  }, [])

  const captureCanvas = useCallback(async () => {
    const editor = editorRef.current
    if (!editor) return { ok: false, error: 'canvas not ready' }
    const ids = [...editor.getCurrentPageShapeIds()]
    if (ids.length === 0) return { ok: true, empty: true, note: 'canvas is empty' }
    try {
      const { blob } = await editor.toImage(ids, {
        format: 'png',
        background: true,
        padding: 32,
        pixelRatio: 1,
      })
      const image = await blobToDataUrl(blob)
      return { ok: true, image }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  }, [])

  // Dev-only hook so the rich canvas tool can be exercised without a live
  // (paid, mic-gated) realtime session. Mirrors what the model's draw_canvas
  // tool call does. Available as window.__lumenDrawCanvas(elements) in dev.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const w = window as unknown as Record<string, unknown>
    w.__lumenDrawCanvas = (elements: unknown) => drawCanvasFromArgs({ elements })
    w.__lumenCapture = () => captureCanvas()
  }, [drawCanvasFromArgs, captureCanvas])

  const connect = useCallback(() => {
    if (clientRef.current) return
    const client = new RealtimeClient({
      onStatus: (s) => setStatus(s),
      onMic: (enabled) => setMicOn(enabled),
      onUserTranscript: (text) => addMessage({ role: 'user', text }),
      onAssistantTranscript: (text) => addMessage({ role: 'assistant', text }),
      onError: (message) => addMessage({ role: 'assistant', text: `[error] ${message}` }),
      onToolCall: (name, args) => {
        if (name === 'draw_canvas') return drawCanvasFromArgs(args)
        if (name === 'draw_flow') return drawFlowFromArgs(args)
        if (name === 'capture_canvas') return captureCanvas()
        return { ok: false, error: `unknown tool: ${name}` }
      },
    })
    clientRef.current = client
    void client.connect()
  }, [addMessage, captureCanvas, drawCanvasFromArgs, drawFlowFromArgs])

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect()
    clientRef.current = null
    setMicOn(false)
    setStatus('closed')
  }, [])

  const toggleSession = useCallback(() => {
    if (clientRef.current) disconnect()
    else connect()
  }, [connect, disconnect])

  // Text input routes through the live session when connected. Outside a
  // session, the local mock only exercises the canvas loop during development.
  const handleSend = useCallback(
    async (text: string) => {
      addMessage({ role: 'user', text })

      const client = clientRef.current
      if (client && client.state === 'connected') {
        client.sendText(text)
        return
      }

      setBusy(true)
      try {
        const actions = await mockRef.current.respond({ userText: text, history: messages })
        for (const action of actions) {
          if (action.type === 'message') {
            addMessage({ role: 'assistant', text: action.text })
          } else if (action.type === 'draw_flow') {
            drawFlowFromArgs(action.diagram)
          }
        }
      } finally {
        setBusy(false)
      }
    },
    [addMessage, drawFlowFromArgs, messages],
  )

  return (
    <div className="app">
      <main className="canvas-wrap">
        <LumenCanvas onReady={handleReady} />
      </main>
      <ConversationPanel
        messages={messages}
        busy={busy}
        status={status}
        micOn={micOn}
        onToggleSession={toggleSession}
        onSend={handleSend}
      />
    </div>
  )
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob'))
    reader.readAsDataURL(blob)
  })
}
