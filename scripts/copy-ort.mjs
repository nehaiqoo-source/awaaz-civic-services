// Copies the onnxruntime-web files the on-device photo model needs into public/ort (self-hosted, not fetched from a CDN).
import { cp, mkdir } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const from = path.join(root, 'node_modules/onnxruntime-web/dist')
const to = path.join(root, 'public/ort')
await mkdir(to, { recursive: true })
for (const f of ['ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm', 'ort-wasm-simd-threaded.asyncify.mjs', 'ort-wasm-simd-threaded.asyncify.wasm']) {
  await cp(path.join(from, f), path.join(to, f))
}
console.log('onnxruntime files copied to public/ort')
