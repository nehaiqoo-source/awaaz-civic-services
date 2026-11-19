'use client'

import { useState, useSyncExternalStore } from 'react'
import { bookmarkletFor } from '@/lib/load-overlay'

const noopSubscribe = () => () => {}

export function BookmarkletInstall() {
  const origin = useSyncExternalStore(noopSubscribe, () => window.location.origin, () => '')
  const code = origin ? bookmarkletFor(origin) : ''
  const [copied, setCopied] = useState<'yes' | 'no' | null>(null)

  // React refuses javascript: URLs as props, so the draggable link gets its href set directly on the element.
  const setLink = (node: HTMLAnchorElement | null) => {
    if (node && code) node.setAttribute('href', code)
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied('yes')
    } catch {
      setCopied('no')
    }
  }

  return (
    <section className="card" aria-labelledby="bm-title">
      <h2 id="bm-title">1. Get the Awaaz button</h2>
      <p>Desktop: drag this to your bookmarks bar.</p>
      <p>
        <a ref={setLink} className="bookmarklet" onClick={(e) => e.preventDefault()}>
          Awaaz आवाज़
        </a>
      </p>
      <p>Phone: copy the code, then save a new bookmark and paste it as the address.</p>
      <textarea readOnly rows={4} value={code} aria-label="Bookmarklet code" onFocus={(e) => e.currentTarget.select()} />
      <div className="actions">
        <button type="button" className="secondary" onClick={copy} disabled={!code}>
          Copy code
        </button>
      </div>
      {copied === 'yes' && <p role="status">Copied.</p>}
      {copied === 'no' && <p role="alert" className="error">Could not copy. Select the code above and copy it manually.</p>}
    </section>
  )
}
