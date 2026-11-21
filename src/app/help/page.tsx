import type { Metadata } from 'next'
import { GuideIndex } from '@/components/GuidePage'

export const metadata: Metadata = {
  title: 'Simple guides to public services in India',
  description: 'Where to complain, what to keep ready and how to fill the form: pension, ration, roads, water, RTI and more, in plain words. Speak instead of typing.',
  alternates: { canonical: '/help', languages: { en: '/help', hi: '/hi/help', 'x-default': '/help' } },
}

export default function Page() {
  return <GuideIndex lang="en" />
}
