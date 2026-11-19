import { MAX_PHOTO_BYTES } from '@/lib/grievance/photo'

const MAX_SIDE = 1280

export interface ProcessedPhoto {
  blob: Blob
  base64: string
  previewUrl: string
}

/**
 * Re-draws the picture onto a canvas and exports a fresh JPEG. That drops every metadata block (EXIF, including any
 * hidden GPS position, camera and time) because the canvas only holds pixels. The server refuses JPEGs that still have EXIF.
 */
export async function processPhoto(file: File): Promise<ProcessedPhoto> {
  if (!file.type.startsWith('image/')) throw new Error('not_image')
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no_canvas')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  for (const quality of [0.8, 0.65, 0.5, 0.35]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (blob && blob.size <= MAX_PHOTO_BYTES) {
      return { blob, base64: await toBase64(blob), previewUrl: URL.createObjectURL(blob) }
    }
  }
  throw new Error('too_large')
}

async function toBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

export interface PlaceFix {
  lat: number
  lng: number
  accuracyM: number
}

/** Only ever called from a button tap. */
export function getPlace(): Promise<PlaceFix> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('unsupported'))
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracyM: p.coords.accuracy }),
      (e) => reject(new Error(e.code === 1 ? 'denied' : 'failed')),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    )
  })
}
