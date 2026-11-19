import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Awaaz · Civic services: voice-based grievance filling',
  description: 'Public services for people who can’t fill a form. File a grievance or fill any service form by speaking in your own language.',
  icons: { icon: '/icon-192.png', apple: '/icon-180.png' },
  appleWebApp: { capable: true, title: 'Awaaz', statusBarStyle: 'default' },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#ff7a1a' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
