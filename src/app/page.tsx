import Link from 'next/link'
import { SITE_URL } from '@/lib/site'
import { GUIDES, guidePath } from '@/lib/seo/guides'

const JSON_LD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      name: 'Awaaz',
      url: SITE_URL,
      description: 'Voice-based grievance filling and government form filling for people who can’t fill a form.',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Android, iOS, Windows, macOS, Linux (browser)',
      inLanguage: ['hi-IN', 'en-IN'],
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'INR' },
    },
    { '@type': 'Organization', name: 'Awaaz', url: SITE_URL, logo: `${SITE_URL}/icon-512.png` },
    { '@type': 'WebSite', name: 'Awaaz', url: SITE_URL },
  ],
}

export default function Home() {
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      <header className="hero">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
          </span>
          Awaaz · आवाज़
        </div>
        <div className="tricolor" aria-hidden="true" />
        <p className="eyebrow">Civic services · नागरिक सेवाएँ</p>
        <h1>
          Civic services: <span className="grad">voice&#8209;based grievance filling</span>
        </h1>
        <p className="tagline">Public services for people who can&rsquo;t fill a form.</p>
        <p className="lede">
          Speak in your own language. Awaaz asks each question aloud, listens, and fills the form for you. You check it and press
          Submit yourself. Beyond forms, say &ldquo;scroll down&rdquo; or &ldquo;open Track complaint&rdquo; and it does it, only with the
          permissions you give.
        </p>
        <p className="lede" lang="hi">
          अपनी भाषा में बोलिए, Awaaz सरकारी फॉर्म भर देता है और शिकायत दर्ज करने में मदद करता है। पेंशन नहीं आई, सड़क पर गड्ढा, राशन की दिक्कत: बोलकर बताइए।
        </p>
        <div className="cta-row">
          <Link className="cta cta-primary" href="/demo-form">Try the demo →</Link>
          <Link className="cta cta-ghost" href="/saathi">Not sure which form? Ask Saathi</Link>
        </div>
        <ul className="chips" aria-label="Highlights">
          <li>Hindi, English &amp; more</li>
          <li>Works on any form</li>
          <li>You press Submit yourself</li>
          <li>No passwords or OTPs, ever</li>
        </ul>
      </header>

      <section className="card" aria-labelledby="how">
        <h2 id="how">How it works · कैसे काम करता है</h2>
        <div className="grid3">
          <div className="feature">
            <span className="ico" aria-hidden="true">🗣️</span>
            <h3>Speak</h3>
            <p>Answer each question aloud in Hindi, English or another Indian language.</p>
          </div>
          <div className="feature">
            <span className="ico" aria-hidden="true">✍️</span>
            <h3>It fills</h3>
            <p>Names, numbers, dates and dropdown choices are understood and filled in.</p>
          </div>
          <div className="feature">
            <span className="ico" aria-hidden="true">✅</span>
            <h3>You submit</h3>
            <p>You read everything first, then press Submit yourself.</p>
          </div>
        </div>
        <p className="note">
          Passwords, OTPs, CAPTCHAs, Aadhaar, PAN and bank numbers are never filled: you type those yourself.
        </p>
      </section>

      <section className="card" aria-labelledby="try">
        <h2 id="try">Try it · आज़माएँ</h2>
        <ul className="links">
          <li>
            <Link href="/saathi">Saathi: say your problem, get the right service</Link>
            <span>Names the right government service, what to keep ready, and the official link.</span>
          </li>
          <li>
            <Link href="/demo-form">Demo form</Link>
            <span>A sample service form with the assistant built in.</span>
          </li>
          <li>
            <Link href="/mobile">Phone and any browser</Link>
            <span>One-tap bookmarklet. Works on websites without installing anything.</span>
          </li>
          <li>
            <Link href="/help">Help guides · मदद गाइड</Link>
            <span>Pension, ration, roads, water, RTI and more: where to go and what to keep ready.</span>
          </li>
          <li>
            <Link href="/grievance">Standalone grievance filing</Link>
            <span>Speak a complaint, add a photo and location as proof, get a tracking ID.</span>
          </li>
        </ul>
        <p className="note">
          <Link href="/install">Install on Android, iPhone, Mac, Windows or as a browser extension →</Link>
        </p>
        <p className="note">
          Desktop: load the Chrome/Edge extension from <code>extension/dist/chrome</code> (see README).
        </p>
      </section>

      <section className="card" aria-labelledby="guides">
        <h2 id="guides">Popular guides · लोकप्रिय गाइड</h2>
        <ul className="links">
          {GUIDES.slice(0, 6).map((g) => (
            <li key={g.slug}>
              <Link href={guidePath(g.slug, 'en')}>{g.title.en}</Link>
              <span lang="hi">{g.title.hi}</span>
            </li>
          ))}
        </ul>
        <p className="note">
          <Link href="/help">All guides</Link> · <Link href="/hi/help">सभी गाइड (हिंदी)</Link>
        </p>
      </section>

      <p className="foot">
        Built for India Runs on Voice · Civic services track · <Link href="/privacy">Privacy</Link> · <Link href="/hi/help">हिंदी गाइड</Link>
      </p>
    </main>
  )
}
