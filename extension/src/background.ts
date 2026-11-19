import { isAllowedApiBase, normalizeApiBase } from './api-base'
import { ext } from './ext'
import { actMessageSchema, fillMessageSchema } from './message-schema'
import type { ActResponse, FillResponse } from './messages'
import type { ActPlan } from '../../src/lib/act/schema'
import type { FillResult } from '../../src/lib/fill/schema'

declare const __API_BASE__: string

async function getApiBase(): Promise<string> {
  const stored = (await ext.storage.local.get('apiBase')) as { apiBase?: unknown }
  const candidate = typeof stored.apiBase === 'string' ? normalizeApiBase(stored.apiBase) : ''
  return candidate && isAllowedApiBase(candidate) ? candidate : normalizeApiBase(__API_BASE__)
}

async function forwardFill(request: unknown): Promise<FillResponse> {
  const apiBase = await getApiBase()
  if (!isAllowedApiBase(apiBase)) return { ok: false, error: 'server' }
  try {
    const response = await fetch(`${apiBase}/api/fill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    if (response.status === 429) return { ok: false, error: 'rate_limited' }
    if (!response.ok) return { ok: false, error: 'server' }
    return { ok: true, result: (await response.json()) as FillResult }
  } catch {
    return { ok: false, error: 'network' }
  }
}

async function forwardAct(request: unknown): Promise<ActResponse> {
  const apiBase = await getApiBase()
  if (!isAllowedApiBase(apiBase)) return { ok: false, error: 'server' }
  try {
    const response = await fetch(`${apiBase}/api/act`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
    if (response.status === 429) return { ok: false, error: 'rate_limited' }
    if (!response.ok) return { ok: false, error: 'server' }
    return { ok: true, plan: (await response.json()) as ActPlan }
  } catch {
    return { ok: false, error: 'network' }
  }
}

// Toolbar button: inject the assistant into the current tab (clicking again toggles it off).
ext.action.onClicked.addListener((tab) => {
  if (tab.id === undefined) return
  void ext.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }).catch(() => {
    /* restricted pages (chrome://, the Web Store) cannot be scripted */
  })
})

ext.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  // Only this extension's own content scripts (which always have a tab) may use the proxy.
  if (sender.id !== ext.runtime.id || !sender.tab) return false
  const act = actMessageSchema.safeParse(message)
  if (act.success) {
    void forwardAct(act.data.request).then(sendResponse)
    return true
  }
  const parsed = fillMessageSchema.safeParse(message)
  if (!parsed.success) {
    sendResponse({ ok: false, error: 'server' } satisfies FillResponse)
    return false
  }
  void forwardFill(parsed.data.request).then(sendResponse)
  return true
})
