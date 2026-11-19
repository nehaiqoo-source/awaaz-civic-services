'use client'

import { loadAwaaz } from '@/lib/load-overlay'

export function LoadAwaazButton() {
  return (
    <button type="button" className="primary" onClick={loadAwaaz}>
      Open Awaaz assistant · आवाज़ से भरें
    </button>
  )
}
