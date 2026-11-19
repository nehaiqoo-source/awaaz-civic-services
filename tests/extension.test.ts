import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { isAllowedApiBase, normalizeApiBase } from '../extension/src/api-base'

const readManifest = (name: string) =>
  JSON.parse(readFileSync(path.join(__dirname, '..', 'extension', name), 'utf8')) as Record<string, unknown>

describe('isAllowedApiBase', () => {
  it('allows https and local http only', () => {
    expect(isAllowedApiBase('https://awaaz.example.in')).toBe(true)
    expect(isAllowedApiBase('http://localhost:3000')).toBe(true)
    expect(isAllowedApiBase('http://127.0.0.1:3000')).toBe(true)
  })
  it('rejects plain http to remote hosts, credentials, odd schemes and junk', () => {
    expect(isAllowedApiBase('http://evil.example.com')).toBe(false)
    expect(isAllowedApiBase('https://user:pass@evil.example.com')).toBe(false)
    expect(isAllowedApiBase('javascript:alert(1)')).toBe(false)
    expect(isAllowedApiBase('https://a.example.com?x=1')).toBe(false)
    expect(isAllowedApiBase('not a url')).toBe(false)
  })
  it('strips trailing slashes', () => {
    expect(normalizeApiBase(' https://a.example.com// ')).toBe('https://a.example.com')
  })
})

describe('extension manifests', () => {
  for (const name of ['manifest.chrome.json', 'manifest.firefox.json']) {
    it(`${name} is MV3 with minimal permissions`, () => {
      const manifest = readManifest(name)
      expect(manifest.manifest_version).toBe(3)
      expect(manifest.permissions).toEqual(['activeTab', 'scripting', 'storage'])
      // No always-on access to every site: pages are only touched when the user clicks the toolbar button.
      expect(manifest).not.toHaveProperty('content_scripts')
      expect(manifest.host_permissions).toEqual(['http://localhost/*', 'http://127.0.0.1/*'])
    })
  }
  it('uses the right background style per browser', () => {
    expect(readManifest('manifest.chrome.json').background).toEqual({ service_worker: 'background.js' })
    expect(readManifest('manifest.firefox.json').background).toEqual({ scripts: ['background.js'] })
  })
})
