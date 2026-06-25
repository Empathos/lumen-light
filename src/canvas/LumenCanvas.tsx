import { Excalidraw } from '@excalidraw/excalidraw'
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types'
import '@excalidraw/excalidraw/index.css'

interface LumenCanvasProps {
  onReady: (api: ExcalidrawImperativeAPI) => void
}

/**
 * The main stage. Excalidraw is the canvas the assistant draws onto; the user
 * can also edit it directly. We grab the imperative API on mount so the
 * assistant loop can project diagrams into it.
 */
export function LumenCanvas({ onReady }: LumenCanvasProps) {
  return (
    <div className="lumen-canvas">
      <Excalidraw
        excalidrawAPI={onReady}
        initialData={{ appState: { viewBackgroundColor: '#ffffff' } }}
      />
    </div>
  )
}
