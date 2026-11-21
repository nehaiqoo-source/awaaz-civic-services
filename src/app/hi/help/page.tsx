import type { Metadata } from 'next'
import { GuideIndex } from '@/components/GuidePage'

export const metadata: Metadata = {
  title: 'सरकारी सेवाओं के लिए आसान गाइड',
  description: 'शिकायत कहाँ करें, क्या तैयार रखें और फॉर्म कैसे भरें: पेंशन, राशन, सड़क, पानी, RTI और बहुत कुछ, आसान भाषा में। टाइप करने की जगह बोलिए।',
  alternates: { canonical: '/hi/help', languages: { en: '/help', hi: '/hi/help', 'x-default': '/help' } },
}

export default function Page() {
  return <GuideIndex lang="hi" />
}
