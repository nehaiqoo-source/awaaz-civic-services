import { BookmarkletInstall } from '@/components/BookmarkletInstall'

export const metadata = {
  title: 'Awaaz on your phone: one-tap bookmarklet',
  description: 'Fill government forms by voice on any phone browser, without installing anything.',
  alternates: { canonical: '/mobile' },
}

export default function MobilePage() {
  return (
    <main>
      <header className="hero">
        <p className="eyebrow">Phone and any browser</p>
        <h1>Awaaz on your phone</h1>
        <p className="lede">
          Phones cannot install most extensions, so Awaaz also works as a bookmark. Open the form, tap the bookmark, and answer by voice.
        </p>
      </header>

      <BookmarkletInstall />

      <section className="card" aria-labelledby="use-title">
        <h2 id="use-title">2. Use it on a form</h2>
        <ol className="steps">
          <li>Open the service website and its form.</li>
          <li>
            Run the bookmark. On Chrome for Android, type the bookmark name in the address bar and choose it from the suggestions.
            On Safari (iPhone), open the Bookmarks list and tap it.
          </li>
          <li>Allow the microphone when asked, pick your language, and tap Start.</li>
        </ol>
      </section>

      <section className="card" aria-labelledby="limits-title">
        <h2 id="limits-title">Good to know</h2>
        <ul className="steps">
          <li>Some websites block bookmarks from loading outside scripts (strict security policy). There, use the desktop extension.</li>
          <li>Voice recognition comes from your browser. Chrome on Android works best; Safari support for Indian languages varies.</li>
          <li>Forms inside embedded frames or behind a native app cannot be read.</li>
        </ul>
      </section>
    </main>
  )
}
