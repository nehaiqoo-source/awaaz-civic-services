import { MAX_FIELDS, MAX_OPTIONS } from '@/lib/fill/limits'
import type { FieldDescriptor } from '@/lib/fill/schema'

export type ControlRef =
  | { kind: 'single'; el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement }
  | { kind: 'radios'; els: HTMLInputElement[] }

export interface ScannedForm {
  fields: FieldDescriptor[]
  refs: Map<string, ControlRef>
}

const SKIPPED_INPUT_TYPES = new Set([
  'hidden', 'submit', 'button', 'reset', 'image', 'file', 'range', 'color',
  'time', 'datetime-local', 'month', 'week',
])

const clean = (text: string | null | undefined, max = 300): string =>
  (text ?? '').replace(/\s+/g, ' ').trim().replace(/[*:]+$/, '').trim().slice(0, max)

/** Text of a node without the text of embedded form controls (a <select> inside a <label> would add all its options). */
function textWithoutControls(node: Element): string {
  const copy = node.cloneNode(true) as Element
  copy.querySelectorAll('select, option, input, textarea, button, script, style').forEach((n) => n.remove())
  return copy.textContent ?? ''
}

export function isVisible(el: Element): boolean {
  const withCheck = el as Element & { checkVisibility?: (options?: object) => boolean }
  if (typeof withCheck.checkVisibility === 'function') return withCheck.checkVisibility({ checkVisibilityCSS: true })
  for (let node: Element | null = el; node; node = node.parentElement) {
    if ((node as HTMLElement).hidden) return false
    const style = node.ownerDocument.defaultView?.getComputedStyle(node)
    if (style && (style.display === 'none' || style.visibility === 'hidden')) return false
  }
  return true
}

function idsToText(doc: Document, ids: string | null): string {
  if (!ids) return ''
  return ids
    .split(/\s+/)
    .map((id) => doc.getElementById(id)?.textContent ?? '')
    .join(' ')
}

function humanize(raw: string): string {
  return raw.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_\-.[\]]+/g, ' ')
}

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

function labelOf(el: Control): string {
  const doc = el.ownerDocument
  const fromLabels = Array.from(el.labels ?? []).map(textWithoutControls).join(' ')
  const candidates = [
    fromLabels,
    idsToText(doc, el.getAttribute('aria-labelledby')),
    el.getAttribute('aria-label'),
    el.getAttribute('placeholder'),
    el.getAttribute('title'),
    humanize(el.getAttribute('name') ?? el.id ?? ''),
  ]
  for (const candidate of candidates) {
    const text = clean(candidate)
    if (text) return text
  }
  return 'Field'
}

function groupLabelOf(first: HTMLInputElement): string {
  const doc = first.ownerDocument
  const fieldset = first.closest('fieldset')
  const legend = fieldset?.querySelector('legend')
  const group = first.closest('[role="radiogroup"]')
  const candidates = [
    legend?.textContent,
    idsToText(doc, group?.getAttribute('aria-labelledby') ?? null),
    group?.getAttribute('aria-label'),
    humanize(first.name),
  ]
  for (const candidate of candidates) {
    const text = clean(candidate)
    if (text) return text
  }
  return 'Choose one'
}

function isUsable(el: Control): boolean {
  return !el.disabled && !('readOnly' in el && el.readOnly) && isVisible(el)
}

export function scanForm(doc: Document, root: ParentNode = doc): ScannedForm {
  const fields: FieldDescriptor[] = []
  const refs = new Map<string, ControlRef>()
  const radioGroups = new Map<string, HTMLInputElement[]>()
  let counter = 0
  const nextId = () => `f${(counter += 1)}`

  const controls = Array.from(root.querySelectorAll<Control>('input, select, textarea'))
  const order: Array<{ kind: 'single'; el: Control } | { kind: 'radios'; key: string }> = []

  for (const el of controls) {
    if (el instanceof HTMLInputElement) {
      const type = el.type.toLowerCase()
      if (SKIPPED_INPUT_TYPES.has(type)) continue
      if (type === 'radio') {
        if (!isUsable(el)) continue
        const key = el.name ? `${el.form ? Array.from(doc.forms).indexOf(el.form) : -1}:${el.name}` : `solo:${order.length}`
        const group = radioGroups.get(key)
        if (group) group.push(el)
        else {
          radioGroups.set(key, [el])
          order.push({ kind: 'radios', key })
        }
        continue
      }
    }
    if (el instanceof HTMLSelectElement && el.multiple) continue
    if (!isUsable(el)) continue
    order.push({ kind: 'single', el })
  }

  for (const entry of order) {
    if (fields.length >= MAX_FIELDS) break
    if (entry.kind === 'radios') {
      const els = radioGroups.get(entry.key) ?? []
      const first = els[0]
      if (!first) continue
      const id = nextId()
      fields.push({
        id,
        type: 'radio',
        label: groupLabelOf(first),
        name: first.name || undefined,
        required: els.some((r) => r.required) || undefined,
        options: els.slice(0, MAX_OPTIONS).map((r) => ({
          value: r.value.slice(0, 200),
          label: clean(Array.from(r.labels ?? []).map(textWithoutControls).join(' '), 200) || r.value.slice(0, 200),
        })),
      })
      refs.set(id, { kind: 'radios', els })
      continue
    }

    const { el } = entry
    const id = nextId()
    const base = {
      id,
      label: labelOf(el),
      name: el.getAttribute('name')?.slice(0, 200) || undefined,
      placeholder: el.getAttribute('placeholder')?.slice(0, 200) || undefined,
      autocomplete: el.getAttribute('autocomplete')?.slice(0, 100) || undefined,
      required: el.required || undefined,
    }
    if (el instanceof HTMLSelectElement) {
      const options = Array.from(el.options)
        .filter((o) => o.value !== '' && !o.disabled)
        .slice(0, MAX_OPTIONS)
        .map((o) => ({ value: o.value.slice(0, 200), label: clean(o.textContent, 200) || o.value.slice(0, 200) }))
      fields.push({ ...base, type: 'select', options })
    } else if (el instanceof HTMLTextAreaElement) {
      fields.push({ ...base, type: 'textarea', maxLength: el.maxLength > 0 ? el.maxLength : undefined })
    } else {
      const type = el.type.toLowerCase()
      const mapped: FieldDescriptor['type'] =
        type === 'email' || type === 'tel' || type === 'number' || type === 'date' || type === 'checkbox' || type === 'password'
          ? type
          : 'text'
      fields.push({ ...base, type: mapped, maxLength: el.maxLength > 0 ? el.maxLength : undefined })
    }
    refs.set(id, { kind: 'single', el })
  }

  return { fields, refs }
}
