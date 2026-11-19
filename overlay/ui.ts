import type { Capability } from '@/lib/act/schema'
import { SPEECH_LANGUAGES } from '@/lib/grievance/labels'
import type { ConfirmRequest } from './act'
import { createBridge } from './bridge'
import { CommandSession, type CommandEvent } from './command-session'
import { ActionLimiter, Permissions } from './permissions'
import { FillSession, type SessionEvent } from './session'
import { fetchActTransport, fetchTransport, resolveConfig, type ActTransport, type Transport } from './transport'
import { t } from './i18n'
import { createBrowserVoice, type VoiceIO } from './voice'

export const HOST_ID = 'awaaz-root'
const LANG_KEY = 'awaaz-lang'
const LOCAL_KEY = 'awaaz-local'

const STYLES = `
:host { all: initial; }
* { box-sizing: border-box; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', 'Noto Sans Devanagari', sans-serif; }
.panel { position: fixed; right: 12px; bottom: 12px; z-index: 2147483647; width: min(420px, calc(100vw - 24px));
  background: #ffffff; color: #111827; border: 1px solid #e7e2d6; border-top: 4px solid #ea580c; border-radius: 20px; padding: 16px;
  box-shadow: 0 24px 60px -12px rgba(17,24,39,.35), 0 2px 6px rgba(17,24,39,.08); font-size: 17px; line-height: 1.45; display: grid; gap: 12px;
  max-height: calc(100vh - 24px); max-height: calc(100dvh - 24px); overflow-y: auto; }
.head { display: flex; align-items: center; gap: 8px; }
.title { flex: 1; }
.title { font-weight: 800; font-size: 18px; letter-spacing: -.01em; }
select { font: inherit; padding: 8px; border: 1.5px solid #e7e2d6; border-radius: 10px; background: #fff; max-width: 120px; }
button { font: inherit; font-weight: 600; min-height: 48px; padding: 10px 16px; border-radius: 14px; border: 1.5px solid #d9d3c3; background: #fff; color: #111827; cursor: pointer; transition: transform .15s ease, box-shadow .15s ease; }
button:hover:not(:disabled) { transform: translateY(-1px); }
button.primary { background: linear-gradient(135deg, #ea580c, #c2410c); border-color: transparent; color: #fff; box-shadow: 0 10px 22px -8px rgba(194,65,12,.6); }
button:disabled { opacity: .45; cursor: not-allowed; }
button:focus-visible, select:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 2px; }
.close, .min-btn { min-height: 40px; width: 40px; padding: 0; flex: none; }
[data-state=running] .start-row, [data-state=idle] .run-row, [data-state=done] .run-row { display: none; }
[data-state=done] ul { display: none; }
.min .question, .min .heard, .min .error, .min ul, .min .row, .min .privacy { display: none; }
.consent, .confirm { display: none; gap: 8px; border: 1px solid #fdba74; border-radius: 14px; padding: 12px; background: #fff7ed; }
[data-state=consent] .consent { display: grid; }
[data-state=consent] .start-row, [data-state=consent] .run-row, [data-state=consent] .status, [data-state=consent] .question, [data-state=consent] .heard { display: none; }
[data-confirm=on] .confirm { display: grid; }
.consent label { display: flex; gap: 8px; align-items: flex-start; font-size: 15px; }
.consent input { width: 20px; height: 20px; flex: none; margin-top: 2px; }
.consent .note, .grants { font-size: 14px; color: #5b6475; margin: 0; }
.confirm .ask { margin: 0; font-weight: 700; }
.privacy { display: flex; align-items: center; gap: 8px; font-size: 15px; }
.privacy input { width: 20px; height: 20px; flex: none; }
.status { font-weight: 700; }
.live { color: #a31515; }
.question { margin: 0; }
.heard { margin: 0; color: #5d6678; font-style: italic; min-height: 1.4em; }
.error { margin: 0; color: #a31515; font-weight: 600; }
.row { display: flex; gap: 8px; flex-wrap: wrap; }
.row > button { flex: 1 1 auto; }
ul { margin: 0; padding: 0; list-style: none; max-height: min(120px, 14vh); overflow: auto; font-size: 15px; }
li { padding: 4px 0; border-top: 1px solid #f0ebdd; }
@media (prefers-reduced-motion: reduce) { button { transition: none; } }
@media (prefers-reduced-motion: no-preference) { .live { animation: blink 1.2s ease-in-out infinite; } }
@keyframes blink { 50% { opacity: .55; } }
`

const ERROR_TEXT: Record<string, string> = {
  'not-allowed': 'Microphone is blocked for this site. Allow it in the browser address bar, then try again. · माइक्रोफोन की अनुमति दें।',
  unsupported: 'This browser has no voice input. Use Chrome (or Firefox/Edge with a voice keyboard). · इस ब्राउज़र में आवाज़ नहीं चलती।',
  'unsupported-language': 'This browser cannot recognise that language. Pick another language.',
  network: 'Cannot reach the Awaaz server. Check your internet and try again.',
  rate_limited: 'Too many requests. Please wait a minute.',
  server: 'The Awaaz server had a problem. Try again.',
  offline_mode: 'On-device only mode is on. Turn it off to use Say everything (it needs the AI service).',
  ai_unavailable: 'Telling everything at once needs the AI service, which is not set up. Use the step-by-step mode.',
  other: 'Something went wrong with voice input. Try again.',
}

function el<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  options: { className?: string; text?: string } = {},
  children: Node[] = [],
): HTMLElementTagNameMap[K] {
  const node = doc.createElement(tag)
  if (options.className) node.className = options.className
  if (options.text !== undefined) node.textContent = options.text
  for (const child of children) node.appendChild(child)
  return node
}

function readStoredLang(win: Window): string {
  try {
    const stored = win.localStorage.getItem(LANG_KEY)
    if (stored && SPEECH_LANGUAGES.some((l) => l.tag === stored)) return stored
  } catch {
    /* storage can be blocked by the host page */
  }
  return 'hi-IN'
}

function readStoredFlag(win: Window, key: string): boolean | null {
  try {
    const stored = win.localStorage.getItem(key)
    return stored === null ? null : stored === '1'
  } catch {
    return null
  }
}

function storeFlag(win: Window, key: string, value: boolean): void {
  try {
    win.localStorage.setItem(key, value ? '1' : '0')
  } catch {
    /* ignore */
  }
}

function storeLang(win: Window, lang: string): void {
  try {
    win.localStorage.setItem(LANG_KEY, lang)
  } catch {
    /* ignore */
  }
}

export interface MountOptions {
  voice?: VoiceIO
  transport?: Transport
  actTransport?: ActTransport
}

const CAPABILITY_TEXT: Array<{ cap: Capability; text: string; on: boolean }> = [
  { cap: 'view', text: 'See and read this page, scroll · पेज देखना, पढ़ना, स्क्रॉल करना', on: true },
  { cap: 'fill', text: 'Fill form fields (never passwords, OTP, Aadhaar, card numbers) · फ़ॉर्म भरना', on: true },
  { cap: 'click', text: 'Press buttons and links on this site · इस साइट के बटन और लिंक दबाना', on: true },
  { cap: 'external', text: 'Open links to other websites, asks you every time · दूसरी साइट के लिंक, हर बार पूछेगा', on: false },
  { cap: 'risky', text: 'Submit, send, delete, log in or out, asks you every time · सबमिट, भेजना, हटाना, हर बार पूछेगा', on: false },
]
const DURATIONS: Array<{ minutes: number; label: string }> = [
  { minutes: 5, label: '5 min' },
  { minutes: 10, label: '10 min' },
  { minutes: 30, label: '30 min' },
]
const COMMAND_END_TEXT: Record<string, string> = {
  stopped: 'Stopped · रुक गया',
  idle: 'No voice heard, stopped · आवाज़ नहीं आई, रुक गया',
}

/** Mounts the assistant panel (or removes it if already mounted). All page-derived text is set via textContent. */
export function mount(win: Window = window, options: MountOptions = {}): void {
  const doc = win.document
  const existing = doc.getElementById(HOST_ID)
  if (existing) {
    existing.dispatchEvent(new CustomEvent('awaaz-close'))
    return
  }

  const config = resolveConfig(win)
  // Inside a native app's built-in browser a host bridge exists: it provides the voice engine and the API proxy.
  const bridge = win.__AWAAZ_HOST__ ? createBridge(win, win.__AWAAZ_HOST__) : null
  const transport = options.transport ?? config.transport ?? bridge?.transport ?? fetchTransport(config.apiBase)
  const voice = options.voice ?? bridge?.voice ?? createBrowserVoice()

  const host = el(doc, 'div')
  host.id = HOST_ID
  const shadow = host.attachShadow({ mode: 'open' })
  shadow.appendChild(el(doc, 'style', { text: STYLES }))

  const title = el(doc, 'span', { className: 'title', text: 'Awaaz · आवाज़' })
  const langSelect = el(doc, 'select')
  langSelect.setAttribute('aria-label', 'Language')
  for (const l of SPEECH_LANGUAGES) {
    const option = el(doc, 'option', { text: l.label })
    option.value = l.tag
    langSelect.appendChild(option)
  }
  langSelect.value = config.lang ?? readStoredLang(win)
  const minButton = el(doc, 'button', { className: 'min-btn', text: '–' })
  minButton.setAttribute('aria-label', 'Minimize')
  minButton.setAttribute('aria-expanded', 'true')
  const closeButton = el(doc, 'button', { className: 'close', text: '×' })
  closeButton.setAttribute('aria-label', 'Close')
  const head = el(doc, 'div', { className: 'head' }, [title, langSelect, minButton, closeButton])

  const privacyBox = doc.createElement('input')
  privacyBox.type = 'checkbox'
  privacyBox.checked = config.localOnly ?? readStoredFlag(win, LOCAL_KEY) ?? false
  const privacyLabel = el(doc, 'label', { className: 'privacy' }, [
    privacyBox,
    doc.createTextNode('On-device only: nothing leaves this device · सिर्फ़ इसी डिवाइस पर'),
  ])

  const status = el(doc, 'div', { className: 'status', text: 'Ready · तैयार' })
  status.setAttribute('aria-live', 'polite')
  const question = el(doc, 'p', { className: 'question' })
  const heard = el(doc, 'p', { className: 'heard' })
  const errorLine = el(doc, 'p', { className: 'error' })
  errorLine.setAttribute('role', 'alert')
  const filledList = el(doc, 'ul')

  const guidedButton = el(doc, 'button', { className: 'primary', text: 'Start · शुरू करें' })
  const batchButton = el(doc, 'button', { text: 'Say everything · सब एक साथ' })
  const skipButton = el(doc, 'button', { text: 'Skip · छोड़ें' })
  const undoButton = el(doc, 'button', { text: 'Undo · वापस' })
  const stopButton = el(doc, 'button', { text: 'Stop · रोकें' })
  const commandsButton = el(doc, 'button', { text: 'Voice commands · आवाज़ से आदेश' })
  const startRow = el(doc, 'div', { className: 'row start-row' }, [guidedButton, batchButton, commandsButton])

  // ---- Voice commands: consent, per-action confirmation, visible grants.
  const permissions = new Permissions(() => win.location.origin)
  const limiter = new ActionLimiter(20, 60_000)
  const consentTitle = el(doc, 'strong', { text: 'Allow Awaaz to do these on this site? · क्या Awaaz को ये करने दें?' })
  const capBoxes = new Map<Capability, HTMLInputElement>()
  const capRows = CAPABILITY_TEXT.map(({ cap, text, on }) => {
    const box = doc.createElement('input')
    box.type = 'checkbox'
    box.checked = on
    capBoxes.set(cap, box)
    return el(doc, 'label', {}, [box, doc.createTextNode(text)])
  })
  const durationSelect = el(doc, 'select')
  durationSelect.setAttribute('aria-label', 'How long')
  for (const d of DURATIONS) {
    const option = el(doc, 'option', { text: d.label })
    option.value = String(d.minutes)
    durationSelect.appendChild(option)
  }
  durationSelect.value = '10'
  const consentNote = el(doc, 'p', {
    className: 'note',
    text: 'Payments, passwords and OTPs are never done by voice. Permission ends when the time is up, you close this panel or the site changes. · भुगतान, पासवर्ड और OTP आवाज़ से कभी नहीं।',
  })
  const allowButton = el(doc, 'button', { className: 'primary', text: 'Allow and start · अनुमति दें' })
  const cancelConsentButton = el(doc, 'button', { text: 'Cancel · रद्द करें' })
  const consent = el(doc, 'div', { className: 'consent' }, [
    consentTitle,
    ...capRows,
    el(doc, 'label', {}, [doc.createTextNode('For · कितनी देर '), durationSelect]),
    consentNote,
    el(doc, 'div', { className: 'row' }, [allowButton, cancelConsentButton]),
  ])
  const grants = el(doc, 'p', { className: 'grants' })
  const confirmText = el(doc, 'p', { className: 'ask' })
  const confirmYes = el(doc, 'button', { className: 'primary', text: 'Yes, do it · हाँ' })
  const confirmNo = el(doc, 'button', { text: 'No · नहीं' })
  const confirmBox = el(doc, 'div', { className: 'confirm' }, [confirmText, el(doc, 'div', { className: 'row' }, [confirmYes, confirmNo])])
  confirmBox.setAttribute('role', 'alertdialog')
  const runRow = el(doc, 'div', { className: 'row run-row' }, [skipButton, undoButton, stopButton])

  const panel = el(doc, 'div', { className: 'panel' }, [head, privacyLabel, status, question, heard, errorLine, grants, filledList, startRow, runRow, consent, confirmBox])
  panel.dataset.state = 'idle'
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-label', 'Awaaz voice form assistant')
  shadow.appendChild(panel)

  let session: FillSession | null = null

  const setRunning = (running: boolean) => {
    if (running) panel.dataset.state = 'running'
    else if (panel.dataset.state === 'running') panel.dataset.state = 'idle'
    guidedButton.disabled = running
    batchButton.disabled = running
    commandsButton.disabled = running
    langSelect.disabled = running
    privacyBox.disabled = running
    skipButton.disabled = !running
    stopButton.disabled = !running
  }
  setRunning(false)
  undoButton.disabled = true

  const onEvent = (event: SessionEvent) => {
    switch (event.type) {
      case 'scanned':
        status.textContent = `Found ${event.total} fields (${event.manual} you must type yourself)`
        filledList.textContent = ''
        errorLine.textContent = ''
        break
      case 'ask':
        status.textContent = `Question ${event.index + 1} of ${event.total}`
        status.classList.remove('live')
        errorLine.textContent = ''
        question.textContent = event.question
        heard.textContent = ''
        break
      case 'listening':
        status.textContent = '🎤 Listening… · सुन रहा हूँ'
        status.classList.add('live')
        break
      case 'interim':
        heard.textContent = event.text
        break
      case 'heard':
        status.classList.remove('live')
        heard.textContent = event.text
        break
      case 'filled':
        filledList.appendChild(el(doc, 'li', { text: `✓ ${event.field.label}: ${event.value}` }))
        undoButton.disabled = false
        break
      case 'retry':
      case 'manual':
        errorLine.textContent = event.message
        break
      case 'skipped':
        errorLine.textContent = ''
        break
      case 'undone':
        filledList.lastElementChild?.remove()
        break
      case 'done':
        status.classList.remove('live')
        status.textContent = event.message
        question.textContent = event.manual.length > 0 ? `${t(langSelect.value, 'fillYourself')} ${event.manual.join(', ')}` : ''
        heard.textContent = ''
        errorLine.textContent = ''
        setRunning(false)
        panel.dataset.state = 'done'
        break
      case 'error':
        status.classList.remove('live')
        errorLine.textContent = ERROR_TEXT[event.code] ?? ERROR_TEXT.other ?? ''
        setRunning(false)
        break
    }
  }

  const start = (mode: 'guided' | 'batch') => {
    session = new FillSession({ doc, voice, transport, lang: langSelect.value, allowServer: !privacyBox.checked, onEvent })
    storeLang(win, langSelect.value)
    storeFlag(win, LOCAL_KEY, privacyBox.checked)
    errorLine.textContent = ''
    setRunning(true)
    const run = mode === 'guided' ? session.runGuided() : session.runBatch()
    void run
      .catch(() => onEvent({ type: 'error', code: 'other' }))
      .finally(() => setRunning(false))
  }

  // ---- Voice commands wiring.
  let commands: CommandSession | null = null
  let grantTimer: ReturnType<typeof setInterval> | undefined
  let pendingConfirm: ((answer: boolean) => void) | null = null
  const actTransport = options.actTransport ?? config.actTransport ?? bridge?.actTransport ?? fetchActTransport(config.apiBase)
  const actServerOk = true

  const renderGrants = () => {
    const active = permissions.active()
    const left = Math.ceil(permissions.remainingMs() / 60_000)
    grants.textContent = active.length > 0 ? `Allowed: ${active.join(', ')} · ${left} min left` : ''
  }
  permissions.onChange(renderGrants)
  /** A click only counts if the PERSON made it. Page scripts can reach this panel's buttons but cannot fake a trusted click. */
  const trusted = (handler: () => void) => (event: Event) => {
    if (event.isTrusted) handler()
  }
  const settleConfirm = (answer: boolean) => {
    pendingConfirm?.(answer)
    pendingConfirm = null
    delete panel.dataset.confirm
  }
  const askConfirm = (request: ConfirmRequest): Promise<boolean> =>
    new Promise<boolean>((resolve) => {
      settleConfirm(false)
      confirmText.textContent =
        request.risk === 'external'
          ? `Open “${request.label}” on ${request.host ?? 'another site'}? You will leave this site. · दूसरी साइट खुलेगी?`
          : `Press “${request.label}”? This may submit, send, delete or sign you out. · क्या दबाएँ?`
      panel.dataset.confirm = 'on'
      const timer = setTimeout(() => settleConfirm(false), 60_000)
      pendingConfirm = (answer) => {
        clearTimeout(timer)
        resolve(answer)
      }
    })
  confirmYes.addEventListener('click', trusted(() => settleConfirm(true)))
  confirmNo.addEventListener('click', () => settleConfirm(false))

  const onCommandEvent = (event: CommandEvent) => {
    switch (event.type) {
      case 'listening':
        status.textContent = '🎤 Listening for commands… · आदेश सुन रहा हूँ'
        status.classList.add('live')
        break
      case 'interim':
        heard.textContent = event.text
        break
      case 'heard':
        status.classList.remove('live')
        heard.textContent = event.text
        break
      case 'thinking':
        status.textContent = '… ' + (heard.textContent ?? '')
        break
      case 'result':
        filledList.appendChild(el(doc, 'li', { text: `${event.ok ? '✓' : '✗'} ${event.message}` }))
        filledList.scrollTop = filledList.scrollHeight
        undoButton.disabled = false
        break
      case 'ended':
        settleConfirm(false)
        status.classList.remove('live')
        if (event.reason === 'error') errorLine.textContent = ERROR_TEXT[event.code ?? 'other'] ?? ERROR_TEXT.other ?? ''
        status.textContent = COMMAND_END_TEXT[event.reason] ?? 'Stopped · रुक गया'
        endCommands()
        break
    }
  }

  const endCommands = () => {
    clearInterval(grantTimer)
    permissions.revoke() // permission never outlives the session
    commands = null
    setRunning(false)
    panel.dataset.state = 'done'
  }

  const startCommands = () => {
    const chosen = CAPABILITY_TEXT.filter(({ cap }) => capBoxes.get(cap)?.checked).map(({ cap }) => cap)
    if (chosen.length === 0) return
    permissions.grant(chosen, Number(durationSelect.value) * 60_000)
    storeLang(win, langSelect.value)
    storeFlag(win, LOCAL_KEY, privacyBox.checked)
    filledList.textContent = ''
    errorLine.textContent = ''
    question.textContent = ''
    setRunning(true)
    grantTimer = setInterval(renderGrants, 15_000)
    commands = new CommandSession({
      doc,
      win,
      hostId: HOST_ID,
      voice,
      actTransport,
      permissions,
      limiter,
      lang: langSelect.value,
      allowServer: actServerOk && !privacyBox.checked,
      confirm: askConfirm,
      onEvent: onCommandEvent,
    })
    void commands.run().catch(() => onCommandEvent({ type: 'ended', reason: 'error', code: 'other' }))
  }

  commandsButton.addEventListener('click', () => {
    panel.dataset.state = 'consent'
  })
  allowButton.addEventListener('click', trusted(startCommands))
  cancelConsentButton.addEventListener('click', () => {
    panel.dataset.state = 'idle'
  })

  guidedButton.addEventListener('click', () => start('guided'))
  batchButton.addEventListener('click', () => start('batch'))
  skipButton.addEventListener('click', () => session?.skip())
  stopButton.addEventListener('click', () => {
    commands?.stop()
    session?.stop()
    status.classList.remove('live')
    status.textContent = 'Stopped · रुक गया'
    setRunning(false)
  })
  undoButton.addEventListener('click', () => (commands ?? session)?.undo())

  minButton.addEventListener('click', () => {
    const minimized = panel.classList.toggle('min')
    minButton.textContent = minimized ? '+' : '–'
    minButton.setAttribute('aria-label', minimized ? 'Expand' : 'Minimize')
    minButton.setAttribute('aria-expanded', String(!minimized))
  })

  let teardown: () => void = () => host.remove()
  const close = () => {
    commands?.stop()
    session?.stop()
    settleConfirm(false)
    clearInterval(grantTimer)
    permissions.revoke()
    teardown()
  }
  closeButton.addEventListener('click', close)
  host.addEventListener('awaaz-close', close)

  // The panel is fixed at the bottom, so add blank space after the page's content: the user can always scroll
  // the end of the form (usually the Submit button) above the panel.
  const spacer = el(doc, 'div')
  spacer.id = `${HOST_ID}-spacer`
  spacer.setAttribute('aria-hidden', 'true')
  spacer.style.cssText = 'height:0;pointer-events:none;'
  const updateSpacer = () => {
    spacer.style.height = `${Math.ceil(panel.getBoundingClientRect().height) + 24}px`
  }
  const ResizeObserverCtor = (win as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver
  const observer = typeof ResizeObserverCtor === 'function' ? new ResizeObserverCtor(updateSpacer) : null
  teardown = () => {
    observer?.disconnect()
    spacer.remove()
    host.remove()
  }

  doc.documentElement.appendChild(host)
  ;(doc.body ?? doc.documentElement).appendChild(spacer)
  observer?.observe(panel)
  updateSpacer()
}
