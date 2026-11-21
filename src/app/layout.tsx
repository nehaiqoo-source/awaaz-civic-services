import type { Metadata, Viewport } from 'next'
import './globals.css'
import { SITE_URL } from '@/lib/site'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Awaaz · Fill government forms and file complaints by voice (Hindi & English)',
    template: '%s · Awaaz',
  },
  description:
    'Public services for people who can’t fill a form. Speak in Hindi, English or your own language: Awaaz fills government forms, files complaints with a tracking ID and shows which service you need. Free, no account.',
  applicationName: 'Awaaz',
  keywords: [
    'fill government form by voice', 'voice form filling Hindi', 'bolkar form bharo', 'sarkari shikayat kahan kare',
    'pension nahi aayi shikayat', 'gaddha shikayat', 'बोलकर फॉर्म भरें', 'सरकारी शिकायत कैसे करें', 'पेंशन नहीं आई शिकायत',
  ],
  alternates: { canonical: '/' },
  openGraph: { type: 'website', siteName: 'Awaaz', locale: 'en_IN', url: '/' },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
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
