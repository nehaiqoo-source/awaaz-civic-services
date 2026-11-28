import type { ControlRef } from './scan'

type TextLike = HTMLInputElement | HTMLTextAreaElement

/** Sets a value the way a user would, so frameworks (React, Angular, Vue) notice it. */
function setNativeValue(el: TextLike | HTMLSelectElement, value: string): void {
  const proto = Object.getPrototypeOf(el) as object
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  if (setter) setter.call(el, value)
  else el.value = value
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

/**
 * Replaces the text of a rich text box. Editors such as X's composer keep their own model of the text, so
 * we type through the browser's editing command (as a paste would) instead of setting textContent.
 */
function replaceEditableText(el: HTMLElement, value: string): void {
  const doc = el.ownerDocument
  el.focus()
  const selection = doc.getSelection()
  if (selection) {
    const range = doc.createRange()
    range.selectNodeContents(el)
    selection.removeAllRanges()
    selection.addRange(range)
  }
  const typed = typeof doc.execCommand === 'function' && doc.execCommand(value ? 'insertText' : 'delete', false, value)
  if (!typed) {
    el.textContent = value
    el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: value }))
  }
}

function clickRadio(radio: HTMLInputElement): void {
  if (!radio.checked) radio.click()
}

/** Writes a validated value into the control. Returns a function that restores the previous state. */
export function applyValue(ref: ControlRef, value: string): () => void {
  if (ref.kind === 'radios') {
    const previous = ref.els.find((r) => r.checked)
    const target = ref.els.find((r) => r.value === value)
    if (target) clickRadio(target)
    return () => {
      if (previous) clickRadio(previous)
      else if (target) {
        target.checked = false
        target.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }
  }

  if (ref.kind === 'editable') {
    const before = ref.el.innerText ?? ref.el.textContent ?? ''
    replaceEditableText(ref.el, value)
    return () => replaceEditableText(ref.el, before)
  }

  const { el } = ref
  if (el instanceof HTMLInputElement && el.type === 'checkbox') {
    const before = el.checked
    const desired = value === 'true'
    if (before !== desired) el.click()
    return () => {
      if (el.checked !== before) el.click()
    }
  }

  const before = el.value
  setNativeValue(el, value)
  return () => setNativeValue(el, before)
}

const HIGHLIGHT = '3px solid #b8460f'
/** Distance from the top of the viewport at which the active field is placed, so the bottom panel never covers it. */
const TOP_OFFSET_PX = 90

function scrollNearTop(el: HTMLElement): void {
  const win = el.ownerDocument.defaultView
  if (!win || typeof win.scrollTo !== 'function') return
  const rect = el.getBoundingClientRect()
  win.scrollTo({ top: win.scrollY + rect.top - TOP_OFFSET_PX, behavior: 'smooth' })
}

/** Scrolls the control into view and outlines it. Returns a function that removes the outline. */
export function highlight(ref: ControlRef): () => void {
  const els: HTMLElement[] = ref.kind === 'radios' ? ref.els : [ref.el]
  const first = els[0]
  if (first) scrollNearTop(first)
  const saved = els.map((e) => [e.style.outline, e.style.outlineOffset] as const)
  for (const e of els) {
    e.style.outline = HIGHLIGHT
    e.style.outlineOffset = '2px'
  }
  return () =>
    els.forEach((e, i) => {
      e.style.outline = saved[i]?.[0] ?? ''
      e.style.outlineOffset = saved[i]?.[1] ?? ''
    })
}
