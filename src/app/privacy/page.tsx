import type { Metadata } from 'next'
import { ISSUES_URL } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'What Awaaz collects, what it does not, and how to ask for your complaint to be deleted.',
  alternates: { canonical: '/privacy' },
}

const UPDATED = '21 November 2026'

export default function Privacy() {
  return (
    <main>
      <header className="hero">
        <p className="eyebrow">Privacy · गोपनीयता</p>
        <h1>Privacy policy</h1>
        <p className="lede">Awaaz is an independent project, not run by any government body. Last updated {UPDATED}.</p>
      </header>

      <section className="card">
        <h2>In short</h2>
        <ul>
          <li>No account, no sign-up, no ads, no analytics, no tracking cookies.</li>
          <li>The microphone is used only while you tap the mic and speak. Awaaz does not listen in the background.</li>
          <li>Awaaz never asks for or fills passwords, OTPs, Aadhaar, PAN or bank numbers.</li>
          <li>Awaaz never submits a form for you. You press Submit yourself.</li>
          <li>Your location is shared only if you tap &ldquo;Add my location&rdquo;.</li>
        </ul>
      </section>

      <section className="card">
        <h2>What we handle, and why</h2>
        <h3>Your voice</h3>
        <p>
          Speech is turned into text by your phone or browser&rsquo;s own speech recognition (on Android, Google&rsquo;s speech service). Awaaz receives only the
          text, not the audio. Awaaz does not store audio.
        </p>
        <h3>Form filling</h3>
        <p>
          To work out which words belong in which field, the text you spoke and the labels of the form fields are sent to the Awaaz server, which may pass them
          to an AI service (Anthropic) to match them. Password, OTP, ID-number and similar fields are excluded before anything is sent. These requests are not
          stored by Awaaz.
        </p>
        <h3>Complaints you file with Awaaz</h3>
        <p>
          When you file a complaint through Awaaz, we store what you submitted: the complaint text, its category, the place you typed, and optionally a photo and
          a location you chose to add. You get a tracking ID. Anyone who has that ID can see the complaint status, so keep it to yourself. We store it only so that
          you can track it. Awaaz is not connected to any government office and does not forward your complaint to one.
        </p>
        <h3>Photos</h3>
        <p>
          Photos are re-encoded on your device before upload, which removes hidden data such as the GPS position and the camera model. If you choose
          &ldquo;let my phone describe the photo&rdquo;, the description is produced on your device and the photo is not sent to an AI service. The photo is
          stored with the complaint only if you attach it.
        </p>
        <h3>Location</h3>
        <p>Location is requested only when you tap &ldquo;Add my location&rdquo;. It is rounded to about 11 metres before it is saved.</p>
        <h3>Saathi (finding the right service)</h3>
        <p>The sentence you speak or type is matched on our server against a fixed list of government services. It may be sent to an AI service to help rank them. It is not stored.</p>
      </section>

      <section className="card">
        <h2>Who receives data</h2>
        <ul>
          <li>Our hosting and storage provider (Vercel), which stores complaint records and photos.</li>
          <li>An AI service (Anthropic), only for the matching steps above, and only when that feature is switched on.</li>
          <li>Your device&rsquo;s speech service (for example Google on Android) for turning speech into text.</li>
        </ul>
        <p>We do not sell data and we do not share it for advertising.</p>
      </section>

      <section className="card">
        <h2>Deleting your complaint</h2>
        <p>
          To have a complaint and its photo deleted, open an issue at <a href={ISSUES_URL} rel="noopener noreferrer">our public issue page</a> and give only the tracking ID.
          Please do not post personal details there. Anyone can read that page.
        </p>
      </section>

      <section className="card">
        <h2>Children</h2>
        <p>Awaaz is not directed at children under 13 and does not knowingly collect their data.</p>
      </section>

      <section className="card">
        <h2>Changes</h2>
        <p>If this policy changes, the date at the top changes with it.</p>
      </section>
    </main>
  )
}
