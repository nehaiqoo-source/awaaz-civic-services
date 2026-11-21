import { ImageResponse } from 'next/og'

export const alt = 'Awaaz: voice-based grievance filling'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: 80, background: 'linear-gradient(135deg,#ff9933,#c2410c)', color: 'white',
        }}
      >
        <div style={{ fontSize: 40, opacity: 0.9, display: 'flex' }}>Awaaz</div>
        <div style={{ fontSize: 78, fontWeight: 800, lineHeight: 1.1, marginTop: 16, display: 'flex' }}>Civic services: voice-based grievance filling</div>
        <div style={{ fontSize: 38, marginTop: 28, opacity: 0.95, display: 'flex' }}>Public services for people who can’t fill a form.</div>
        <div style={{ fontSize: 30, marginTop: 40, opacity: 0.9, display: 'flex' }}>www.awaaz.help</div>
      </div>
    ),
    size,
  )
}
