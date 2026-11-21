import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { GUIDES, guidePath } from '@/lib/seo/guides'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const page = (path: string, priority: number, languages?: Record<string, string>): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority,
    ...(languages ? { alternates: { languages } } : {}),
  })
  const abs = (p: string) => `${SITE_URL}${p}`
  return [
    page('/', 1),
    page('/saathi', 0.9),
    page('/grievance', 0.8),
    page('/install', 0.8),
    page('/mobile', 0.5),
    page('/privacy', 0.3),
    page('/help', 0.8, { en: abs('/help'), hi: abs('/hi/help') }),
    page('/hi/help', 0.8, { en: abs('/help'), hi: abs('/hi/help') }),
    ...GUIDES.flatMap((g) => {
      const langs = { en: abs(guidePath(g.slug, 'en')), hi: abs(guidePath(g.slug, 'hi')) }
      return [page(guidePath(g.slug, 'en'), 0.7, langs), page(guidePath(g.slug, 'hi'), 0.7, langs)]
    }),
  ]
}
