// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { normalizeEmail, normalizePhone } from '@/lib/fill/normalize'
import type { FieldDescriptor } from '@/lib/fill/schema'
import { FillSession, firstValid, listenLang, type SessionEvent } from '../overlay/session'
import { combineAlternatives, type ListenHandle, type ListenOptions, type VoiceIO } from '../overlay/voice'

const field = (type: FieldDescriptor['type'], extra: Partial<FieldDescriptor> = {}): FieldDescriptor =>
  ({ id: 'f', label: 'x', type, required: false, ...extra }) as FieldDescriptor

describe('spoken digits', () => {
  it('reads English digit names written in Devanagari (Hindi mode)', () => {
    expect(normalizePhone('नाइन एट सेवन सिक्स फाइव फोर थ्री टू वन ज़ीरो')).toBe('9876543210')
  })
  it('reads sound-alikes from English recognition', () => {
    expect(normalizePhone('nine ate seven six five for three to one zero')).toBe('9876543210')
  })
  it('mixes Hindi, English and digits', () => {
    expect(normalizePhone('98 डबल सात 6 पाँच four 3 two 1')).toBe('9877654321')
  })
})

describe('spoken email', () => {
  it('understands common domains written by Hindi recognition', () => {
    expect(normalizeEmail('asha एट द रेट जीमेल डॉट कॉम')).toBe('asha@gmail.com')
  })
  it('still understands English', () => {
    expect(normalizeEmail('asha dot k at the rate yahoo dot com')).toBe('asha.k@yahoo.com')
  })
})

describe('alternatives', () => {
  it('joins the k-th guess of every segment, without duplicates', () => {
    expect(combineAlternatives([['nine eight', '98'], ['seven']])).toEqual(['nine eight seven', '98 seven'])
    expect(combineAlternatives([])).toEqual([])
  })
  it('takes the first guess that is valid for the field', () => {
    expect(firstValid(field('tel'), ['my number is nine', '9876543210'])).toBe('9876543210')
    expect(firstValid(field('text'), ['Asha', 'Usha'])).toBe('Asha')
    expect(firstValid(field('tel'), ['hello'])).toBeNull()
  })
  it('listens in English for email fields only', () => {
    expect(listenLang(field('email'), 'hi-IN')).toBe('en-IN')
    expect(listenLang(field('text'), 'hi-IN')).toBe('hi-IN')
  })
})

describe('session uses alternatives', () => {
  it('fills the phone number from a lower-ranked guess and asks email in English', async () => {
    document.body.innerHTML = `<form>
      <label for="m">Mobile number</label><input id="m" type="tel">
      <label for="e">Email</label><input id="e" type="email">
    </form>`
    const langs: string[] = []
    const answers: Array<{ text: string; alts: string[] }> = [
      { text: 'mobile number', alts: ['mobile number', '9876543210'] },
      { text: 'asha at gmail dot com', alts: [] },
    ]
    const voice: VoiceIO = {
      speak: async () => {},
      cancelSpeech() {},
      listen(options: ListenOptions): ListenHandle {
        langs.push(options.lang)
        expect(options.endSilenceMs).toBeGreaterThan(0)
        const next = answers.shift() ?? { text: '', alts: [] }
        return { result: Promise.resolve(next.text), stop() {}, alternatives: () => next.alts }
      },
    }
    const events: SessionEvent[] = []
    const session = new FillSession({ doc: document, voice, transport: async () => ({ values: {} }) as never, lang: 'hi-IN', allowServer: false, onEvent: (e) => events.push(e) })
    await session.runGuided()
    expect((document.getElementById('m') as HTMLInputElement).value).toBe('9876543210')
    expect((document.getElementById('e') as HTMLInputElement).value).toBe('asha@gmail.com')
    expect(langs).toEqual(['hi-IN', 'en-IN'])
  })
})
