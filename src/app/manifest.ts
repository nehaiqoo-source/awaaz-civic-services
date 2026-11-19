import type { MetadataRoute } from 'next'

/** Makes the site installable as an app on phones (Android, iOS "Add to Home Screen") and desktops (Chrome, Edge, Safari on Mac). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Awaaz · Civic services: voice-based grievance filling',
    short_name: 'Awaaz',
    description: 'Public services for people who can’t fill a form. Speak, and Awaaz fills it.',
    start_url: '/saathi',
    scope: '/',
    display: 'standalone',
    background_color: '#fff8f0',
    theme_color: '#ff7a1a',
    lang: 'en-IN',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
    shortcuts: [
      { name: 'Ask Saathi', url: '/saathi' },
      { name: 'File a complaint', url: '/grievance' },
    ],
  }
}
