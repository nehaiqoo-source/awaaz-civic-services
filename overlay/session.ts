import { isSensitiveField } from '@/lib/fill/sensitive'
import type { FieldDescriptor, FillResult } from '@/lib/fill/schema'
import { validateValue } from '@/lib/fill/validate'
import { applyValue, highlight } from './apply'
import { questionFor, t } from './i18n'
import { scanForm, type ControlRef, type ScannedForm } from './scan'
import type { Transport } from './transport'
import { VoiceError, type ListenHandle, type VoiceIO } from './voice'

export type SessionEvent =
  | { type: 'scanned'; total: number; fillable: number; manual: number }
  | { type: 'ask'; index: number; total: number; field: FieldDescriptor; question: string }
  | { type: 'listening' }
  | { type: 'interim'; text: string }
  | { type: 'heard'; text: string }
  | { type: 'filled'; field: FieldDescriptor; value: string }
  | { type: 'retry'; message: string }
  | { type: 'manual'; field: FieldDescriptor; message: string }
  | { type: 'skipped'; field: FieldDescriptor }
  | { type: 'undone'; field: FieldDescriptor }
  | { type: 'done'; filled: number; skipped: number; message: string; manual: string[] }
  | { type: 'error'; code: string }

export interface SessionDeps {
  doc: Document
  voice: VoiceIO
  transport: Transport
  lang: string
  /** false = on-device only: answers are validated locally and nothing is sent to the server. Default true. */
  allowServer?: boolean
  onEvent: (event: SessionEvent) => void
}

const MAX_ATTEMPTS = 3
/** How long someone may pause mid-answer before we take the answer as finished. */
const ANSWER_SILENCE_MS = 1800

/** Email addresses are Latin letters: Hindi recognition would write them in Devanagari, so always use English there. */
export function listenLang(field: FieldDescriptor, lang: string): string {
  return field.type === 'email' ? 'en-IN' : lang
}

/** The first heard version that is a valid value for the field (free text accepts the best guess). */
export function firstValid(field: FieldDescriptor, heard: ReadonlyArray<string>): string | null {
  for (const text of heard) {
    const value = validateValue(field, text)
    if (value !== null) return value
  }
  return null
}

/** Orchestrates scanning, asking, listening, validating (server-side) and filling. UI-agnostic and unit-testable. */
export class FillSession {
  private scanned: ScannedForm | null = null
  private stopped = false
  private skipRequested = false
  private currentListen: ListenHandle | null = null
  private readonly undoStack: Array<{ field: FieldDescriptor; undo: () => void }> = []
  private readonly filledIds = new Set<string>()

  private readonly allowServer: boolean

  constructor(private readonly deps: SessionDeps) {
    this.allowServer = deps.allowServer ?? true
  }

  private emit(event: SessionEvent): void {
    this.deps.onEvent(event)
  }

  scan(): ScannedForm {
    this.scanned = scanForm(this.deps.doc)
    const manual = this.scanned.fields.filter(isSensitiveField).length
    this.emit({
      type: 'scanned',
      total: this.scanned.fields.length,
      fillable: this.scanned.fields.length - manual,
      manual,
    })
    return this.scanned
  }

  /** Asks each field in order. */
  async runGuided(): Promise<void> {
    this.stopped = false
    const { fields, refs } = this.scan()
    if (fields.length === 0) {
      this.emit({ type: 'done', filled: 0, skipped: 0, message: t(this.deps.lang, 'noFields'), manual: [] })
      return
    }
    let skipped = 0
    const manualLabels: string[] = []
    for (let index = 0; index < fields.length && !this.stopped; index += 1) {
      const field = fields[index]
      const ref = refs.get(field?.id ?? '')
      if (!field || !ref) continue
      const clearHighlight = highlight(ref)
      try {
        if (isSensitiveField(field)) {
          const message = t(this.deps.lang, 'manual')
          this.emit({ type: 'manual', field, message })
          await this.deps.voice.speak(message, this.deps.lang)
          skipped += 1
          manualLabels.push(field.label)
          continue
        }
        const ok = await this.askField(field, ref, index, fields.length)
        if (!ok && !this.stopped) {
          skipped += 1
          this.emit({ type: 'skipped', field })
        }
      } finally {
        clearHighlight()
      }
    }
    if (!this.stopped) {
      const message = t(this.deps.lang, 'done')
      this.emit({ type: 'done', filled: this.filledIds.size, skipped, message, manual: manualLabels })
      await this.deps.voice.speak(message, this.deps.lang)
    }
  }

  private async askField(field: FieldDescriptor, ref: ControlRef, index: number, total: number): Promise<boolean> {
    const question = questionFor(field, this.deps.lang)
    this.skipRequested = false
    for (let attempt = 0; attempt < MAX_ATTEMPTS && !this.stopped && !this.skipRequested; attempt += 1) {
      this.emit({ type: 'ask', index, total, field, question })
      await this.deps.voice.speak(question, this.deps.lang)
      if (this.stopped || this.skipRequested) return false

      let transcript: string
      let alternatives: string[] = []
      try {
        this.emit({ type: 'listening' })
        this.currentListen = this.deps.voice.listen({
          lang: listenLang(field, this.deps.lang),
          endSilenceMs: ANSWER_SILENCE_MS,
          onInterim: (text) => this.emit({ type: 'interim', text }),
        })
        transcript = await this.currentListen.result
        alternatives = this.currentListen.alternatives?.() ?? []
      } catch (error) {
        if (this.stopped || this.skipRequested) return false
        const code = error instanceof VoiceError ? error.code : 'other'
        if (code === 'no-speech') {
          this.emit({ type: 'retry', message: t(this.deps.lang, 'retry') })
          continue
        }
        this.emit({ type: 'error', code })
        this.stopped = true
        return false
      } finally {
        this.currentListen = null
      }
      if (this.stopped || this.skipRequested) return false
      this.emit({ type: 'heard', text: transcript })

      // On-device first: only when the local rules cannot understand the answer does it go to the server (if allowed).
      // The recogniser's other guesses often hold the right one ("9 8 7" vs "nine ate seven"), so try each.
      let value: string | null = firstValid(field, [transcript, ...alternatives])
      if (value === null && this.allowServer) {
        try {
          const result = await this.deps.transport({ transcript, language: this.deps.lang, fields: [field] })
          value = result.values[field.id] ?? null
        } catch (error) {
          this.emit({ type: 'error', code: error instanceof Error ? error.message : 'network' })
          this.stopped = true
          return false
        }
      }
      if (value !== null) {
        const undo = applyValue(ref, value)
        this.undoStack.push({ field, undo })
        this.filledIds.add(field.id)
        this.emit({ type: 'filled', field, value })
        return true
      }
      this.emit({ type: 'retry', message: t(this.deps.lang, 'retry') })
      await this.deps.voice.speak(t(this.deps.lang, 'retry'), this.deps.lang)
    }
    return false
  }

  /** "Tell everything at once": one free-form recording mapped onto all fillable fields by the AI. */
  async runBatch(): Promise<void> {
    this.stopped = false
    if (!this.allowServer) {
      this.emit({ type: 'error', code: 'offline_mode' })
      return
    }
    const { fields, refs } = this.scan()
    const fillable = fields.filter((f) => !isSensitiveField(f))
    if (fillable.length === 0) {
      this.emit({ type: 'done', filled: 0, skipped: 0, message: t(this.deps.lang, 'noFields'), manual: [] })
      return
    }
    let transcript: string
    try {
      this.emit({ type: 'listening' })
      this.currentListen = this.deps.voice.listen({
        lang: this.deps.lang,
        continuous: true,
        timeoutMs: 90_000,
        onInterim: (text) => this.emit({ type: 'interim', text }),
      })
      transcript = await this.currentListen.result
    } catch (error) {
      this.emit({ type: 'error', code: error instanceof VoiceError ? error.code : 'other' })
      return
    } finally {
      this.currentListen = null
    }
    this.emit({ type: 'heard', text: transcript })

    let result: FillResult
    try {
      result = await this.deps.transport({ transcript, language: this.deps.lang, fields: fillable })
    } catch (error) {
      this.emit({ type: 'error', code: error instanceof Error ? error.message : 'network' })
      return
    }
    const aiMissing = result.skipped.some((s) => s.reason === 'ai_unavailable')
    for (const field of fillable) {
      const value = result.values[field.id]
      const ref = refs.get(field.id)
      if (value === undefined || !ref) continue
      this.undoStack.push({ field, undo: applyValue(ref, value) })
      this.filledIds.add(field.id)
      this.emit({ type: 'filled', field, value })
    }
    if (aiMissing) {
      this.emit({ type: 'error', code: 'ai_unavailable' })
      return
    }
    const skipped = fillable.length - Object.keys(result.values).length
    this.emit({
      type: 'done',
      filled: this.filledIds.size,
      skipped,
      message: t(this.deps.lang, 'done'),
      manual: fields.filter(isSensitiveField).map((f) => f.label),
    })
  }

  /** Skip the current question. */
  skip(): void {
    this.skipRequested = true
    this.deps.voice.cancelSpeech()
    this.currentListen?.stop()
  }

  /** Stop the whole session. */
  stop(): void {
    this.stopped = true
    this.deps.voice.cancelSpeech()
    this.currentListen?.stop()
  }

  /** Undo the most recently filled field. */
  undo(): void {
    const last = this.undoStack.pop()
    if (!last) return
    last.undo()
    this.filledIds.delete(last.field.id)
    this.emit({ type: 'undone', field: last.field })
  }
}
