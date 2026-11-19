import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { checkPhoto, hasExif, isJpeg, MAX_PHOTO_BYTES } from '@/lib/grievance/photo'
import { geoSchema, submitInputSchema, type SubmitInput } from '@/lib/grievance/schema'
import { BlobGrievanceRepository, JsonFileGrievanceRepository, type BlobClient } from '@/lib/grievance/store'

/** Minimal JPEGs: SOI, optional APP1 "Exif" segment, a scan marker. */
const jpeg = (withExif: boolean): Uint8Array =>
  Uint8Array.from([
    0xff, 0xd8,
    ...(withExif ? [0xff, 0xe1, 0x00, 0x08, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00] : [0xff, 0xe0, 0x00, 0x04, 0x4a, 0x46]),
    0xff, 0xda, 0x00, 0x02, 0x00, 0x00, 0xff, 0xd9,
  ])

const input: SubmitInput = {
  draft: { title: 'Pothole', description: 'Big pothole in our street', category: 'roads_streetlights', urgency: 'medium', location: 'Ward 4', complainantName: '' },
  transcript: 'Big pothole in our street',
  language: 'en-IN',
  geo: { lat: 19.07601234, lng: 72.87771234, accuracyM: 12.6 },
}

describe('photo checks', () => {
  it('accepts a clean JPEG', () => {
    expect(isJpeg(jpeg(false))).toBe(true)
    expect(checkPhoto(jpeg(false))).toEqual({ ok: true })
  })
  it('refuses JPEGs that still carry EXIF (hidden GPS)', () => {
    expect(hasExif(jpeg(true))).toBe(true)
    expect(checkPhoto(jpeg(true))).toEqual({ ok: false, reason: 'has_exif' })
  })
  it('refuses non-JPEG bytes and oversize files', () => {
    expect(checkPhoto(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0]))).toEqual({ ok: false, reason: 'not_jpeg' })
    expect(checkPhoto(Uint8Array.from(Buffer.from('<svg onload=alert(1)></svg>')))).toEqual({ ok: false, reason: 'not_jpeg' })
    expect(checkPhoto(new Uint8Array(MAX_PHOTO_BYTES + 1))).toEqual({ ok: false, reason: 'too_large' })
  })
})

describe('geo', () => {
  it('rounds to about 11 metres and rejects out-of-range values', () => {
    expect(geoSchema.parse({ lat: 19.07601234, lng: 72.87771234, accuracyM: 12.6 })).toEqual({ lat: 19.076, lng: 72.8777, accuracyM: 13 })
    expect(geoSchema.safeParse({ lat: 91, lng: 0 }).success).toBe(false)
    expect(geoSchema.safeParse({ lat: 0, lng: 181 }).success).toBe(false)
    expect(geoSchema.safeParse({ lat: 'x', lng: 0 }).success).toBe(false)
    expect(submitInputSchema.parse(input).geo).toEqual({ lat: 19.076, lng: 72.8777, accuracyM: 13 })
  })
})

function contract(name: string, make: () => Promise<{ repo: JsonFileGrievanceRepository | BlobGrievanceRepository; done: () => Promise<void> }>) {
  describe(`${name}: photo upload`, () => {
    let ctx: Awaited<ReturnType<typeof make>>
    beforeEach(async () => {
      ctx = await make()
    })
    afterEach(() => ctx.done())

    it('creates a complaint with coordinates and a secret photo token', async () => {
      const g = await ctx.repo.create(submitInput())
      expect(g.geo).toEqual({ lat: 19.076, lng: 72.8777, accuracyM: 13 })
      expect(g.hasPhoto).toBe(false)
      expect(g.photoToken).toHaveLength(48)
    })
    it('stores the photo once, only with the right token', async () => {
      const g = await ctx.repo.create(submitInput())
      expect(await ctx.repo.savePhoto(g.id, 'wrong'.repeat(10), jpeg(false))).toBe('forbidden')
      expect(await ctx.repo.savePhoto(g.id, g.photoToken!, jpeg(true))).toBe('invalid')
      expect(await ctx.repo.savePhoto(g.id, g.photoToken!, jpeg(false))).toBe('saved')
      expect(await ctx.repo.savePhoto(g.id, g.photoToken!, jpeg(false))).toBe('exists')
      expect((await ctx.repo.getById(g.id))?.hasPhoto).toBe(true)
      expect(Array.from((await ctx.repo.getPhoto(g.id))!)).toEqual(Array.from(jpeg(false)))
    })
    it('unknown ids and path tricks find nothing', async () => {
      expect(await ctx.repo.savePhoto('GRV-AAAAAAAA', 'x'.repeat(48), jpeg(false))).toBe('not_found')
      expect(await ctx.repo.getPhoto('../../etc/passwd')).toBeNull()
    })
  })
}

const submitInput = (): SubmitInput => submitInputSchema.parse(input)

contract('JsonFileGrievanceRepository', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'evidence-'))
  return { repo: new JsonFileGrievanceRepository(path.join(dir, 'g.json')), done: () => rm(dir, { recursive: true, force: true }) }
})

contract('BlobGrievanceRepository (fake client)', async () => {
  const objects = new Map<string, Uint8Array>()
  const fake: BlobClient = {
    async put(p, body) {
      objects.set(p, typeof body === 'string' ? new TextEncoder().encode(body) : body)
    },
    async read(p) {
      return objects.get(p) ?? null
    },
    async exists(p) {
      return objects.has(p)
    },
  }
  return { repo: new BlobGrievanceRepository(fake, 0), done: async () => undefined }
})
