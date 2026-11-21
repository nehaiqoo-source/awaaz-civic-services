import Link from 'next/link'

export const metadata = { title: 'Page not found', robots: { index: false } }

export default function NotFound() {
  return (
    <main>
      <header className="hero">
        <p className="eyebrow">404</p>
        <h1>This page does not exist</h1>
        <p className="lede">The link may be old or mistyped. यह पेज नहीं मिला। लिंक पुराना या ग़लत हो सकता है।</p>
        <div className="cta-row">
          <Link className="cta cta-primary" href="/">Go to home · होम पर जाएँ</Link>
          <Link className="cta cta-ghost" href="/saathi">Ask Saathi · साथी से पूछें</Link>
        </div>
      </header>
    </main>
  )
}
