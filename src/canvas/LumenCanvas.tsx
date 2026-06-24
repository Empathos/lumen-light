import { Tldraw, type Editor } from 'tldraw'
import 'tldraw/tldraw.css'

interface LumenCanvasProps {
  onReady: (editor: Editor) => void
}

/**
 * The main stage. TLDraw is the canvas the assistant draws onto; the user can
 * also edit it directly. We grab the editor instance on mount so the assistant
 * loop can project diagrams into it.
 */
export function LumenCanvas({ onReady }: LumenCanvasProps) {
  return (
    <div className="lumen-canvas">
      <Tldraw onMount={onReady} />
    </div>
  )
}
