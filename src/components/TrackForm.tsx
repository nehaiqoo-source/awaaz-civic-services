'use client'

import { useState } from 'react'
import { api, ApiError, type TrackingStatus } from '@/lib/api-client'
import { CATEGORY_LABELS } from '@/lib/grievance/labels'
import { CATEGORIES, type Category } from '@/lib/grievance/schema'

function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value)
}

export function TrackForm() {
  const [id, setId] = useState('')
  const [result, setResult] = useState<TrackingStatus | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setMessage(null)
    setResult(null)
    try {
      setResult(await api.track(id.trim()))
    } catch (error) {
      setMessage(error instanceof ApiError && error.status === 404 ? 'No complaint found with that ID.' : 'Could not check status. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section aria-labelledby="track-title" className="card">
      <h2 id="track-title">Track a complaint · स्थिति देखें</h2>
      <form onSubmit={handleSubmit} className="track-row">
        <label>
          Tracking ID
          <input value={id} onChange={(e) => setId(e.target.value)} placeholder="GRV-XXXXXXXX" autoCapitalize="characters" />
        </label>
        <button type="submit" className="secondary" disabled={busy || id.trim().length === 0}>
          {busy ? 'Checking…' : 'Check'}
        </button>
      </form>
      {message && <p role="alert" className="error">{message}</p>}
      {result && (
        <dl className="status">
          <dt>Status</dt>
          <dd>{result.status}</dd>
          <dt>Category</dt>
          <dd>{isCategory(result.category) ? CATEGORY_LABELS[result.category].en : result.category}</dd>
          <dt>Summary</dt>
          <dd>{result.title}</dd>
          <dt>Filed on</dt>
          <dd>{new Date(result.createdAt).toLocaleString()}</dd>
          <dt>Proof</dt>
          <dd>{[result.hasPhoto && 'Photo', result.hasLocation && 'Location'].filter(Boolean).join(' + ') || 'None attached'}</dd>
        </dl>
      )}
    </section>
  )
}
