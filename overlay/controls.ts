import { DOWNLOAD_EXT } from '@/lib/act/risk'
import { MAX_ELEMENTS, type ElementDescriptor, type ElementRole } from '@/lib/act/schema'
import { isVisible } from './scan'

export interface ControlsSnapshot {
  elements: ElementDescriptor[]
  refs: Map<string, HTMLElement>
}

const SELECTOR = [
  'a[href]',
  'button',
  'summary',
  'input[type=submit]',
  'input[type=button]',
  'input[type=image]',
  '[role=button]',
  '[role=tab]',
  '[role=menuitem]',
  '[role=link]',
].join(',')

const clean = (text: string | null | undefined, max = 200): string => (text ?? '').replace(/\s+/g, ' ').trim().slice(0, max)

function labelOf(el: HTMLElement): string {
  const aria = clean(el.getAttribute('aria-label'))
  if (aria) return aria
  if (el instanceof HTMLInputElement) return clean(el.value || el.getAttribute('alt') || el.title)
  const text = clean(el.textContent)
  if (text) return text
  return clean(el.getAttribute('title') || el.querySelector('img')?.getAttribute('alt'))
}

function roleOf(el: HTMLElement): ElementRole {
  const explicit = el.getAttribute('role')
  if (explicit === 'tab') return 'tab'
  if (explicit === 'menuitem') return 'menuitem'
  if (el instanceof HTMLAnchorElement || explicit === 'link') return 'link'
  return 'button'
}

function isSubmit(el: HTMLElement): boolean {
  if (el instanceof HTMLInputElement) return (el.type === 'submit' || el.type === 'image') && !!el.form
  if (el instanceof HTMLButtonElement) return el.type === 'submit' && !!el.form
  return false
}

/**
 * Describes the live element exactly as it is RIGHT NOW (no id). The same function builds the snapshot sent to the planner
 * and re-checks the element just before acting, so a page that changes a button's label or destination after the
 * person asked (or while the confirmation was open) is caught.
 */
export function describeControl(el: HTMLElement): Omit<ElementDescriptor, 'id'> {
  const base: Omit<ElementDescriptor, 'id'> = { role: roleOf(el), label: labelOf(el) }
  if (isSubmit(el)) base.submit = true
  if (el instanceof HTMLAnchorElement || el.getAttribute('role') === 'link') {
    const anchor = el instanceof HTMLAnchorElement ? el : el.closest('a')
    if (anchor?.hasAttribute('href')) {
      let url: URL | null = null
      try {
        url = new URL(anchor.href, el.ownerDocument.baseURI)
      } catch {
        base.scheme = 'invalid'
      }
      if (url) {
        const scheme = url.protocol.replace(/:$/, '').toLowerCase()
        if (scheme !== 'http' && scheme !== 'https') base.scheme = scheme.slice(0, 20)
        else {
          base.hrefHost = url.host.slice(0, 200)
          const here = el.ownerDocument.location?.origin
          if (here && here !== 'null' && url.origin !== here) base.external = true
        }
        if (DOWNLOAD_EXT.test(url.pathname) || anchor.hasAttribute('download')) base.download = true
      }
    }
  }
  return base
}

export function isActionable(el: HTMLElement): boolean {
  if ((el as HTMLButtonElement).disabled) return false
  if (el.getAttribute('aria-disabled') === 'true') return false
  return isVisible(el)
}

/** Clickable things on the page, with ids. Elements inside the assistant's own panel are never included. */
export function scanControls(doc: Document, win: Window, excludeHostId: string): ControlsSnapshot {
  const all = Array.from(doc.querySelectorAll<HTMLElement>(SELECTOR)).filter(
    (el) => !el.closest(`#${excludeHostId}`) && isActionable(el),
  )
  const height = win.innerHeight || 0
  const inView = (el: HTMLElement): boolean => {
    if (!height) return true
    const r = el.getBoundingClientRect()
    return r.bottom > 0 && r.top < height
  }
  // Elements on screen first: that is what the person is talking about, and the list is capped.
  const ordered = [...all.filter(inView), ...all.filter((el) => !inView(el))]

  const elements: ElementDescriptor[] = []
  const refs = new Map<string, HTMLElement>()
  for (const el of ordered) {
    if (elements.length >= MAX_ELEMENTS) break
    const described = describeControl(el)
    if (!described.label) continue
    const id = `e${elements.length + 1}`
    elements.push({ id, ...described })
    refs.set(id, el)
  }
  return { elements, refs }
}
