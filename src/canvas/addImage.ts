import { convertToExcalidrawElements, getCommonBounds } from '@excalidraw/excalidraw'
import type {
  ExcalidrawImperativeAPI,
  BinaryFileData,
  DataURL,
} from '@excalidraw/excalidraw/types'
import type { FileId } from '@excalidraw/excalidraw/element/types'

/**
 * Drop a generated image onto the Excalidraw canvas as a real image element.
 *
 * Unlike the diagram tools, generated images are treated as durable assets: they
 * are NOT tagged `customData.lumen`, so a subsequent draw_canvas/draw_flow (which
 * clears the assistant's projection) leaves them in place.
 */

const MAX_DIM = 360

function naturalSize(dataURL: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth || 512, h: img.naturalHeight || 512 })
    img.onerror = () => resolve({ w: 512, h: 512 })
    img.src = dataURL
  })
}

let imageCounter = 0

export async function addImageToCanvas(
  api: ExcalidrawImperativeAPI,
  dataURL: string,
  opts?: { x?: number; y?: number },
): Promise<{ width: number; height: number }> {
  const { w, h } = await naturalSize(dataURL)
  const scale = Math.min(1, MAX_DIM / Math.max(w, h))
  const width = Math.round(w * scale)
  const height = Math.round(h * scale)

  const mimeMatch = dataURL.match(/^data:([^;]+);/)
  const mimeType = (mimeMatch?.[1] ?? 'image/png') as BinaryFileData['mimeType']
  const fileId = `lumen-img-${Date.now()}-${imageCounter++}` as FileId
  const file: BinaryFileData = {
    id: fileId,
    dataURL: dataURL as DataURL,
    mimeType,
    created: Date.now(),
  }
  api.addFiles([file])

  const existing = api.getSceneElements()
  let { x, y } = opts ?? {}
  if (x === undefined || y === undefined) {
    // Auto-place just to the right of whatever is already on the canvas.
    if (existing.length) {
      const [, minY, maxX] = getCommonBounds(existing)
      x = maxX + 60
      y = minY
    } else {
      x = 120
      y = 120
    }
  }

  const created = convertToExcalidrawElements([
    { type: 'image', x, y, fileId, width, height, status: 'saved' },
  ])
  api.updateScene({ elements: [...existing, ...created] })
  api.scrollToContent(created, { fitToContent: true, animate: true, duration: 250 })

  return { width, height }
}
