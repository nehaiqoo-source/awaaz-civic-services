// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fillFields } from '@/lib/fill/fill'
import type { FillRequest } from '@/lib/fill/schema'
import { FillSession, type SessionEvent } from '../overlay/session'
import { mount, HOST_ID } from '../overlay/ui'
import { VoiceError, type ListenHandle, type VoiceIO } from '../overlay/voice'

type Answer = string | VoiceError

function fakeVoice(answers: Answer[]): VoiceIO & { spoken: string[] } {
  const spoken: string[] = []
  const queue = [...answers]
  return {
    spoken,
    speak: async (text) => {
      spoken.push(text)
    },
    cancelSpeech() {},
    listen(): ListenHandle {
      const next = queue.shift()
      const result = next instanceof VoiceError ? Promise.reject(next) : Promise.resolve(next ?? '')
      return { result, stop() {} }
    },
  }
}

// The real server-side logic, called in-process (no API key => rules engine only).
const serverTransport = (request: FillRequest) => fillFields(request)

const FORM = `
<form>
  <label for="n">Full name</label><input id="n" type="text">
  <label for="m">Mobile number</label><input id="m" type="tel">
  <label>State <select id="s"><option value="">--</option><option value="MH">Maharashtra</option><option value="MP">Madhya Pradesh</option></select></label>
  <label for="a">Aadhaar number</label><input id="a" type="text">
</form>`

let savedKey: string | undefined
beforeEach(() => {
  savedKey = process.env.ANTHROPIC_API_KEY
  delete process.env.ANTHROPIC_API_KEY
  document.body.innerHTML = FORM
})
afterEach(() => {
  if (savedKey !== undefined) process.env.ANTHROPIC_API_KEY = savedKey
  document.getElementById(HOST_ID)?.remove()
  document.getElementById(`${HOST_ID}-spacer`)?.remove()
})

const value = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement).value

function run(answers: Answer[], lang = 'hi-IN') {
  const events: SessionEvent[] = []
  const voice = fakeVoice(answers)
  const session = new FillSession({ doc: document, voice, transport: serverTransport, lang, onEvent: (e) => events.push(e) })
  return { session, events, voice }
}

describe('guided session (overlay + server logic end to end)', () => {
  it('fills name, mobile and state by voice and leaves Aadhaar for the user', async () => {
    const { session, events, voice } = run(['रमेश कुमार', 'नौ आठ सात छह पाँच चार तीन दो एक शून्य', 'madhya pradesh'])
    await session.runGuided()
    expect(value('n')).toBe('रमेश कुमार')
    expect(value('m')).toBe('9876543210')
    expect(value('s')).toBe('MP')
    expect(value('a')).toBe('')
    expect(events.some((e) => e.type === 'manual')).toBe(true)
    expect(events.at(-1)).toMatchObject({ type: 'done', filled: 3, skipped: 1, manual: ['Aadhaar number'] })
    expect(voice.spoken.some((s) => s.includes('खुद भरिए'))).toBe(true)
  })

  it('retries after silence and after an unclear answer', async () => {
    const { session, events } = run([new VoiceError('no-speech'), 'Asha', 'umm', '९८७६५४३२१०', 'maharashtra'])
    await session.runGuided()
    expect(value('n')).toBe('Asha')
    expect(value('m')).toBe('9876543210')
    expect(value('s')).toBe('MH')
    expect(events.filter((e) => e.type === 'retry').length).toBe(2)
  })

  it('stops with a clear error when the microphone is blocked', async () => {
    const { session, events } = run([new VoiceError('not-allowed')])
    await session.runGuided()
    expect(events.find((e) => e.type === 'error')).toEqual({ type: 'error', code: 'not-allowed' })
    expect(events.some((e) => e.type === 'done')).toBe(false)
  })

  it('fills what it understands on-device and stops with an error only when the server is needed and unreachable', async () => {
    const events: SessionEvent[] = []
    const session = new FillSession({
      doc: document,
      voice: fakeVoice(['Asha', '९८७६५४३२१०', 'मध्य प्रदेश']),
      transport: async () => {
        throw new Error('network')
      },
      lang: 'hi-IN',
      onEvent: (e) => events.push(e),
    })
    await session.runGuided()
    expect(value('n')).toBe('Asha')
    expect(value('m')).toBe('9876543210')
    expect(value('s')).toBe('')
    expect(events.find((e) => e.type === 'error')).toEqual({ type: 'error', code: 'network' })
  })

  it('does not contact the server at all when the local rules understand the answers', async () => {
    let calls = 0
    const session = new FillSession({
      doc: document,
      voice: fakeVoice(['Asha', '९८७६५४३२१०', 'maharashtra']),
      transport: async (r) => {
        calls += 1
        return serverTransport(r)
      },
      lang: 'hi-IN',
      onEvent: () => {},
    })
    await session.runGuided()
    expect(calls).toBe(0)
    expect(value('s')).toBe('MH')
  })

  it('on-device only mode never calls the server, retries, then skips what it cannot understand', async () => {
    let calls = 0
    const events: SessionEvent[] = []
    const session = new FillSession({
      doc: document,
      voice: fakeVoice(['Asha', '९८७६५४३२१०', 'मध्य प्रदेश', 'मध्य प्रदेश', 'मध्य प्रदेश']),
      transport: async (r) => {
        calls += 1
        return serverTransport(r)
      },
      lang: 'hi-IN',
      allowServer: false,
      onEvent: (e) => events.push(e),
    })
    await session.runGuided()
    expect(calls).toBe(0)
    expect(value('s')).toBe('')
    expect(events.some((e) => e.type === 'skipped')).toBe(true)
    expect(events.at(-1)).toMatchObject({ type: 'done', filled: 2 })
  })

  it('"say everything" is refused in on-device only mode', async () => {
    const events: SessionEvent[] = []
    const session = new FillSession({ doc: document, voice: fakeVoice(['x']), transport: serverTransport, lang: 'hi-IN', allowServer: false, onEvent: (e) => events.push(e) })
    await session.runBatch()
    expect(events.find((e) => e.type === 'error')).toEqual({ type: 'error', code: 'offline_mode' })
  })

  it('supports undo of the last filled field', async () => {
    const { session } = run(['Asha', '९८७६५४३२१०', 'maharashtra'])
    await session.runGuided()
    session.undo()
    expect(value('s')).toBe('')
    expect(value('m')).toBe('9876543210')
  })

  it('reports that "say everything" needs the AI when no key is configured', async () => {
    const { session, events } = run(['my name is Asha and my mobile is 9876543210'])
    await session.runBatch()
    expect(events.find((e) => e.type === 'error')).toEqual({ type: 'error', code: 'ai_unavailable' })
    expect(value('n')).toBe('')
  })

  it('speaks English prompts for English and Hindi prompts for Hindi', async () => {
    const en = run(['Asha', '9876543210', 'maharashtra'], 'en-IN')
    await en.session.runGuided()
    expect(en.voice.spoken[0]).toBe('Please say: Full name')
    document.body.innerHTML = FORM
    const hi = run(['Asha', '9876543210', 'maharashtra'], 'hi-IN')
    await hi.session.runGuided()
    expect(hi.voice.spoken[0]).toBe('कृपया बताइए: Full name')
  })
})

describe('panel UI', () => {
  it('renders page-controlled labels as text, never as HTML', async () => {
    document.body.innerHTML = '<label for="x">Name <img src=x onerror="window.__pwned=1"></label><input id="x" type="text">'
    mount(window, { voice: fakeVoice(['Asha']), transport: serverTransport })
    const shadow = document.getElementById(HOST_ID)?.shadowRoot
    expect(shadow).toBeTruthy()
    const primary = shadow?.querySelector('button.primary') as HTMLButtonElement
    primary.click()
    await new Promise((r) => setTimeout(r, 50))
    expect(shadow?.querySelectorAll('img').length).toBe(0)
    expect((window as unknown as { __pwned?: number }).__pwned).toBeUndefined()
    expect(shadow?.textContent).toContain('Asha')
  })

  it('shows an error and re-enables the buttons if the voice layer throws unexpectedly', async () => {
    const broken: VoiceIO = { ...fakeVoice([]), speak: () => Promise.reject(new Error('boom')) }
    mount(window, { voice: broken, transport: serverTransport })
    const shadow = document.getElementById(HOST_ID)?.shadowRoot
    const primary = shadow?.querySelector('button.primary') as HTMLButtonElement
    primary.click()
    await new Promise((r) => setTimeout(r, 50))
    expect(shadow?.querySelector('.error')?.textContent).toContain('Something went wrong')
    expect(primary.disabled).toBe(false)
  })

  it('shows only the relevant buttons per state and can be minimized', async () => {
    document.body.innerHTML = '<label for="x">Name</label><input id="x" type="text">'
    mount(window, { voice: fakeVoice(['Asha']), transport: serverTransport })
    const shadow = document.getElementById(HOST_ID)?.shadowRoot
    const panel = shadow?.querySelector('.panel') as HTMLElement
    expect(panel.dataset.state).toBe('idle')
    ;(shadow?.querySelector('button.primary') as HTMLButtonElement).click()
    expect(panel.dataset.state).toBe('running')
    await new Promise((r) => setTimeout(r, 50))
    expect(panel.dataset.state).toBe('done')
    const min = shadow?.querySelector('.min-btn') as HTMLButtonElement
    min.click()
    expect(panel.classList.contains('min')).toBe(true)
    expect(min.getAttribute('aria-expanded')).toBe('false')
    min.click()
    expect(panel.classList.contains('min')).toBe(false)
  })

  it('adds a spacer so the page end stays reachable, and removes it on close', () => {
    mount(window, { voice: fakeVoice([]), transport: serverTransport })
    expect(document.getElementById(`${HOST_ID}-spacer`)).toBeTruthy()
    ;(document.getElementById(HOST_ID)?.shadowRoot?.querySelector('.close') as HTMLButtonElement).click()
    expect(document.getElementById(HOST_ID)).toBeNull()
    expect(document.getElementById(`${HOST_ID}-spacer`)).toBeNull()
  })

  it('mounting twice toggles the panel off', () => {
    mount(window, { voice: fakeVoice([]), transport: serverTransport })
    expect(document.getElementById(HOST_ID)).toBeTruthy()
    mount(window, { voice: fakeVoice([]), transport: serverTransport })
    expect(document.getElementById(HOST_ID)).toBeNull()
  })
})
