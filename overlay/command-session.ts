import { planWithRules, sanitizeActions } from '@/lib/act/plan'
import type { Action, ActPlan } from '@/lib/act/schema'
import { isSensitiveField } from '@/lib/fill/sensitive'
import { executeAction, type ConfirmRequest, type Outcome, type PageSnapshot } from './act'
import { scanControls } from './controls'
import { t, type StringKey } from './i18n'
import type { ActionLimiter, Permissions } from './permissions'
import { scanForm } from './scan'
import type { ActTransport } from './transport'
import { VoiceError, type ListenHandle, type VoiceIO } from './voice'

export type CommandEvent =
  | { type: 'listening' }
  | { type: 'interim'; text: string }
  | { type: 'heard'; text: string }
  | { type: 'thinking' }
  | { type: 'result'; ok: boolean; message: string }
  | { type: 'ended'; reason: 'stopped' | 'idle' | 'error'; code?: string }

export interface CommandDeps {
  doc: Document
  win: Window
  hostId: string
  voice: VoiceIO
  actTransport: ActTransport
  permissions: Permissions
  limiter: ActionLimiter
  lang: string
  /** false = on-device only: only the built-in rules run and nothing is sent to the server. */
  allowServer: boolean
  confirm: (request: ConfirmRequest) => Promise<boolean>
  onEvent: (event: CommandEvent) => void
  /** Called for every attempted action: powers the visible activity log. */
  audit?: (entry: { at: number; action: Action['type']; label?: string; status: Outcome['status'] }) => void
}

const UNDO = /\b(undo|revert|undo\s*that)\b|पहले\s*जैसा|वापस\s*करो|अनडू/i
const IDLE_LIMIT = 3
const LISTEN_MS = 15_000

const OUTCOME_KEY: Record<Exclude<Outcome['status'], 'done'>, StringKey> = {
  blocked: 'cmdBlocked',
  no_permission: 'cmdNoPermission',
  declined: 'cmdDeclined',
  stale: 'cmdStale',
  rate_limited: 'cmdRateLimited',
  invalid: 'cmdNotUnderstood',
}

/**
 * Hands-free voice commands: listen, understand, check, then act. Every action passes the same gates
 * (capability granted by the person, live-element risk rules, per-action physical confirmation for risky things).
 * The server only ever proposes actions; this class decides.
 */
export class CommandSession {
  private stopped = false
  private currentListen: ListenHandle | null = null
  private readonly undoStack: Array<() => void> = []

  constructor(private readonly deps: CommandDeps) {}

  private emit(event: CommandEvent): void {
    this.deps.onEvent(event)
  }

  private say(ok: boolean, message: string): Promise<void> {
    this.emit({ type: 'result', ok, message })
    return this.deps.voice.speak(message, this.deps.lang)
  }

  async run(): Promise<void> {
    this.stopped = false
    let idle = 0
    while (!this.stopped) {
      let transcript: string
      try {
        this.emit({ type: 'listening' })
        this.currentListen = this.deps.voice.listen({
          lang: this.deps.lang,
          timeoutMs: LISTEN_MS,
          onInterim: (text) => this.emit({ type: 'interim', text }),
        })
        transcript = await this.currentListen.result
      } catch (error) {
        if (this.stopped) break
        const code = error instanceof VoiceError ? error.code : 'other'
        if (code === 'no-speech') {
          idle += 1
          if (idle >= IDLE_LIMIT) {
            await this.say(false, t(this.deps.lang, 'cmdIdle'))
            this.emit({ type: 'ended', reason: 'idle' })
            return
          }
          continue
        }
        this.emit({ type: 'ended', reason: 'error', code })
        return
      } finally {
        this.currentListen = null
      }
      idle = 0
      if (this.stopped) break
      this.emit({ type: 'heard', text: transcript })
      try {
        await this.handle(transcript)
      } catch (error) {
        this.emit({ type: 'ended', reason: 'error', code: error instanceof Error ? error.message : 'other' })
        return
      }
    }
    this.emit({ type: 'ended', reason: 'stopped' })
  }

  /** Undo the most recent fill. */
  undo(): void {
    const undo = this.undoStack.pop()
    if (undo) undo()
  }

  stop(): void {
    this.stopped = true
    this.deps.voice.cancelSpeech()
    this.currentListen?.stop()
  }

  private snapshot(): PageSnapshot {
    const { doc, win, hostId } = this.deps
    return { controls: scanControls(doc, win, hostId), form: scanForm(doc) }
  }

  private async handle(transcript: string): Promise<void> {
    const { lang, permissions } = this.deps
    if (UNDO.test(transcript)) {
      const undo = this.undoStack.pop()
      if (undo) {
        undo()
        await this.say(true, t(lang, 'cmdUndone'))
      } else await this.say(false, t(lang, 'cmdNothingToUndo'))
      return
    }

    this.emit({ type: 'thinking' })
    const snap = this.snapshot()
    const targets = { elements: snap.controls.elements, fields: snap.form.fields }

    // 1) On-device rules (no network). 2) The server's planner, only if the rules did not understand and it is allowed.
    let plan: ActPlan = planWithRules(transcript, targets.elements)
    if (plan.actions.length === 0 && this.deps.allowServer) {
      // Data minimisation: only describe what the person has allowed the assistant to touch.
      const canClick = permissions.has('click') || permissions.has('external') || permissions.has('risky')
      try {
        plan = await this.deps.actTransport({
          transcript,
          language: lang,
          elements: canClick ? targets.elements : [],
          fields: permissions.has('fill') ? targets.fields.filter((f) => !isSensitiveField(f)) : [],
        })
      } catch (error) {
        this.emit({ type: 'ended', reason: 'error', code: error instanceof Error ? error.message : 'network' })
        this.stop()
        return
      }
    }
    // The server is not trusted either: re-sanitize against the snapshot we just took.
    const actions = sanitizeActions(plan.actions, targets)
    if (actions.length === 0) {
      await this.say(false, t(lang, plan.reason === 'no_match' ? 'cmdNoMatch' : 'cmdNotUnderstood'))
      return
    }
    await this.perform(actions, snap)
  }

  private async perform(actions: Action[], snap: PageSnapshot): Promise<void> {
    const { lang } = this.deps
    for (const action of actions) {
      if (this.stopped) return
      if (action.type === 'stop') {
        this.stop()
        return
      }
      const outcome = await executeAction(action, snap, {
        doc: this.deps.doc,
        win: this.deps.win,
        hostId: this.deps.hostId,
        permissions: this.deps.permissions,
        limiter: this.deps.limiter,
        confirm: this.deps.confirm,
        speak: (text) => this.deps.voice.speak(text, lang),
      })
      const label = 'label' in outcome ? outcome.label : undefined
      this.deps.audit?.({ at: Date.now(), action: action.type, label, status: outcome.status })
      if (outcome.status === 'done') {
        if (outcome.undo) this.undoStack.push(outcome.undo)
        if (action.type !== 'read') this.emit({ type: 'result', ok: true, message: `${t(lang, 'cmdDone')} ${describe(action, label)}` })
        continue
      }
      const message = `${t(lang, OUTCOME_KEY[outcome.status])}${label ? ` ${label}` : ''}`
      await this.say(false, message)
      return // never carry on with the rest of a plan after something was refused or went stale
    }
  }
}

function describe(action: Action, label: string | undefined): string {
  switch (action.type) {
    case 'click':
    case 'fill':
      return label ?? action.type
    case 'scroll':
      return `scroll ${action.direction}`
    case 'back':
      return 'back'
    case 'read':
      return 'read'
    case 'stop':
      return 'stop'
  }
}
