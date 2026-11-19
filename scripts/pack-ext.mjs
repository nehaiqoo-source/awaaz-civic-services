// Builds the extensions and zips them for store upload / sharing: release/awaaz-chrome.zip (Chrome, Edge, Brave), awaaz-firefox.zip.
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
execFileSync('node', [path.join(root, 'scripts/build-ext.mjs')], { stdio: 'inherit', cwd: root })
const release = path.join(root, 'release')
mkdirSync(release, { recursive: true })
for (const target of ['chrome', 'firefox']) {
  const zip = path.join(release, `awaaz-${target}.zip`)
  rmSync(zip, { force: true })
  execFileSync('zip', ['-qr', '-X', zip, '.'], { cwd: path.join(root, 'extension/dist', target), stdio: 'inherit' })
  console.log(`wrote ${path.relative(root, zip)}`)
}
