// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { fillFields } from '@/lib/fill/fill'
import type { FillRequest } from '@/lib/fill/schema'
import { createBridge, type HostBridge } from '../overlay/bridge'
import { isHostEvent, isHostRequest, type HostEvent, type HostRequest } from '../overlay/bridge-protocol'
import { FillSession, type SessionEvent } from '../overlay/session'
import { VoiceError } from '../overlay/voice'

/** A fake native host: answers listen/speak/fill requests like the real mobile app would. */
function fakeHost(answers: Array<string | { error: string }>) {
  const log: HostRequest[] = []
  const queue = [...answers]
  const host: HostBridge = {
    postMessage(raw) {
      const message = JSON.parse(raw) as HostRequest
      log.push(message)
      const reply = (event: HostEvent) => setTimeout(() => window.__awaazHostReceive?.(JSON.stringify(event)), 0)
      if (message.type === 'listen') {
        const next = queue.shift()
        if (typeof next === 'string') {
          reply({ id: message.id, type: 'interim', text: next.slice(0, 2) })
          reply({ id: message.id, type: 'result', text: next })
        } else reply({ id: message.id, type: 'error', code: (next?.error ?? 'no-speech') as never })
      } else if (message.type === 'speak') reply({ id: message.id, type: 'spoken' })
      else if (message.type === 'fill') {
        void fillFields(message.request as FillRequest).then((result) => reply({ id: message.id, type: 'fillResult', result }))
      }
    },
  }
  return { host, log }
}

beforeEach(() => {
  delete window.__awaazHostReceive
  document.body.innerHTML = `<form>
    <label for="n">Full name</label><input id="n" type="text">
    <label>State <select id="s"><option value="">--</option><option value="MP">Madhya Pradesh</option></select></label>
  </form>`
})

describe('protocol guards', () => {
  it('accepts well-formed events and rejects junk', () => {
    expect(isHostEvent({ id: 1, type: 'result', text: 'hi' })).toBe(true)
    expect(isHostEvent({ id: 1, type: 'error', code: 'not-allowed' })).toBe(true)
    expect(isHostEvent({ id: 1, type: 'error', code: 'weird' })).toBe(false)
    expect(isHostEvent({ type: 'result', text: 'hi' })).toBe(false)
    expect(isHostEvent('result')).toBe(false)
  })
  it('validates page-originated requests (hosts must not trust the page)', () => {
    expect(isHostRequest({ id: 1, type: 'listen', lang: 'hi-IN', continuous: false, timeoutMs: 1000 })).toBe(true)
    expect(isHostRequest({ id: 1, type: 'speak', text: 'x'.repeat(1001), lang: 'hi-IN' })).toBe(false)
    expect(isHostRequest({ id: 1, type: 'listen', lang: 'x'.repeat(50), continuous: false, timeoutMs: 1 })).toBe(false)
    expect(isHostRequest({ id: 1, type: 'rm -rf' })).toBe(false)
    expect(isHostRequest(null)).toBe(false)
  })
})

describe('createBridge', () => {
  it('listen resolves with the host result and forwards interim text', async () => {
    const { host } = fakeHost(['नमस्ते'])
    const { voice } = createBridge(window, host)
    const interim: string[] = []
    const handle = voice.listen({ lang: 'hi-IN', onInterim: (t) => interim.push(t) })
    await expect(handle.result).resolves.toBe('नमस्ते')
    expect(interim.length).toBe(1)
  })

  it('maps host errors to VoiceError', async () => {
    const { host } = fakeHost([{ error: 'not-allowed' }])
    const { voice } = createBridge(window, host)
    await expect(voice.listen({ lang: 'hi-IN' }).result).rejects.toMatchObject({ code: 'not-allowed' })
    expect(new VoiceError('other')).toBeInstanceOf(Error)
  })

  it('ignores malformed and unknown messages from the page side', async () => {
    const { host } = fakeHost([])
    createBridge(window, host)
    expect(() => window.__awaazHostReceive?.('not json')).not.toThrow()
    expect(() => window.__awaazHostReceive?.(JSON.stringify({ id: 999, type: 'result', text: 'x' }))).not.toThrow()
    expect(() => window.__awaazHostReceive?.(JSON.stringify({ evil: true }))).not.toThrow()
  })

  it('drives a full guided session through the host (voice and server calls both proxied)', async () => {
    const { host, log } = fakeHost(['रमेश कुमार', 'मध्य प्रदेश', 'madhya pradesh'])
    const { voice, transport } = createBridge(window, host)
    const events: SessionEvent[] = []
    const session = new FillSession({ doc: document, voice, transport, lang: 'hi-IN', onEvent: (e) => events.push(e) })
    await session.runGuided()
    expect((document.getElementById('n') as HTMLInputElement).value).toBe('रमेश कुमार')
    // Hindi answer for an English option: local rules fail, so it is proxied to the server via the host, and then retried.
    expect((document.getElementById('s') as HTMLSelectElement).value).toBe('MP')
    expect(log.some((m) => m.type === 'fill')).toBe(true)
    expect(log.some((m) => m.type === 'speak')).toBe(true)
    expect(events.at(-1)).toMatchObject({ type: 'done', filled: 2 })
  })
})
