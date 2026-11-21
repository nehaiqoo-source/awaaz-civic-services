'use client'

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main>
      <header className="hero">
        <p className="eyebrow">Error</p>
        <h1>Something went wrong</h1>
        <p className="lede">Please try again. कुछ गड़बड़ हो गई, कृपया फिर कोशिश करें।</p>
        <div className="cta-row">
          <button type="button" className="cta cta-primary" onClick={reset}>Try again · फिर कोशिश करें</button>
        </div>
      </header>
    </main>
  )
}
