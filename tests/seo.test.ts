import { describe, expect, it } from 'vitest'
import { GUIDES, getGuide, guidePath, serviceFor } from '@/lib/seo/guides'
import { isAllowedServiceUrl } from '@/lib/saathi/catalog'
import sitemap from '@/app/sitemap'
import robots from '@/app/robots'
import { guideJsonLd } from '@/components/GuidePage'

describe('SEO guides', () => {
  it('has unique slugs and non-empty bilingual text', () => {
    expect(new Set(GUIDES.map((g) => g.slug)).size).toBe(GUIDES.length)
    for (const g of GUIDES) {
      for (const l of ['en', 'hi'] as const) {
        expect(g.title[l].length).toBeGreaterThan(5)
        expect(g.description[l].length).toBeGreaterThan(30)
        expect(g.description[l].length).toBeLessThan(320)
        expect(g.steps[l].length).toBeGreaterThan(2)
        expect(g.steps[l].length).toBe(g.steps.en.length)
        expect(g.keywords[l].length).toBeGreaterThan(1)
      }
      expect(/^[a-z0-9-]+$/.test(g.slug)).toBe(true)
    }
  })

  it('every guide resolves to a real catalog service with an allowed URL', () => {
    for (const g of GUIDES) {
      const s = serviceFor(g)
      if (g.serviceId === null) expect(s).toBeUndefined()
      else expect(isAllowedServiceUrl(s!.url)).toBe(true)
    }
  })

  it('does not invent phone numbers or timelines', () => {
    for (const g of GUIDES) {
      const all = JSON.stringify(g)
      expect(all).not.toMatch(/\b1800\b|\b\d{4}-\d{3,}\b/)
      expect(all).not.toMatch(/within \d+ days|\d+ दिन में/)
    }
  })

  it('sitemap lists every guide in both languages, with absolute URLs', () => {
    const urls = sitemap().map((e) => e.url)
    for (const g of GUIDES) {
      expect(urls).toContain(`https://www.awaaz.help${guidePath(g.slug, 'en')}`)
      expect(urls).toContain(`https://www.awaaz.help${guidePath(g.slug, 'hi')}`)
    }
    expect(urls.every((u) => u.startsWith('https://www.awaaz.help/'))).toBe(true)
    expect(urls.some((u) => u.includes('/api/') || u.includes('demo-form'))).toBe(false)
  })

  it('robots blocks the API and points at the sitemap', () => {
    const r = robots()
    expect(JSON.stringify(r.rules)).toContain('/api/')
    expect(r.sitemap).toBe('https://www.awaaz.help/sitemap.xml')
  })

  it('structured data includes FAQ only when the guide has FAQs', () => {
    const withFaq = GUIDES.find((g) => g.faqs.length)!
    const without = GUIDES.find((g) => !g.faqs.length)!
    expect(JSON.stringify(guideJsonLd(withFaq, 'en'))).toContain('FAQPage')
    expect(JSON.stringify(guideJsonLd(without, 'hi'))).not.toContain('FAQPage')
    expect(getGuide('nope')).toBeUndefined()
  })
})
