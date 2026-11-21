import { DemoForm } from '@/components/DemoForm'
import { LoadAwaazButton } from '@/components/LoadAwaazButton'

export const metadata = { title: 'Demo form', robots: { index: false, follow: true } }

export default function DemoFormPage() {
  return (
    <main>
      <header className="hero">
        <p className="eyebrow">Demo</p>
        <h1>Fill a form by voice</h1>
        <p className="lede">Tap the button, then answer each question aloud. Nothing here is stored.</p>
        <LoadAwaazButton />
      </header>
      <DemoForm />
    </main>
  )
}
