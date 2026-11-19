import { SaathiFlow } from '@/components/SaathiFlow'

export const metadata = { title: 'Awaaz Saathi · Which service do I need?' }

export default function SaathiPage() {
  return (
    <main>
      <header className="hero">
        <p className="eyebrow">Saathi · साथी</p>
        <h1>Not sure which form? Just say your problem.</h1>
        <p className="lede">
          Say it in your own words, like &ldquo;pension has not come for three months&rdquo; or &ldquo;there is a pothole in our street&rdquo;. Saathi points you to the right
          government service, tells you what to keep ready, and helps you fill it by voice.
        </p>
      </header>
      <SaathiFlow />
    </main>
  )
}
