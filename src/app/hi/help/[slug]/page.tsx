import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GuidePage } from '@/components/GuidePage'
import { GUIDES, getGuide, guidePath } from '@/lib/seo/guides'

type Props = { params: Promise<{ slug: string }> }

export const dynamicParams = false
export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const guide = getGuide((await params).slug)
  if (!guide) return {}
  return {
    title: guide.title.hi,
    description: guide.description.hi,
    keywords: guide.keywords.hi,
    alternates: {
      canonical: guidePath(guide.slug, 'hi'),
      languages: { en: guidePath(guide.slug, 'en'), hi: guidePath(guide.slug, 'hi'), 'x-default': guidePath(guide.slug, 'en') },
    },
    openGraph: { title: guide.title.hi, description: guide.description.hi, type: 'article', locale: 'hi_IN' },
  }
}

export default async function Page({ params }: Props) {
  const guide = getGuide((await params).slug)
  if (!guide) notFound()
  return <GuidePage guide={guide} lang="hi" />
}
