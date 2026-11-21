import { SaathiChat } from '@/components/SaathiChat'
import { SaathiFlow } from '@/components/SaathiFlow'

export const metadata = {
  title: 'Saathi: say your problem, find the right government service',
  description: 'Not sure which form or portal? Say your problem in Hindi or English and Saathi names the right service, what to keep ready and the official link.',
  alternates: { canonical: '/saathi' },
}

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
      <SaathiChat />
      <details className="card classic">
        <summary>Prefer one long message? Use the classic box · एक बार में लिखना है?</summary>
        <SaathiFlow />
      </details>
    </main>
  )
}
