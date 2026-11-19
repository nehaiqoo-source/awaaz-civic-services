// Renders the Awaaz icon (orange rounded square + white microphone) to PNGs with no dependencies.
import { deflateSync } from 'node:zlib'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const out = path.resolve(import.meta.dirname, '../extension/icons')
await mkdir(out, { recursive: true })

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const body = Buffer.concat([Buffer.from(type), data])
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body))
  return Buffer.concat([len, body, sum])
}

// Shapes in a 0..1 unit square. Returns [r,g,b,a] coverage at a point.
const inRound = (x, y, x0, y0, x1, y1, r) => {
  const cx = Math.min(Math.max(x, x0 + r), x1 - r)
  const cy = Math.min(Math.max(y, y0 + r), y1 - r)
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r && x >= x0 && x <= x1 && y >= y0 && y <= y1
}
function sample(x, y) {
  if (!inRound(x, y, 0, 0, 1, 1, 0.22)) return [0, 0, 0, 0]
  const t = (x + y) / 2
  let c = [255 - 61 * t, 153 - 88 * t, 51 - 39 * t] // saffron -> burnt orange
  const mic = inRound(x, y, 0.4, 0.2, 0.6, 0.54, 0.1)
  const dx = x - 0.5, dy = y - 0.5
  const d = Math.hypot(dx, dy - 0.0)
  const cup = dy > 0.02 && dy < 0.3 && d > 0.2 && d < 0.26 // U-shaped holder
  const stem = x > 0.485 && x < 0.515 && y >= 0.72 && y < 0.8
  const base = x > 0.4 && x < 0.6 && y >= 0.78 && y < 0.82
  if (mic || (cup && dy > 0.04) || stem || base) c = [255, 255, 255]
  return [...c, 255]
}

for (const size of [16, 32, 48, 128, 180, 192, 512]) {
  const ss = 4
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0
      for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
        const [pr, pg, pb, pa] = sample((x + (sx + 0.5) / ss) / size, (y + (sy + 0.5) / ss) / size)
        r += pr * pa; g += pg * pa; b += pb * pa; a += pa
      }
      const o = y * (size * 4 + 1) + 1 + x * 4
      raw[o] = a ? Math.round(r / a) : 0; raw[o + 1] = a ? Math.round(g / a) : 0; raw[o + 2] = a ? Math.round(b / a) : 0
      raw[o + 3] = Math.round(a / (ss * ss))
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
  if (size >= 180) await writeFile(path.join(root, 'public', `icon-${size}.png`), png)
  else await writeFile(path.join(out, `icon-${size}.png`), png)
}
console.log('icons written')
