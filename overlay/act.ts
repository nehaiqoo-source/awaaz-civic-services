import { capabilityForRisk, classifyElement, needsConfirmation, type Risk } from '@/lib/act/risk'
import type { Action, Capability, ElementDescriptor } from '@/lib/act/schema'
import { isSensitiveField } from '@/lib/fill/sensitive'
import type { FieldDescriptor } from '@/lib/fill/schema'
import { validateValue } from '@/lib/fill/validate'
import { applyValue, highlight } from './apply'
import { describeControl, isActionable, type ControlsSnapshot } from './controls'
import type { ActionLimiter, Permissions } from './permissions'
import type { ControlRef, ScannedForm } from './scan'

export type Outcome =
  | { status: 'done'; label?: string; undo?: () => void }
  | { status: 'blocked'; label?: string }
  | { status: 'no_permission'; capability: Capability; label?: string }
  | { status: 'declined'; label?: string }
  | { status: 'stale'; label?: string }
  | { status: 'rate_limited' }
  | { status: 'invalid' }

export interface ConfirmRequest {
  risk: Exclude<Risk, 'safe' | 'blocked'>
  label: string
  /** Host of the destination, when it is a link. */
  host?: string
}

export interface PageSnapshot {
  controls: ControlsSnapshot
  form: ScannedForm
}

export interface ActDeps {
  doc: Document
  win: Window
  hostId: string
  permissions: Permissions
  limiter: ActionLimiter
  /**
   * Must be answered by a physical click/tap of the person on the assistant's own panel (the UI checks event.isTrusted).
   * Never satisfied by speech: audio played by the page or a nearby speaker could say "yes".
   */
  confirm: (request: ConfirmRequest) => Promise<boolean>
  speak: (text: string) => Promise<void>
}

const sameControl = (a: Omit<ElementDescriptor, 'id'>, b: Omit<ElementDescriptor, 'id'>): boolean =>
  a.label === b.label &&
  a.role === b.role &&
  a.hrefHost === b.hrefHost &&
  !!a.external === !!b.external &&
  !!a.submit === !!b.submit &&
  a.scheme === b.scheme &&
  !!a.download === !!b.download

const READ_LIMIT = 1800

/** Text the person can currently see, without scripts, hidden content or the assistant's own panel. */
export function visibleText(doc: Document, hostId: string): string {
  const body = doc.body?.cloneNode(true) as HTMLElement | undefined
  if (!body) return ''
  body
    .querySelectorAll(`script, style, noscript, template, [hidden], [aria-hidden="true"], #${hostId}, #${hostId}-spacer, input, textarea, select`)
    .forEach((n) => n.remove())
  return (body.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, READ_LIMIT)
}

function needCapability(deps: ActDeps, capability: Capability): boolean {
  return deps.permissions.has(capability)
}

async function doClick(action: Extract<Action, { type: 'click' }>, snap: PageSnapshot, deps: ActDeps): Promise<Outcome> {
  const el = snap.controls.refs.get(action.target)
  const planned = snap.controls.elements.find((e) => e.id === action.target)
  if (!el || !planned) return { status: 'invalid' }
  const label = planned.label

  const live = (): Omit<ElementDescriptor, 'id'> | null => (el.isConnected && isActionable(el) ? describeControl(el) : null)
  const now = live()
  if (!now || !sameControl(now, planned)) return { status: 'stale', label }

  // Risk is decided HERE, from the live element. The model's opinion and the server's opinion are not trusted.
  const risk = classifyElement(now)
  if (risk === 'blocked') return { status: 'blocked', label }
  const capability = capabilityForRisk(risk)
  if (!needCapability(deps, capability)) return { status: 'no_permission', capability, label }

  if (needsConfirmation(risk)) {
    const confirmed = await deps.confirm({ risk: risk as 'risky' | 'external', label, host: now.hrefHost })
    if (!confirmed) return { status: 'declined', label }
    // The page may have changed while the person was deciding, and permission may have expired.
    const again = live()
    if (!again || !sameControl(again, planned) || classifyElement(again) !== risk) return { status: 'stale', label }
    if (!needCapability(deps, capability)) return { status: 'no_permission', capability, label }
  }

  if (!deps.limiter.tryTake()) return { status: 'rate_limited' }
  el.click()
  return { status: 'done', label }
}

function doFill(action: Extract<Action, { type: 'fill' }>, snap: PageSnapshot, deps: ActDeps): Outcome {
  const field: FieldDescriptor | undefined = snap.form.fields.find((f) => f.id === action.target)
  const ref: ControlRef | undefined = snap.form.refs.get(action.target)
  if (!field || !ref) return { status: 'invalid' }
  const label = field.label
  if (isSensitiveField(field)) return { status: 'blocked', label }
  const first: HTMLElement | undefined = ref.kind === 'radios' ? ref.els[0] : ref.el
  if (!first || !first.isConnected || !isActionable(first)) return { status: 'stale', label }
  if (!needCapability(deps, 'fill')) return { status: 'no_permission', capability: 'fill', label }
  const value = validateValue(field, action.value)
  if (value === null) return { status: 'invalid' }
  if (!deps.limiter.tryTake()) return { status: 'rate_limited' }
  const clear = highlight(ref)
  const undo = applyValue(ref, value)
  deps.win.setTimeout(clear, 1500)
  return { status: 'done', label, undo }
}

/**
 * Runs ONE already-sanitized action, enforcing, in this order: permission, live-element risk rules,
 * per-action physical confirmation for risky/external things, rate limit. Returns what happened; never throws on policy.
 */
export async function executeAction(action: Action, snap: PageSnapshot, deps: ActDeps): Promise<Outcome> {
  switch (action.type) {
    case 'stop':
      return { status: 'done' }
    case 'click':
      return doClick(action, snap, deps)
    case 'fill':
      return doFill(action, snap, deps)
    case 'scroll': {
      if (!needCapability(deps, 'view')) return { status: 'no_permission', capability: 'view' }
      if (!deps.limiter.tryTake()) return { status: 'rate_limited' }
      const { win, doc } = deps
      const step = Math.max(200, Math.round((win.innerHeight || 600) * 0.8))
      const top = action.direction === 'top' ? 0 : action.direction === 'bottom' ? doc.documentElement.scrollHeight : undefined
      if (top !== undefined) win.scrollTo({ top, behavior: 'smooth' })
      else win.scrollBy({ top: action.direction === 'down' ? step : -step, behavior: 'smooth' })
      return { status: 'done' }
    }
    case 'back':
      if (!needCapability(deps, 'click')) return { status: 'no_permission', capability: 'click' }
      if (!deps.limiter.tryTake()) return { status: 'rate_limited' }
      deps.win.history.back()
      return { status: 'done' }
    case 'read': {
      if (!needCapability(deps, 'view')) return { status: 'no_permission', capability: 'view' }
      const text = visibleText(deps.doc, deps.hostId)
      if (text) await deps.speak(text)
      return { status: 'done' }
    }
  }
}
