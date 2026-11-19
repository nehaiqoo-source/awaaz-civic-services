/** Photos are re-encoded to JPEG in the browser (which also removes EXIF/GPS); the server accepts nothing else. */
export const MAX_PHOTO_BYTES = 1_500_000

export function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 4 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
}

/** True if a JPEG still carries an EXIF (APP1 "Exif") segment, e.g. hidden GPS coordinates. */
export function hasExif(bytes: Uint8Array): boolean {
  let i = 2
  while (i + 4 < bytes.length && bytes[i] === 0xff) {
    const marker = bytes[i + 1]
    if (marker === 0xda) break // start of scan: no more metadata segments
    const length = ((bytes[i + 2] ?? 0) << 8) | (bytes[i + 3] ?? 0)
    if (length < 2) break
    if (marker === 0xe1 && bytes[i + 4] === 0x45 && bytes[i + 5] === 0x78 && bytes[i + 6] === 0x69 && bytes[i + 7] === 0x66) return true
    i += 2 + length
  }
  return false
}

export type PhotoCheck = { ok: true } | { ok: false; reason: 'too_large' | 'not_jpeg' | 'has_exif' }

export function checkPhoto(bytes: Uint8Array): PhotoCheck {
  if (bytes.length > MAX_PHOTO_BYTES) return { ok: false, reason: 'too_large' }
  if (!isJpeg(bytes)) return { ok: false, reason: 'not_jpeg' }
  if (hasExif(bytes)) return { ok: false, reason: 'has_exif' }
  return { ok: true }
}
