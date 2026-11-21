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
    title: guide.title.en,
    description: guide.description.en,
    keywords: guide.keywords.en,
    alternates: {
      canonical: guidePath(guide.slug, 'en'),
      languages: { en: guidePath(guide.slug, 'en'), hi: guidePath(guide.slug, 'hi'), 'x-default': guidePath(guide.slug, 'en') },
    },
    openGraph: { title: guide.title.en, description: guide.description.en, type: 'article', locale: 'en_IN' },
  }
}

export default async function Page({ params }: Props) {
  const guide = getGuide((await params).slug)
  if (!guide) notFound()
  return <GuidePage guide={guide} lang="en" />
}
