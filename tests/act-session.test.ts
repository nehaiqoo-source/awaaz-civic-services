// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { planActions } from '@/lib/act/plan'
import type { ActPlan, ActRequest } from '@/lib/act/schema'
import { executeAction, type PageSnapshot } from '../overlay/act'
import { CommandSession, type CommandEvent } from '../overlay/command-session'
import { scanControls } from '../overlay/controls'
import { ActionLimiter, Permissions } from '../overlay/permissions'
import { scanForm } from '../overlay/scan'
import { HOST_ID, mount } from '../overlay/ui'
import type { ListenHandle, VoiceIO } from '../overlay/voice'
import { VoiceError } from '../overlay/voice'

const PAGE = `
<a id="track" href="/track">Track complaint</a>
<a id="ext" href="https://other.example/page">Ministry website</a>
<a id="pay" href="/pay">Pay now</a>
<a id="file" href="/app.apk">Get the app</a>
<a id="tel" href="tel:100">Call police</a>
<form id="f" action="#" onsubmit="return false">
  <label for="m">Mobile number</label><input id="m" type="tel">
  <label for="p">Password</label><input id="p" type="password">
  <button id="submit" type="submit">Send complaint</button>
</form>
<button id="harmless" type="button">Show help</button>`

let clicked: string[]
let origin = 'http://localhost'

function setup() {
  document.body.innerHTML = PAGE
  clicked = []
  for (const id of ['track', 'ext', 'pay', 'file', 'tel', 'submit', 'harmless']) {
    document.getElementById(id)?.addEventListener('click', (e) => {
      e.preventDefault()
      clicked.push(id)
    })
  }
}

function perms(caps: string[]) {
  const p = new Permissions(() => origin)
  p.grant(caps)
  return p
}

function deps(permissions: Permissions, confirm: (r: unknown) => Promise<boolean> = async () => true) {
  const spoken: string[] = []
  return {
    spoken,
    d: {
      doc: document,
      win: window,
      hostId: HOST_ID,
      permissions,
      limiter: new ActionLimiter(50, 60_000),
      confirm: confirm as never,
      speak: async (t: string) => {
        spoken.push(t)
      },
    },
  }
}

const snap = (): PageSnapshot => ({ controls: scanControls(document, window, HOST_ID), form: scanForm(document) })
const idOf = (s: PageSnapshot, id: string) => [...s.controls.refs].find(([, e]) => e.id === id)?.[0] as string

beforeEach(() => {
  origin = 'http://localhost'
  setup()
})
afterEach(() => {
  document.body.innerHTML = ''
  document.getElementById(HOST_ID)?.remove()
})

describe('Permissions', () => {
  it('grants nothing by default, expires, and is bound to the origin', () => {
    let now = 1_000
    const p = new Permissions(() => origin, () => now)
    expect(p.has('click')).toBe(false)
    p.grant(['click', 'bogus'], 60_000)
    expect(p.active()).toEqual(['click'])
    now += 59_000
    expect(p.has('click')).toBe(true)
    now += 2_000
    expect(p.has('click')).toBe(false)
    p.grant(['view'])
    origin = 'http://elsewhere.test'
    expect(p.has('view')).toBe(false) // the site changed: grant is void
  })
  it('caps a grant at 30 minutes', () => {
    let now = 0
    const p = new Permissions(() => origin, () => now)
    p.grant(['view'], 24 * 3_600_000)
    expect(p.remainingMs()).toBe(30 * 60_000)
    now += 31 * 60_000
    expect(p.has('view')).toBe(false)
  })
})

describe('scanControls', () => {
  it('describes links safely: host only, scheme, download, submit', () => {
    const s = snap()
    const by = (label: string) => s.controls.elements.find((e) => e.label === label)
    expect(by('Track complaint')).toMatchObject({ role: 'link', hrefHost: window.location.host })
    expect(by('Track complaint')?.external).toBeUndefined()
    expect(by('Ministry website')).toMatchObject({ external: true, hrefHost: 'other.example' })
    expect(by('Call police')?.scheme).toBe('tel')
    expect(by('Get the app')?.download).toBe(true)
    expect(by('Send complaint')?.submit).toBe(true)
    expect(JSON.stringify(s.controls.elements)).not.toContain('/track') // no paths leave the page
  })
  it('skips disabled, hidden and the assistant\'s own elements', () => {
    document.body.insertAdjacentHTML('beforeend', '<button disabled>Off</button><button hidden>Hid</button><button style="display:none">Gone</button>')
    mount(window)
    const labels = snap().controls.elements.map((e) => e.label)
    expect(labels).not.toContain('Off')
    expect(labels).not.toContain('Hid')
    expect(labels).not.toContain('Gone')
    expect(labels.some((l) => l.includes('Allow'))).toBe(false)
  })
})

describe('executeAction policy', () => {
  it('refuses everything without the matching capability', async () => {
    const s = snap()
    const { d } = deps(perms(['view']))
    const out = await executeAction({ type: 'click', target: idOf(s, 'track') }, s, d)
    expect(out).toMatchObject({ status: 'no_permission', capability: 'click' })
    expect(clicked).toEqual([])
  })
  it('clicks a safe element once click is granted, without asking', async () => {
    const s = snap()
    let asked = 0
    const { d } = deps(perms(['click']), async () => (asked++, true))
    expect(await executeAction({ type: 'click', target: idOf(s, 'harmless') }, s, d)).toMatchObject({ status: 'done' })
    expect(clicked).toEqual(['harmless'])
    expect(asked).toBe(0)
  })
  it('blocks payments, downloads, tel links even with every capability and a yes', async () => {
    const s = snap()
    const { d } = deps(perms(['view', 'fill', 'click', 'external', 'risky']))
    for (const id of ['pay', 'file', 'tel']) {
      expect(await executeAction({ type: 'click', target: idOf(s, id) }, s, d), id).toMatchObject({ status: 'blocked' })
    }
    expect(clicked).toEqual([])
  })
  it('needs the risky capability AND a confirmation for submit; declined means nothing happens', async () => {
    const s = snap()
    const target = idOf(s, 'submit')
    expect(await executeAction({ type: 'click', target }, s, deps(perms(['click'])).d)).toMatchObject({ status: 'no_permission', capability: 'risky' })
    expect(await executeAction({ type: 'click', target }, s, deps(perms(['risky']), async () => false).d)).toMatchObject({ status: 'declined' })
    expect(clicked).toEqual([])
    expect(await executeAction({ type: 'click', target }, s, deps(perms(['risky']), async () => true).d)).toMatchObject({ status: 'done' })
    expect(clicked).toEqual(['submit'])
  })
  it('asks before leaving the site, naming the destination host', async () => {
    const s = snap()
    const seen: unknown[] = []
    const { d } = deps(perms(['external']), async (r) => (seen.push(r), true))
    await executeAction({ type: 'click', target: idOf(s, 'ext') }, s, d)
    expect(seen).toEqual([{ risk: 'external', label: 'Ministry website', host: 'other.example' }])
    expect(clicked).toEqual(['ext'])
  })
  it('aborts when the page swaps the button for something worse while the person was deciding', async () => {
    const s = snap()
    const target = idOf(s, 'submit')
    const p = perms(['risky'])
    const { d } = deps(p, async () => {
      document.getElementById('submit')!.textContent = 'Delete everything' // page changes its mind mid-confirmation
      return true
    })
    expect(await executeAction({ type: 'click', target }, s, d)).toMatchObject({ status: 'stale' })
    expect(clicked).toEqual([])
  })
  it('aborts when permission expires during the confirmation', async () => {
    const s = snap()
    const p = perms(['risky'])
    const { d } = deps(p, async () => {
      p.revoke()
      return true
    })
    expect(await executeAction({ type: 'click', target: idOf(s, 'submit') }, s, d)).toMatchObject({ status: 'no_permission' })
    expect(clicked).toEqual([])
  })
  it('notices an element whose destination changed after the snapshot (bait and switch)', async () => {
    const s = snap()
    ;(document.getElementById('track') as HTMLAnchorElement).href = 'https://evil.example/steal'
    expect(await executeAction({ type: 'click', target: idOf(s, 'track') }, s, deps(perms(['click', 'external'])).d)).toMatchObject({ status: 'stale' })
    expect(clicked).toEqual([])
  })
  it('fills only with the fill capability, never sensitive fields, and can undo', async () => {
    const s = snap()
    const mobile = s.form.fields.find((f) => f.label === 'Mobile number')!
    const password = s.form.fields.find((f) => f.label === 'Password')!
    const input = document.getElementById('m') as HTMLInputElement
    expect(await executeAction({ type: 'fill', target: mobile.id, value: '9876543210' }, s, deps(perms(['view'])).d)).toMatchObject({ status: 'no_permission' })
    expect(input.value).toBe('')
    expect(await executeAction({ type: 'fill', target: password.id, value: 'hunter2' }, s, deps(perms(['fill'])).d)).toMatchObject({ status: 'blocked' })
    expect((document.getElementById('p') as HTMLInputElement).value).toBe('')
    const out = await executeAction({ type: 'fill', target: mobile.id, value: '9876543210' }, s, deps(perms(['fill'])).d)
    expect(out.status).toBe('done')
    expect(input.value).toBe('9876543210')
    if (out.status === 'done') out.undo?.()
    expect(input.value).toBe('')
  })
  it('read speaks only visible page text, never form values or the assistant itself', async () => {
    document.body.insertAdjacentHTML('beforeend', '<p>Welcome citizens</p><p hidden>secret hidden</p><script>var x = "scriptcode"</script>')
    ;(document.getElementById('m') as HTMLInputElement).value = '9999999999'
    const s = snap()
    const { d, spoken } = deps(perms(['view']))
    await executeAction({ type: 'read' }, s, d)
    expect(spoken[0]).toContain('Welcome citizens')
    expect(spoken[0]).not.toContain('secret hidden')
    expect(spoken[0]).not.toContain('scriptcode')
    expect(spoken[0]).not.toContain('9999999999')
  })
  it('rate limits runaway loops', async () => {
    const s = snap()
    const { d } = deps(perms(['view']))
    d.limiter = new ActionLimiter(2, 60_000)
    const run = () => executeAction({ type: 'scroll', direction: 'down' }, s, d)
    expect((await run()).status).toBe('done')
    expect((await run()).status).toBe('done')
    expect((await run()).status).toBe('rate_limited')
  })
})

function scriptedVoice(phrases: Array<string | VoiceError>): VoiceIO & { spoken: string[] } {
  const queue = [...phrases]
  const spoken: string[] = []
  return {
    spoken,
    speak: async (t) => {
      spoken.push(t)
    },
    cancelSpeech() {},
    listen(): ListenHandle {
      const next = queue.shift()
      const result = next === undefined ? Promise.reject(new VoiceError('no-speech')) : next instanceof VoiceError ? Promise.reject(next) : Promise.resolve(next)
      return { result, stop() {} }
    },
  }
}

function session(phrases: Array<string | VoiceError>, caps: string[], opts: { allowServer?: boolean; plan?: (r: ActRequest) => Promise<ActPlan>; confirm?: () => Promise<boolean> } = {}) {
  const events: CommandEvent[] = []
  const requests: ActRequest[] = []
  const voice = scriptedVoice(phrases)
  const s = new CommandSession({
    doc: document,
    win: window,
    hostId: HOST_ID,
    voice,
    actTransport: async (r) => {
      requests.push(r)
      return opts.plan ? opts.plan(r) : planActions(r)
    },
    permissions: perms(caps),
    limiter: new ActionLimiter(50, 60_000),
    lang: 'en-IN',
    allowServer: opts.allowServer ?? true,
    confirm: opts.confirm ?? (async () => true),
    onEvent: (e) => events.push(e),
  })
  return { s, events, requests, voice }
}

describe('CommandSession', () => {
  it('runs spoken commands end to end, then stops on "stop"', async () => {
    const { s, events } = session(['scroll down', 'click show help', 'stop'], ['view', 'click'])
    await s.run()
    expect(clicked).toEqual(['harmless'])
    expect(events.filter((e) => e.type === 'result').map((e) => (e as { ok: boolean }).ok)).toEqual([true, true])
    expect(events.at(-1)).toMatchObject({ type: 'ended', reason: 'stopped' })
  })
  it('does not send anything to the server when the rules understand the command', async () => {
    const { s, requests } = session(['click show help', 'stop'], ['click'])
    await s.run()
    expect(requests).toEqual([])
  })
  it('on-device mode never contacts the server, even for unknown commands', async () => {
    const { s, requests, voice } = session(['file my complaint please', 'stop'], ['click', 'fill'], { allowServer: false })
    await s.run()
    expect(requests).toEqual([])
    expect(voice.spoken.some((x) => x.includes('did not understand'))).toBe(true)
  })
  it('sends the server only what was granted: no elements without click rights, no sensitive fields', async () => {
    const { s, requests } = session(['please do the thing', 'stop'], ['fill'])
    await s.run()
    expect(requests[0]?.elements).toEqual([])
    const labels = requests[0]?.fields.map((f) => f.label)
    expect(labels).toContain('Mobile number')
    expect(labels).not.toContain('Password')
    expect(JSON.stringify(requests[0])).not.toContain('Track complaint')
  })
  it('ignores a hostile server: invented targets, scripts, sensitive fills and extra steps are dropped', async () => {
    const hostile = async (): Promise<ActPlan> => ({
      source: 'llm',
      actions: [
        { type: 'eval', code: 'steal()' },
        { type: 'click', target: 'e999' },
        { type: 'fill', target: 'f2', value: 'hunter2' }, // the password field
        { type: 'scroll', direction: 'down' },
      ] as never,
    })
    const { s, events } = session(['do something clever', 'stop'], ['view', 'fill', 'click'], { plan: hostile })
    await s.run()
    expect((document.getElementById('p') as HTMLInputElement).value).toBe('')
    expect(clicked).toEqual([])
    expect(events.filter((e) => e.type === 'result')).toHaveLength(1) // only the scroll
  })
  it('stops after a refused step instead of carrying on with the plan', async () => {
    const plan = async (): Promise<ActPlan> => ({
      source: 'llm',
      actions: [{ type: 'fill', target: 'f1', value: '9876543210' }, { type: 'scroll', direction: 'down' }],
    })
    const { s, events } = session(['fill and scroll', 'stop'], ['view'], { plan }) // fill not granted
    await s.run()
    expect((document.getElementById('m') as HTMLInputElement).value).toBe('')
    expect(events.filter((e) => e.type === 'result')).toEqual([expect.objectContaining({ ok: false })])
  })
  it('undoes a fill by voice', async () => {
    const plan = async (): Promise<ActPlan> => ({ source: 'llm', actions: [{ type: 'fill', target: 'f1', value: '9876543210' }] })
    const { s } = session(['my number is nine eight seven six', 'undo', 'stop'], ['fill'], { plan })
    const input = document.getElementById('m') as HTMLInputElement
    const running = s.run()
    await running
    expect(input.value).toBe('')
  })
  it('stops itself after repeated silence', async () => {
    const { s, events } = session([], ['view'])
    await s.run()
    expect(events.at(-1)).toMatchObject({ type: 'ended', reason: 'idle' })
  })
})

describe('panel: nothing is allowed by a page script', () => {
  const shadowOf = () => document.getElementById(HOST_ID)!.shadowRoot!
  const buttonByText = (text: string) => [...shadowOf().querySelectorAll('button')].find((b) => b.textContent?.startsWith(text)) as HTMLButtonElement

  it('ignores a scripted (untrusted) click on "Allow and start": no permission, no listening', () => {
    let listens = 0
    const voice: VoiceIO = { speak: async () => {}, cancelSpeech() {}, listen: () => (listens++, { result: new Promise(() => {}), stop() {} }) }
    mount(window, { voice })
    buttonByText('Voice commands').click()
    expect(shadowOf().querySelector<HTMLElement>('.panel')!.dataset.state).toBe('consent')
    buttonByText('Allow and start').click() // dispatched by script: isTrusted === false
    expect(listens).toBe(0)
    expect(shadowOf().querySelector<HTMLElement>('.panel')!.dataset.state).toBe('consent')
  })
  it('consent screen offers every capability, with the risky ones off by default', () => {
    mount(window)
    buttonByText('Voice commands').click()
    const boxes = [...shadowOf().querySelectorAll<HTMLInputElement>('.consent input[type=checkbox]')]
    expect(boxes.map((b) => b.checked)).toEqual([true, true, true, false, false])
  })
})
