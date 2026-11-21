// Renders the Awaaz app icons (Expo assets and Android launcher/splash resources) with no image dependencies.
// Same artwork as scripts/make-icons.mjs: saffron-to-orange gradient with a white microphone.
// Android webp files are converted with `cwebp` (brew install webp).
import { deflateSync } from 'node:zlib'
import { writeFile, mkdir } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const assets = path.join(root, 'mobile/assets')
const res = path.join(root, 'mobile/android/app/src/main/res')

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

const inRound = (x, y, x0, y0, x1, y1, r) => {
  const cx = Math.min(Math.max(x, x0 + r), x1 - r)
  const cy = Math.min(Math.max(y, y0 + r), y1 - r)
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r && x >= x0 && x <= x1 && y >= y0 && y <= y1
}
const micAt = (x, y) => {
  const mic = inRound(x, y, 0.4, 0.2, 0.6, 0.54, 0.1)
  const dx = x - 0.5, dy = y - 0.5
  const d = Math.hypot(dx, dy)
  const cup = dy > 0.04 && dy < 0.3 && d > 0.2 && d < 0.26
  const stem = x > 0.485 && x < 0.515 && y >= 0.72 && y < 0.8
  const base = x > 0.4 && x < 0.6 && y >= 0.78 && y < 0.82
  return mic || cup || stem || base
}
const gradient = (x, y) => {
  const t = (x + y) / 2
  return [255 - 61 * t, 153 - 88 * t, 51 - 39 * t]
}

// A layer is a function (x, y) in the unit square -> [r, g, b, a] (a is 0 or 255).
const scaleAround = (k) => (x, y) => [0.5 + (x - 0.5) / k, 0.5 + (y - 0.5) / k]
const layers = {
  // Full-bleed square (store icon, iOS-style). Microphone fills the usual icon area.
  square: (x, y) => (micAt(x, y) ? [255, 255, 255, 255] : [...gradient(x, y), 255]),
  // Legacy launcher icon: rounded square.
  rounded: (x, y) => (inRound(x, y, 0, 0, 1, 1, 0.22) ? layers.square(x, y) : [0, 0, 0, 0]),
  // Legacy round launcher icon.
  circle: (x, y) => ((x - 0.5) ** 2 + (y - 0.5) ** 2 <= 0.25 ? layers.square(x, y) : [0, 0, 0, 0]),
  // Adaptive icon background: gradient only.
  background: (x, y) => [...gradient(x, y), 255],
  // Adaptive foreground: white microphone inside the safe zone (about 66% of the canvas).
  foreground: (x, y) => {
    const [u, v] = scaleAround(0.78)(x, y)
    return micAt(u, v) ? [255, 255, 255, 255] : [0, 0, 0, 0]
  },
  // Themed (monochrome) adaptive layer.
  monochrome: (x, y) => {
    const [u, v] = scaleAround(0.78)(x, y)
    return micAt(u, v) ? [0, 0, 0, 255] : [0, 0, 0, 0]
  },
  // Splash logo: white microphone on transparent (the splash background colour is set in colors.xml).
  splash: (x, y) => {
    const [u, v] = scaleAround(0.5)(x, y)
    return micAt(u, v) ? [255, 255, 255, 255] : [0, 0, 0, 0]
  },
}

function png(layer, size) {
  const ss = 4
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0
      for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
        const [pr, pg, pb, pa] = layer((x + (sx + 0.5) / ss) / size, (y + (sy + 0.5) / ss) / size)
        r += pr * pa; g += pg * pa; b += pb * pa; a += pa
      }
      const o = y * (size * 4 + 1) + 1 + x * 4
      raw[o] = a ? Math.round(r / a) : 0; raw[o + 1] = a ? Math.round(g / a) : 0; raw[o + 2] = a ? Math.round(b / a) : 0
      raw[o + 3] = Math.round(a / (ss * ss))
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

const toWebp = (pngPath, webpPath) => execFileSync('cwebp', ['-quiet', '-lossless', '-exact', pngPath, '-o', webpPath])
const tmp = path.join(import.meta.dirname, '.icon-tmp.png')

// Expo assets
await mkdir(assets, { recursive: true })
await writeFile(path.join(assets, 'icon.png'), png(layers.square, 1024))
await writeFile(path.join(assets, 'android-icon-foreground.png'), png(layers.foreground, 512))
await writeFile(path.join(assets, 'android-icon-background.png'), png(layers.background, 512))
await writeFile(path.join(assets, 'android-icon-monochrome.png'), png(layers.monochrome, 432))
await writeFile(path.join(assets, 'splash-icon.png'), png(layers.splash, 1024))
await writeFile(path.join(assets, 'favicon.png'), png(layers.rounded, 48))

// Android launcher resources: legacy icons are 48dp, adaptive layers 108dp, per density.
const density = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 }
for (const [name, scale] of Object.entries(density)) {
  const dir = path.join(res, `mipmap-${name}`)
  const legacy = Math.round(48 * scale)
  const adaptive = Math.round(108 * scale)
  const jobs = [
    ['ic_launcher', layers.rounded, legacy],
    ['ic_launcher_round', layers.circle, legacy],
    ['ic_launcher_background', layers.background, adaptive],
    ['ic_launcher_foreground', layers.foreground, adaptive],
    ['ic_launcher_monochrome', layers.monochrome, adaptive],
  ]
  for (const [file, layer, size] of jobs) {
    await writeFile(tmp, png(layer, size))
    toWebp(tmp, path.join(dir, `${file}.webp`))
  }
  // Splash logo: 288dp canvas.
  await writeFile(path.join(res, `drawable-${name}`, 'splashscreen_logo.png'), png(layers.splash, Math.round(288 * scale)))
}
// Play Store listing icon: 512x512 full square (Google applies its own mask).
const play = path.join(root, 'store/play/assets')
await mkdir(play, { recursive: true })
await writeFile(path.join(play, 'app-icon-512.png'), png(layers.square, 512))
console.log('app icons written')
