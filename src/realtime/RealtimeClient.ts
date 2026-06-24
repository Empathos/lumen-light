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
  delta?: string
  backchannel_id?: string
  error?: { message?: string }
  [key: string]: unknown
}

/** Inworld backchannel audio is PCM16 mono at this rate (session output format default). */
const BACKCHANNEL_SAMPLE_RATE = 24000

const ICE_ENDPOINT = '/api/realtime/ice'
const CALL_ENDPOINT = '/api/realtime/call'
const SESSION_ENDPOINT = '/api/realtime/session'

/**
 * Browser WebRTC client for the Inworld Realtime API.
 *
 * Flow: fetch ICE servers from our server -> open a WebRTC peer connection (mic
 * in, model audio out, data channel for events) -> POST the SDP offer to our
 * server, which attaches the session config and forwards it to Inworld with the
 * server-held API key. Both voice and typed text are sent through the same
 * session and produce the same tool calls.
 */
export class RealtimeClient {
  private pc?: RTCPeerConnection
  private dc?: RTCDataChannel
  private audioEl?: HTMLAudioElement
  private micStream?: MediaStream
  private status: RealtimeStatus = 'idle'
  private sessionConfig?: Record<string, unknown>
  // Web Audio path for backchannel interjections ("mm-hm" while the user talks).
  // These arrive as base64 PCM over the data channel, NOT on the WebRTC audio
  // track, so we decode and schedule them ourselves. They are deliberately not
  // ducked, so they stay audible while the user holds the floor.
  private audioCtx?: AudioContext
  private backchannelNextTime = 0

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

    // connect() is triggered by a user click, so creating the AudioContext here
    // satisfies browser autoplay policy for backchannel playback.
    try {
      type AudioCtor = typeof AudioContext
      const Ctor: AudioCtor | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext
      if (Ctor) {
        this.audioCtx = new Ctor()
        this.backchannelNextTime = 0
      }
    } catch {
      /* backchannel playback simply won't run */
    }

    try {
      const iceRes = await fetch(ICE_ENDPOINT)
      const iceText = await iceRes.text()
      if (!iceRes.ok) throw new Error(`ICE request failed (${iceRes.status}): ${iceText}`)
      const iceData = JSON.parse(iceText) as { ice_servers?: RTCIceServer[] }
      const iceServers = iceData.ice_servers ?? []

      // Inworld starts every call with a default persona and may greet on its
      // own. Grab our Lumen session config now so we can apply it the instant
      // the data channel opens, before the default config can run loose.
      try {
        const sessionRes = await fetch(SESSION_ENDPOINT)
        if (sessionRes.ok) {
          this.sessionConfig = (await sessionRes.json()) as Record<string, unknown>
        }
      } catch {
        // Non-fatal: connection still works, just with default config.
      }

      const pc = new RTCPeerConnection({ iceServers })
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
      dc.addEventListener('open', () => {
        // Silence any default greeting that started under the default persona...
        this.send({ type: 'response.cancel' })
        this.send({ type: 'output_audio_buffer.clear' })
        // ...then become Lumen for the rest of the session. Drop the read-only
        // top-level `type` so the update isn't rejected.
        if (this.sessionConfig) {
          const { type: _drop, ...session } = this.sessionConfig
          this.send({ type: 'session.update', session })
        }
        this.setStatus('connected')
      })
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

      const sdpRes = await fetch(CALL_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify({ sdp: offer.sdp ?? '' }),
        headers: { 'Content-Type': 'application/json' },
      })
      if (!sdpRes.ok) throw new Error(`SDP exchange failed (${sdpRes.status}): ${await sdpRes.text()}`)

      const answer = JSON.parse(await sdpRes.text()) as { sdp?: string }
      if (!answer.sdp) throw new Error('No SDP answer in response')
      await pc.setRemoteDescription({ type: 'answer', sdp: answer.sdp })
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

    if (event.type === 'response.backchannel.audio.delta') {
      if (typeof event.delta === 'string') this.playBackchannelChunk(event.delta)
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

  /** Decode one base64 PCM16 backchannel chunk and schedule it gapless. */
  private playBackchannelChunk(b64: string) {
    const ctx = this.audioCtx
    if (!ctx) return
    try {
      if (ctx.state === 'suspended') void ctx.resume()
      const binary = atob(b64)
      const byteLen = binary.length
      const bytes = new Uint8Array(byteLen)
      for (let i = 0; i < byteLen; i++) bytes[i] = binary.charCodeAt(i)

      const sampleCount = Math.floor(byteLen / 2)
      if (sampleCount === 0) return
      const view = new DataView(bytes.buffer)
      const samples = new Float32Array(sampleCount)
      for (let i = 0; i < sampleCount; i++) {
        // PCM16 little-endian -> normalized float.
        samples[i] = view.getInt16(i * 2, true) / 32768
      }

      const buffer = ctx.createBuffer(1, sampleCount, BACKCHANNEL_SAMPLE_RATE)
      buffer.copyToChannel(samples, 0)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)

      const startAt = Math.max(ctx.currentTime, this.backchannelNextTime)
      source.start(startAt)
      this.backchannelNextTime = startAt + buffer.duration
    } catch {
      /* drop malformed chunk */
    }
  }

  private cleanup() {
    if (this.audioCtx) {
      void this.audioCtx.close().catch(() => {})
      this.audioCtx = undefined
    }
    this.backchannelNextTime = 0
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
