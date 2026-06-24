import { useState, type FormEvent, type KeyboardEvent } from 'react'
import type { ConversationEntry } from '../assistant/types'
import type { RealtimeStatus } from '../realtime/RealtimeClient'

interface ConversationPanelProps {
  messages: ConversationEntry[]
  busy: boolean
  status: RealtimeStatus
  micOn: boolean
  onToggleSession: () => void
  onSend: (text: string) => void
}

const STATUS_LABEL: Record<RealtimeStatus, string> = {
  idle: 'Offline',
  connecting: 'Connecting…',
  connected: 'Live',
  error: 'Error',
  closed: 'Offline',
}

export function ConversationPanel({
  messages,
  busy,
  status,
  micOn,
  onToggleSession,
  onSend,
}: ConversationPanelProps) {
  const [draft, setDraft] = useState('')
  const connected = status === 'connected'
  const connecting = status === 'connecting'

  function submit() {
    const text = draft.trim()
    if (!text || busy) return
    onSend(text)
    setDraft('')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    submit()
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <aside className="conversation-panel">
      <header className="conversation-header">
        <span className="brand-dot" />
        <div className="brand-text">
          <h1>Lumen Light</h1>
          <p>Talk or type — I'll diagram it.</p>
        </div>
        <span className={`status-pill ${status}`}>
          <span className="status-dot" />
          {STATUS_LABEL[status]}
        </span>
      </header>

      <div className="session-bar">
        <button
          type="button"
          className={`session-btn ${connected ? 'live' : ''}`}
          onClick={onToggleSession}
          disabled={connecting}
        >
          {connected ? 'End voice session' : connecting ? 'Connecting…' : 'Start voice session'}
        </button>
        {connected && (
          <span className="mic-state">{micOn ? '🎙 mic on' : 'no mic — text only'}</span>
        )}
      </div>

      <div className="conversation-log">
        {messages.length === 0 && (
          <div className="empty-hint">
            <p>Start a voice session and think out loud, or type below.</p>
            <p className="example">
              Try: <code>research -&gt; draft -&gt; review -&gt; ship</code>
            </p>
            <p className="muted">
              The realtime model is the product path. Local typed input is only
              a development aid for exercising the canvas loop.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.text}
          </div>
        ))}
        {busy && <div className="bubble assistant pending">…</div>}
      </div>

      <form className="composer" onSubmit={handleSubmit}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={connected ? 'Type to the live agent…' : 'Type an idea or steps…'}
          rows={3}
        />
        <button type="submit" disabled={busy || !draft.trim()}>
          Send
        </button>
      </form>
    </aside>
  )
}
