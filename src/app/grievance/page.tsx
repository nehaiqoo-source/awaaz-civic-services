import { GrievanceFlow } from '@/components/GrievanceFlow'
import { TrackForm } from '@/components/TrackForm'

export default function GrievancePage() {
  return (
    <main>
      <header className="hero">
        <p className="eyebrow">Demo · Grievance filing</p>
        <h1>File a complaint by voice</h1>
        <p className="lede">
          No forms. Speak your problem in your own language and we turn it into a complaint you can track.
        </p>
      </header>
      <GrievanceFlow />
      <TrackForm />
    </main>
  )
}
