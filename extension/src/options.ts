import { isAllowedApiBase, normalizeApiBase } from './api-base'
import { ext } from './ext'

declare const __API_BASE__: string

const input = document.getElementById('apiBase') as HTMLInputElement
const status = document.getElementById('status') as HTMLElement
const form = document.getElementById('form') as HTMLFormElement

void (ext.storage.local.get('apiBase') as Promise<{ apiBase?: unknown }>).then((stored) => {
  input.value = typeof stored.apiBase === 'string' ? stored.apiBase : __API_BASE__
})

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const value = normalizeApiBase(input.value)
  if (!isAllowedApiBase(value)) {
    status.textContent = 'Use an https:// address (or http://localhost for development).'
    return
  }
  void ext.storage.local.set({ apiBase: value }).then(() => {
    status.textContent = 'Saved.'
  })
})
