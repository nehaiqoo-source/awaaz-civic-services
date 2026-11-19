import { describe, expect, it, vi } from 'vitest'
import type { HostEvent } from '../mobile/src/generated/bridge-protocol'
import { createHostController, type HostDeps, type SpeechPort } from '../mobile/src/host-controller'
import { isAllowedApiBase } from '../mobile/src/api-base'
import { isAllowedNavigation, normalizeUrl } from '../mobile/src/url'
import { readFileSync } from 'node:fs'

type StartOptions = Parameters<SpeechPort['start']>[0]

function setup(armed = true) {
  const events: HostEvent[] = []
  let started: StartOptions | undefined
  const speech: SpeechPort = { start: vi.fn((o) => { started = o }), stop: vi.fn(), abort: vi.fn() }
  const tts = { speak: vi.fn((_t: string, _l: string, done: () => void) => done()), stop: vi.fn() }
  const fill = vi.fn<(r: unknown) => Promise<unknown>>(async () => ({ values: {} }))
  const act = vi.fn<(r: unknown) => Promise<unknown>>(async () => ({ actions: [], source: 'none' }))
  const state = { armed }
  const deps: HostDeps = { speech, tts, fill, act, send: (e) => events.push(e), isArmed: () => state.armed }
  return { controller: createHostController(deps), events, speech, tts, fill, act, state, opts: () => started }
}
const listen = (id = 1) => JSON.stringify({ id, type: 'listen', lang: 'hi-IN', continuous: false, timeoutMs: 8000 })

describe('host controller: act', () => {
  it('forwards act requests only while armed, and reports results and errors', async () => {
    const off = setup(false)
    off.controller.handle(JSON.stringify({ id: 1, type: 'act', request: {} }))
    expect(off.act).not.toHaveBeenCalled()
    expect(off.events).toEqual([{ id: 1, type: 'actError', code: 'server' }])

    const on = setup()
    on.controller.handle(JSON.stringify({ id: 2, type: 'act', request: { transcript: 'hi' } }))
    await Promise.resolve()
    await Promise.resolve()
    expect(on.act).toHaveBeenCalledWith({ transcript: 'hi' })
    expect(on.events).toEqual([{ id: 2, type: 'actResult', result: { actions: [], source: 'none' } }])
    on.act.mockRejectedValueOnce(new Error('rate_limited'))
    on.controller.handle(JSON.stringify({ id: 3, type: 'act', request: {} }))
    await Promise.resolve()
    await Promise.resolve()
    expect(on.events.at(-1)).toEqual({ id: 3, type: 'actError', code: 'rate_limited' })
  })
})

describe('host controller', () => {
  it('ignores garbage and invalid messages', () => {
    const t = setup()
    t.controller.handle('not json')
    t.controller.handle(JSON.stringify({ id: 1, type: 'rm -rf' }))
    expect(t.speech.start).not.toHaveBeenCalled()
    expect(t.events).toEqual([])
  })

  it('refuses everything while not armed, but answers so the page never hangs', () => {
    const t = setup(false)
    t.controller.handle(listen(1))
    t.controller.handle(JSON.stringify({ id: 2, type: 'speak', text: 'hi', lang: 'en-IN' }))
    t.controller.handle(JSON.stringify({ id: 3, type: 'fill', request: {} }))
    expect(t.speech.start).not.toHaveBeenCalled()
    expect(t.tts.speak).not.toHaveBeenCalled()
    expect(t.fill).not.toHaveBeenCalled()
    expect(t.events).toEqual([
      { id: 1, type: 'error', code: 'not-allowed' },
      { id: 2, type: 'spoken' },
      { id: 3, type: 'fillError', code: 'server' },
    ])
  })

  it('returns the final transcript and forwards interim text', () => {
    const t = setup()
    t.controller.handle(listen(5))
    t.opts()?.onInterim('namas')
    t.opts()?.onFinal('namaste')
    t.opts()?.onEnd()
    expect(t.events).toEqual([{ id: 5, type: 'interim', text: 'namas' }, { id: 5, type: 'result', text: 'namaste' }])
  })

  it('reports an error code, or no-speech, when nothing was heard', () => {
    const t = setup()
    t.controller.handle(listen(1))
    t.opts()?.onError('network')
    t.opts()?.onEnd()
    t.controller.handle(listen(2))
    t.opts()?.onEnd()
    expect(t.events).toEqual([{ id: 1, type: 'error', code: 'network' }, { id: 2, type: 'error', code: 'no-speech' }])
  })

  it('a new listen aborts the previous one and stale events are dropped', () => {
    const t = setup()
    t.controller.handle(listen(1))
    const first = t.opts()
    t.controller.handle(listen(2))
    expect(t.speech.abort).toHaveBeenCalled()
    first?.onFinal('old')
    first?.onEnd()
    expect(t.events).toEqual([])
  })

  it('disarm stops the microphone and speech', () => {
    const t = setup()
    t.controller.handle(listen(1))
    t.controller.disarm()
    expect(t.speech.abort).toHaveBeenCalled()
    expect(t.tts.stop).toHaveBeenCalled()
  })

  it('speaks and confirms', () => {
    const t = setup()
    t.controller.handle(JSON.stringify({ id: 9, type: 'speak', text: 'Aapka naam?', lang: 'hi-IN' }))
    expect(t.tts.speak).toHaveBeenCalledWith('Aapka naam?', 'hi-IN', expect.any(Function))
    expect(t.events).toEqual([{ id: 9, type: 'spoken' }])
  })

  it('proxies fill and maps failures', async () => {
    const t = setup()
    t.controller.handle(JSON.stringify({ id: 1, type: 'fill', request: { a: 1 } }))
    await vi.waitFor(() => expect(t.events).toHaveLength(1))
    expect(t.events[0]).toEqual({ id: 1, type: 'fillResult', result: { values: {} } })
    t.fill.mockRejectedValueOnce(new Error('rate_limited'))
    t.controller.handle(JSON.stringify({ id: 2, type: 'fill', request: {} }))
    await vi.waitFor(() => expect(t.events).toHaveLength(2))
    expect(t.events[1]).toEqual({ id: 2, type: 'fillError', code: 'rate_limited' })
  })

  it('rate limits fill requests', () => {
    const t = setup()
    for (let i = 0; i < 61; i++) t.controller.handle(JSON.stringify({ id: i, type: 'fill', request: {} }))
    expect(t.fill).toHaveBeenCalledTimes(60)
    expect(t.events.at(-1)).toEqual({ id: 60, type: 'fillError', code: 'rate_limited' })
  })
})

describe('mobile url + api base rules', () => {
  it('normalizes typed addresses and rejects dangerous schemes', () => {
    expect(normalizeUrl('example.gov.in/form')).toBe('https://example.gov.in/form')
    expect(normalizeUrl('http://localhost:3000/demo-form')).toBe('http://localhost:3000/demo-form')
    for (const bad of ['javascript:alert(1)', 'file:///etc/passwd', 'intent://x#Intent;end', 'data:text/html,hi', '', 'two words', 'https://u:p@a.com', 'nodots'])
      expect(normalizeUrl(bad), bad).toBeNull()
    expect(isAllowedNavigation('https://a.com')).toBe(true)
    expect(isAllowedNavigation('intent://x')).toBe(false)
  })

  it('allows plain http for the API only in dev', () => {
    expect(isAllowedApiBase('https://api.example.com', false)).toBe(true)
    expect(isAllowedApiBase('http://10.0.2.2:3000', false)).toBe(false)
    expect(isAllowedApiBase('http://10.0.2.2:3000', true)).toBe(true)
    expect(isAllowedApiBase('ftp://x.com', true)).toBe(false)
  })
})

describe('generated copies', () => {
  it('protocol copy in the mobile app matches the source', () => {
    const src = readFileSync('overlay/bridge-protocol.ts', 'utf8')
    const copy = readFileSync('mobile/src/generated/bridge-protocol.ts', 'utf8')
    expect(copy.endsWith(src)).toBe(true)
  })
})
