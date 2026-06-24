export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'closed'

export interface RealtimeCallbacks {
  onStatus?: (status: RealtimeStatus, detail?: string) => void
  onUserTranscript?: (text: string) => void
  onAssistantTranscript?: (text: string) => void
  onToolCall?: (name: string, args: unknown, callId: string) => Promise<unknown> | unknown
  onError?: (message: string) => void
  onMic?: (enabled: boolean) => void
}

interface RealtimeServerEvent {
  type: string
  transcript?: string
  name?: string
  arguments?: string
  call_id?: string
  error?: { message?: string }
  [key: string]: unknown
}

const TOKEN_ENDPOINT = '/api/realtime/token'
const CALLS_ENDPOINT = 'https://api.openai.com/v1/realtime/calls'

/**
 * Browser WebRTC client for the OpenAI Realtime API.
 *
 * Flow: fetch an ephemeral token from our server -> open a WebRTC peer
 * connection (mic in, model audio out, data channel for events) -> POST the SDP
 * offer to OpenAI with the ephemeral token. Both voice and typed text are sent
 * through the same session and produce the same tool calls.
 */
export class RealtimeClient {
  private pc?: RTCPeerConnection
  private dc?: RTCDataChannel
  private audioEl?: HTMLAudioElement
  private micStream?: MediaStream
  private status: RealtimeStatus = 'idle'

  constructor(private readonly callbacks: RealtimeCallbacks = {}) {}

  get state(): RealtimeStatus {
    return this.status
  }

  private setStatus(status: RealtimeStatus, detail?: string) {
    this.status = status
    this.callbacks.onStatus?.(status, detail)
  }

  async connect(): Promise<void> {
    if (this.status === 'connecting' || this.status === 'connected') return
    this.setStatus('connecting')

    try {
      const tokenRes = await fetch(TOKEN_ENDPOINT)
      const tokenText = await tokenRes.text()
      if (!tokenRes.ok) throw new Error(`token request failed (${tokenRes.status}): ${tokenText}`)
      const tokenData = JSON.parse(tokenText) as { value?: string }
      const ephemeralKey = tokenData.value
      if (!ephemeralKey) throw new Error('No ephemeral token in response')

      const pc = new RTCPeerConnection()
      this.pc = pc

      const audioEl = document.createElement('audio')
      audioEl.autoplay = true
      audioEl.style.display = 'none'
      document.body.appendChild(audioEl)
      this.audioEl = audioEl
      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0]
      }

      try {
        const mic = await navigator.mediaDevices.getUserMedia({ audio: true })
        this.micStream = mic
        mic.getTracks().forEach((track) => pc.addTrack(track, mic))
        this.callbacks.onMic?.(true)
      } catch {
        // No mic access: still receive the model's audio and drive via text.
        pc.addTransceiver('audio', { direction: 'recvonly' })
        this.callbacks.onMic?.(false)
      }

      const dc = pc.createDataChannel('oai-events')
      this.dc = dc
      dc.addEventListener('open', () => this.setStatus('connected'))
      dc.addEventListener('message', (e) => this.handleEvent(e.data))

      pc.addEventListener('connectionstatechange', () => {
        if (pc.connectionState === 'failed') {
          this.setStatus('error', 'connection failed')
        } else if (pc.connectionState === 'closed') {
          this.setStatus('closed')
        }
      })

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      const sdpRes = await fetch(CALLS_ENDPOINT, {
        method: 'POST',
        body: offer.sdp ?? '',
        headers: {
          Authorization: `Bearer ${ephemeralKey}`,
          'Content-Type': 'application/sdp',
        },
      })
      if (!sdpRes.ok) throw new Error(`SDP exchange failed (${sdpRes.status}): ${await sdpRes.text()}`)

      const answerSdp = await sdpRes.text()
      await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      this.setStatus('error', message)
      this.callbacks.onError?.(message)
      this.cleanup()
    }
  }

  /** Send a typed message into the same realtime session and ask for a response. */
  sendText(text: string): boolean {
    if (!this.dc || this.dc.readyState !== 'open') return false
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    })
    this.send({ type: 'response.create' })
    return true
  }

  disconnect(): void {
    this.cleanup()
    this.setStatus('closed')
  }

  private send(event: Record<string, unknown>) {
    if (this.dc && this.dc.readyState === 'open') {
      this.dc.send(JSON.stringify(event))
    }
  }

  private async handleEvent(raw: string) {
    let event: RealtimeServerEvent
    try {
      event = JSON.parse(raw) as RealtimeServerEvent
    } catch {
      return
    }

    if (event.type === 'conversation.item.input_audio_transcription.completed') {
      if (event.transcript) this.callbacks.onUserTranscript?.(event.transcript)
      return
    }

    // Assistant spoken-output transcript (event name has varied across versions).
    if (event.type.endsWith('audio_transcript.done')) {
      if (event.transcript) this.callbacks.onAssistantTranscript?.(event.transcript)
      return
    }

    if (event.type === 'response.function_call_arguments.done') {
      await this.handleFunctionCall(event)
      return
    }

    if (event.type === 'error') {
      this.callbacks.onError?.(event.error?.message ?? 'Realtime error')
    }
  }

  private async handleFunctionCall(event: RealtimeServerEvent) {
    const { name, call_id: callId } = event
    if (!name || !callId) return

    let args: unknown = {}
    try {
      args = event.arguments ? JSON.parse(event.arguments) : {}
    } catch {
      args = {}
    }

    let result: unknown = { ok: true }
    try {
      result = (await this.callbacks.onToolCall?.(name, args, callId)) ?? { ok: true }
    } catch (err) {
      result = { ok: false, error: err instanceof Error ? err.message : String(err) }
    }

    // A tool may return an `image` data URL (e.g. capture_canvas). The function
    // output itself must be text, so we strip the image out of the JSON ack and
    // attach it separately as an input_image the model can actually see.
    let image: string | undefined
    if (result && typeof result === 'object' && 'image' in result) {
      const record = result as Record<string, unknown>
      if (typeof record.image === 'string') image = record.image
      delete record.image
    }

    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'function_call_output',
        call_id: callId,
        output: JSON.stringify(result),
      },
    })

    if (image) {
      this.send({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: '[AUTOMATED SYSTEM MESSAGE — not from the user] This is the output of your capture_canvas tool: a screenshot of the current canvas, generated automatically by the app. The user did NOT send this; do not thank them for it or mention screenshots. Silently check the layout (overlaps, spacing, off-screen or cut-off elements, misrouted connectors) and, if anything is off, call a drawing tool again with corrected coordinates.',
            },
            { type: 'input_image', image_url: image },
          ],
        },
      })
    }

    this.send({ type: 'response.create' })
  }

  private cleanup() {
    this.micStream?.getTracks().forEach((t) => t.stop())
    this.micStream = undefined
    try {
      this.dc?.close()
    } catch {
      /* noop */
    }
    this.dc = undefined
    try {
      this.pc?.close()
    } catch {
      /* noop */
    }
    this.pc = undefined
    if (this.audioEl) {
      this.audioEl.srcObject = null
      this.audioEl.remove()
      this.audioEl = undefined
    }
  }
}
