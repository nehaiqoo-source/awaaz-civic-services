import Link from 'next/link'

export const metadata = { title: 'Get Awaaz on your device · Awaaz' }

const platforms = [
  {
    ico: '📱',
    name: 'Android phone',
    steps: ['Open this site in Chrome.', 'Tap ⋮ → "Install app" (or "Add to Home screen").', 'Awaaz opens like an app, with voice.'],
    note: 'An APK of the native app is also built for sharing; it is not on the Play Store.',
  },
  {
    ico: '🍎',
    name: 'iPhone / iPad',
    steps: ['Open this site in Safari.', 'Tap Share → "Add to Home Screen".', 'Open Awaaz from the home screen.'],
    note: 'There is no App Store app yet (it needs an Apple developer account).',
  },
  {
    ico: '💻',
    name: 'Mac',
    steps: [
      'Chrome or Edge: open this site, click the install icon in the address bar → Install.',
      'Safari 17+: File → Add to Dock.',
      'Or add the browser extension below to fill any website by voice.',
    ],
    note: 'We use the browser’s own voice recognition, which is why a browser-based app works better here than a wrapped desktop shell.',
  },
  {
    ico: '🪟',
    name: 'Windows and Linux',
    steps: ['Chrome or Edge: click the install icon in the address bar → Install.', 'Or use the extension below.'],
    note: '',
  },
] as const

export default function Install() {
  return (
    <main>
      <header className="hero">
        <p className="eyebrow">One tool, every device</p>
        <h1>
          Get <span className="grad">Awaaz</span> on your device
        </h1>
        <p className="lede">The same assistant everywhere: phone, computer and browser. Nothing is installed from a store without you choosing it.</p>
      </header>

      <section className="card">
        <h2>Install as an app</h2>
        <div className="grid3">
          {platforms.map((p) => (
            <div className="feature" key={p.name}>
              <span className="ico" aria-hidden="true">{p.ico}</span>
              <h3>{p.name}</h3>
              <ol className="docs">
                {p.steps.map((s) => <li key={s}>{s}</li>)}
              </ol>
              {p.note && <p className="note">{p.note}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Browser extension · fill any website by voice</h2>
        <ul className="links">
          <li>
            <a href="/downloads/awaaz-chrome.zip" download>Chrome, Edge, Brave (zip)</a>
            <span>Unzip, open chrome://extensions, turn on Developer mode, Load unpacked, pick the folder. Shortcut: Alt+Shift+A.</span>
          </li>
          <li>
            <a href="/downloads/awaaz-firefox.zip" download>Firefox (zip)</a>
            <span>about:debugging → This Firefox → Load Temporary Add-on → pick manifest.json inside the unzipped folder.</span>
          </li>
          <li>
            <Link href="/mobile">Bookmarklet (any browser, no install)</Link>
            <span>Works on phones too.</span>
          </li>
        </ul>
        <p className="note">The extension asks permission for each site you use it on, and only when you click it.</p>
      </section>

      <p className="foot"><Link href="/">← Home</Link></p>
    </main>
  )
}
