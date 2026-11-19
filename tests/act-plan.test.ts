import { afterEach, describe, expect, it } from 'vitest'
import { planActions, planWithRules, sanitizeActions } from '@/lib/act/plan'
import { capabilityForRisk, classifyElement, needsConfirmation } from '@/lib/act/risk'
import { actRequestSchema, type ElementDescriptor } from '@/lib/act/schema'
import type { FieldDescriptor } from '@/lib/fill/schema'

const el = (id: string, label: string, extra: Partial<ElementDescriptor> = {}): ElementDescriptor => ({ id, role: 'button', label, ...extra })

describe('classifyElement', () => {
  it('lets ordinary buttons and links through', () => {
    expect(classifyElement({ label: 'Track my complaint' })).toBe('safe')
    expect(classifyElement({ label: 'ट्रैक करें' })).toBe('safe')
  })
  it('flags links that leave the site', () => {
    expect(classifyElement({ label: 'Ministry website', external: true })).toBe('external')
  })
  it('flags submit-like, destructive and auth actions as risky (English and Hindi)', () => {
    for (const label of ['Submit', 'Delete account', 'Log out', 'I agree', 'सबमिट करें', 'लॉग आउट', 'हटाएं']) {
      expect(classifyElement({ label }), label).toBe('risky')
    }
    expect(classifyElement({ label: 'Next', submit: true })).toBe('risky')
  })
  it('blocks payments, OTP, credentials, downloads and non-http schemes', () => {
    for (const label of ['Pay now', 'Buy', 'Transfer funds', 'Send OTP', 'Enter password', 'Download app', 'भुगतान करें']) {
      expect(classifyElement({ label }), label).toBe('blocked')
    }
    expect(classifyElement({ label: 'Call us', scheme: 'tel' })).toBe('blocked')
    expect(classifyElement({ label: 'Click', scheme: 'javascript' })).toBe('blocked')
    expect(classifyElement({ label: 'Report', download: true })).toBe('blocked')
  })
  it('maps risk to the capability and confirmation it needs', () => {
    expect(capabilityForRisk('safe')).toBe('click')
    expect(capabilityForRisk('external')).toBe('external')
    expect(capabilityForRisk('risky')).toBe('risky')
    expect(needsConfirmation('safe')).toBe(false)
    expect(needsConfirmation('external')).toBe(true)
    expect(needsConfirmation('risky')).toBe(true)
  })
})

describe('planWithRules', () => {
  const elements = [el('e1', 'Track complaint'), el('e2', 'File a new complaint'), el('e3', 'Contact us')]
  it('understands scroll, back, read and stop in English and Hindi', () => {
    expect(planWithRules('scroll down', elements).actions).toEqual([{ type: 'scroll', direction: 'down' }])
    expect(planWithRules('नीचे जाओ', elements).actions).toEqual([{ type: 'scroll', direction: 'down' }])
    expect(planWithRules('go to the top', elements).actions).toEqual([{ type: 'scroll', direction: 'top' }])
    expect(planWithRules('go back', elements).actions).toEqual([{ type: 'back' }])
    expect(planWithRules('पढ़ो', elements).actions).toEqual([{ type: 'read' }])
    expect(planWithRules('ruko', elements).actions).toEqual([{ type: 'stop' }])
  })
  it('clicks the uniquely matching element', () => {
    expect(planWithRules('click contact us', elements).actions).toEqual([{ type: 'click', target: 'e3' }])
    expect(planWithRules('open track complaint', elements).actions).toEqual([{ type: 'click', target: 'e1' }])
  })
  it('refuses to guess when nothing or several things match', () => {
    expect(planWithRules('click banana', elements).reason).toBe('no_match')
    expect(planWithRules('click complaint', elements).actions).toEqual([]) // ambiguous: two complaints
    expect(planWithRules('what is the weather', elements).reason).toBe('not_understood')
  })
})

describe('sanitizeActions (model output is untrusted)', () => {
  const fields: FieldDescriptor[] = [
    { id: 'f1', type: 'tel', label: 'Mobile number' },
    { id: 'f2', type: 'text', label: 'Aadhaar number' },
    { id: 'f3', type: 'select', label: 'State', options: [{ value: 'MH', label: 'Maharashtra' }] },
  ]
  const targets = { elements: [el('e1', 'Contact')], fields }

  it('drops unknown action types, bad shapes and unknown targets', () => {
    const out = sanitizeActions(
      [
        { type: 'eval', code: 'alert(1)' },
        { type: 'navigate', url: 'https://evil.example' },
        { type: 'click', target: 'e99' },
        { type: 'click' },
        'click e1',
        null,
        { type: 'scroll', direction: 'sideways' },
        { type: 'scroll', direction: 'up' },
      ],
      targets,
    )
    expect(out).toEqual([{ type: 'scroll', direction: 'up' }])
  })
  it('re-validates fill values and refuses sensitive fields', () => {
    const out = sanitizeActions(
      [
        { type: 'fill', target: 'f1', value: 'nine eight seven six five four three two one zero' },
        { type: 'fill', target: 'f2', value: '123456789012' },
        { type: 'fill', target: 'f3', value: 'Atlantis' },
        { type: 'fill', target: 'f3', value: 'Maharashtra' },
      ],
      targets,
    )
    expect(out).toEqual([
      { type: 'fill', target: 'f1', value: '9876543210' },
      { type: 'fill', target: 'f3', value: 'MH' },
    ])
  })
  it('allows at most one click and nothing after it', () => {
    const out = sanitizeActions(
      [{ type: 'scroll', direction: 'down' }, { type: 'click', target: 'e1' }, { type: 'scroll', direction: 'up' }, { type: 'click', target: 'e1' }],
      targets,
    )
    expect(out).toEqual([{ type: 'scroll', direction: 'down' }, { type: 'click', target: 'e1' }])
  })
  it('caps the number of actions', () => {
    const many = Array.from({ length: 20 }, () => ({ type: 'scroll', direction: 'down' }))
    expect(sanitizeActions(many, targets).length).toBe(5)
  })
})

describe('planActions (server)', () => {
  const saved = process.env.ANTHROPIC_API_KEY
  afterEach(() => {
    if (saved === undefined) delete process.env.ANTHROPIC_API_KEY
    else process.env.ANTHROPIC_API_KEY = saved
  })
  it('uses rules without any API key and reports when AI is needed but missing', async () => {
    delete process.env.ANTHROPIC_API_KEY
    const base = { elements: [el('e1', 'Contact us')], fields: [] }
    expect((await planActions({ ...base, transcript: 'click contact us' })).actions).toEqual([{ type: 'click', target: 'e1' }])
    const none = await planActions({ ...base, transcript: 'please file my complaint about the road' })
    expect(none).toMatchObject({ actions: [], source: 'none', reason: 'ai_unavailable' })
  })
})

describe('actRequestSchema', () => {
  it('rejects oversized or malformed requests', () => {
    expect(actRequestSchema.safeParse({ transcript: '', elements: [], fields: [] }).success).toBe(false)
    expect(actRequestSchema.safeParse({ transcript: 'x'.repeat(501), elements: [], fields: [] }).success).toBe(false)
    expect(actRequestSchema.safeParse({ transcript: 'hi', elements: [{ id: 'e1', role: 'script', label: 'x' }], fields: [] }).success).toBe(false)
    expect(actRequestSchema.safeParse({ transcript: 'hi', elements: [], fields: [] }).success).toBe(true)
  })
})
