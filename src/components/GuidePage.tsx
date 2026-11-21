import Link from 'next/link'
import { SITE_URL } from '@/lib/site'
import { GUIDES, guidePath, serviceFor, type Guide, type Lang } from '@/lib/seo/guides'
import { isAllowedServiceUrl } from '@/lib/saathi/catalog'

const T = {
  en: {
    eyebrow: 'Help guide',
    steps: 'What to do',
    ready: 'Keep these ready',
    faq: 'Common questions',
    start: 'Say it by voice',
    startNote: 'Free. No account. You press Submit yourself.',
    official: 'Open the official site',
    officialNote: 'Opens a government website. Awaaz does not send anything there for you.',
    install: 'Get Awaaz on your device',
    more: 'More guides',
    otherLang: 'हिंदी में पढ़ें',
    saathi: 'Not sure which service? Ask Saathi',
    disclaimer: 'Awaaz is an independent project, not a government service.',
  },
  hi: {
    eyebrow: 'मदद गाइड',
    steps: 'क्या करें',
    ready: 'ये तैयार रखें',
    faq: 'आम सवाल',
    start: 'बोलकर बताइए',
    startNote: 'मुफ़्त। कोई अकाउंट नहीं। Submit आप खुद दबाते हैं।',
    official: 'सरकारी साइट खोलें',
    officialNote: 'यह सरकारी वेबसाइट खोलता है। Awaaz आपकी तरफ़ से वहाँ कुछ नहीं भेजता।',
    install: 'अपने डिवाइस पर Awaaz लें',
    more: 'और गाइड',
    otherLang: 'Read in English',
    saathi: 'कौन सी सेवा चाहिए, पता नहीं? साथी से पूछें',
    disclaimer: 'Awaaz एक स्वतंत्र प्रोजेक्ट है, सरकारी सेवा नहीं।',
  },
} as const

export function guideJsonLd(guide: Guide, lang: Lang) {
  const url = `${SITE_URL}${guidePath(guide.slug, lang)}`
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'Article',
      headline: guide.title[lang],
      description: guide.description[lang],
      inLanguage: lang === 'hi' ? 'hi-IN' : 'en-IN',
      mainEntityOfPage: url,
      publisher: { '@type': 'Organization', name: 'Awaaz', url: SITE_URL },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Awaaz', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: lang === 'hi' ? 'मदद गाइड' : 'Help guides', item: `${SITE_URL}${lang === 'hi' ? '/hi/help' : '/help'}` },
        { '@type': 'ListItem', position: 3, name: guide.title[lang], item: url },
      ],
    },
  ]
  if (guide.faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: guide.faqs.map((f) => ({ '@type': 'Question', name: f.q[lang], acceptedAnswer: { '@type': 'Answer', text: f.a[lang] } })),
    })
  }
  return { '@context': 'https://schema.org', '@graph': graph }
}

export function GuidePage({ guide, lang }: { guide: Guide; lang: Lang }) {
  const t = T[lang]
  const service = serviceFor(guide)
  const docs = service?.documents[lang] ?? []
  const isInternal = service?.url.startsWith('/')
  const official = service && !isInternal && isAllowedServiceUrl(service.url) ? service : null
  const startHref = service && isInternal ? service.url : guide.serviceId === null ? '/install' : '/saathi'
  const startLabel = guide.serviceId === null ? t.install : t.start
  const others = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 6)

  return (
    <main lang={lang === 'hi' ? 'hi' : 'en'}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(guideJsonLd(guide, lang)).replace(/</g, '\\u003c') }} />
      <header className="hero">
        <p className="eyebrow">{t.eyebrow} · <Link href={guidePath(guide.slug, lang === 'hi' ? 'en' : 'hi')} hrefLang={lang === 'hi' ? 'en' : 'hi'}>{t.otherLang}</Link></p>
        <h1>{guide.title[lang]}</h1>
        <p className="lede">{guide.intro[lang]}</p>
        <div className="cta-row">
          <Link className="cta cta-primary" href={startHref}>{startLabel} →</Link>
          {official && (
            <a className="cta cta-ghost" href={official.url} target="_blank" rel="noopener noreferrer">{t.official} ↗</a>
          )}
        </div>
        <p className="note">{t.startNote}{official ? ` ${t.officialNote}` : ''}</p>
      </header>

      <section className="card">
        <h2>{t.steps}</h2>
        <ol>
          {guide.steps[lang].map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </section>

      {docs.length > 0 && (
        <section className="card">
          <h2>{t.ready}</h2>
          <ul>
            {docs.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </section>
      )}

      {guide.faqs.length > 0 && (
        <section className="card">
          <h2>{t.faq}</h2>
          {guide.faqs.map((f) => (
            <div key={f.q.en}>
              <h3>{f.q[lang]}</h3>
              <p>{f.a[lang]}</p>
            </div>
          ))}
        </section>
      )}

      <section className="card">
        <h2>{t.more}</h2>
        <ul className="links">
          {others.map((g) => (
            <li key={g.slug}>
              <Link href={guidePath(g.slug, lang)}>{g.title[lang]}</Link>
            </li>
          ))}
          <li>
            <Link href={lang === 'hi' ? '/hi/help' : '/help'}>{t.more} →</Link>
          </li>
          <li>
            <Link href="/saathi">{t.saathi}</Link>
          </li>
        </ul>
      </section>
      <p className="foot">{t.disclaimer}</p>
    </main>
  )
}

export function GuideIndex({ lang }: { lang: Lang }) {
  const t = T[lang]
  return (
    <main lang={lang === 'hi' ? 'hi' : 'en'}>
      <header className="hero">
        <p className="eyebrow">{t.eyebrow} · <Link href={lang === 'hi' ? '/help' : '/hi/help'} hrefLang={lang === 'hi' ? 'en' : 'hi'}>{t.otherLang}</Link></p>
        <h1>{lang === 'hi' ? 'सरकारी सेवाओं के लिए आसान गाइड' : 'Simple guides to public services'}</h1>
        <p className="lede">
          {lang === 'hi'
            ? 'शिकायत कहाँ करें, क्या तैयार रखें, फॉर्म कैसे भरें: सीधी भाषा में। बोलकर भी भर सकते हैं।'
            : 'Where to complain, what to keep ready, how to fill the form: in plain words. You can also do it by voice.'}
        </p>
      </header>
      <section className="card">
        <ul className="links">
          {GUIDES.map((g) => (
            <li key={g.slug}>
              <Link href={guidePath(g.slug, lang)}>{g.title[lang]}</Link>
              <span>{g.description[lang]}</span>
            </li>
          ))}
        </ul>
      </section>
      <p className="foot">{t.disclaimer}</p>
    </main>
  )
}
