import { randomBytes, timingSafeEqual } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { get, put } from '@vercel/blob'
import path from 'node:path'
import { checkPhoto } from './photo'
import { TRACKING_ID_PATTERN, type Grievance, type SubmitInput } from './schema'

/** Crockford base32 without I, L, O, U: easy to read aloud and type. */
const ID_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

export function generateTrackingId(): string {
  const bytes = randomBytes(8)
  const chars = Array.from(bytes, (b) => ID_ALPHABET[b % 32]).join('')
  return `GRV-${chars}`
}

export function isValidTrackingId(id: string): boolean {
  return TRACKING_ID_PATTERN.test(id)
}

export type PhotoSaveResult = 'saved' | 'not_found' | 'forbidden' | 'exists' | 'invalid'

export interface GrievanceRepository {
  create(input: SubmitInput): Promise<Grievance>
  getById(id: string): Promise<Grievance | null>
  /** Stores the single photo of a complaint. Requires the submitter's one-time token. */
  savePhoto(id: string, token: string, bytes: Uint8Array): Promise<PhotoSaveResult>
  getPhoto(id: string): Promise<Uint8Array | null>
}

export function generatePhotoToken(): string {
  return randomBytes(24).toString('hex')
}

function tokenMatches(expected: string | undefined, given: string): boolean {
  if (!expected) return false
  const a = Buffer.from(expected)
  const b = Buffer.from(given)
  return a.length === b.length && timingSafeEqual(a, b)
}

function buildGrievance(input: SubmitInput, id: string): Grievance {
  return {
    ...input.draft,
    id,
    transcript: input.transcript,
    language: input.language ?? null,
    status: 'received',
    createdAt: new Date().toISOString(),
    ...(input.geo ? { geo: input.geo } : {}),
    hasPhoto: false,
    photoToken: generatePhotoToken(),
  }
}

/**
 * MVP persistence: a single JSON file with serialized writes and atomic replace.
 * Swap for a real database behind GrievanceRepository before production use.
 */
export class JsonFileGrievanceRepository implements GrievanceRepository {
  private queue: Promise<unknown> = Promise.resolve()

  constructor(private readonly filePath: string) {}

  private async readAll(): Promise<Grievance[]> {
    try {
      return JSON.parse(await readFile(this.filePath, 'utf8')) as Grievance[]
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
      throw error
    }
  }

  private async writeAll(items: Grievance[]): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true })
    const tmp = `${this.filePath}.${process.pid}.tmp`
    await writeFile(tmp, JSON.stringify(items, null, 2), 'utf8')
    await rename(tmp, this.filePath)
  }

  private serialize<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task, task)
    this.queue = run.catch(() => undefined)
    return run
  }

  create(input: SubmitInput): Promise<Grievance> {
    return this.serialize(async () => {
      const items = await this.readAll()
      let id = generateTrackingId()
      while (items.some((g) => g.id === id)) id = generateTrackingId()
      const grievance = buildGrievance(input, id)
      await this.writeAll([...items, grievance])
      return grievance
    })
  }

  private photoPath(id: string): string {
    return path.join(path.dirname(this.filePath), 'photos', `${id}.jpg`)
  }

  savePhoto(id: string, token: string, bytes: Uint8Array): Promise<PhotoSaveResult> {
    return this.serialize(async () => {
      if (!checkPhoto(bytes).ok) return 'invalid'
      const items = await this.readAll()
      const found = items.find((g) => g.id === id)
      if (!found) return 'not_found'
      if (!tokenMatches(found.photoToken, token)) return 'forbidden'
      if (found.hasPhoto) return 'exists'
      await mkdir(path.dirname(this.photoPath(id)), { recursive: true })
      await writeFile(this.photoPath(id), bytes)
      await this.writeAll(items.map((g) => (g.id === id ? { ...g, hasPhoto: true } : g)))
      return 'saved'
    })
  }

  async getPhoto(id: string): Promise<Uint8Array | null> {
    if (!isValidTrackingId(id)) return null
    try {
      return new Uint8Array(await readFile(this.photoPath(id)))
    } catch {
      return null
    }
  }

  getById(id: string): Promise<Grievance | null> {
    return this.serialize(async () => (await this.readAll()).find((g) => g.id === id) ?? null)
  }
}

/** Minimal slice of @vercel/blob used here, so tests can pass a fake. */
export interface BlobClient {
  put(pathname: string, body: string | Uint8Array, contentType: string): Promise<void>
  read(pathname: string): Promise<Uint8Array | null>
  exists(pathname: string): Promise<boolean>
}

/** Private Vercel Blob store: nothing here is reachable by URL, only through this server. */
export function vercelBlobClient(): BlobClient {
  return {
    async put(pathname, body, contentType) {
      await put(pathname, body as string, { access: 'private', contentType, addRandomSuffix: false, allowOverwrite: true })
    },
    async read(pathname) {
      const result = await get(pathname, { access: 'private' })
      if (!result || result.statusCode !== 200) return null
      return new Uint8Array(await new Response(result.stream).arrayBuffer())
    },
    async exists(pathname) {
      return (await get(pathname, { access: 'private' })) !== null
    },
  }
}

export class BlobGrievanceRepository implements GrievanceRepository {
  private queue: Promise<unknown> = Promise.resolve()
  /** `retryDelayMs`: Blob reads can briefly miss a record written a moment ago, so a missing record is re-read a few times. */
  constructor(private readonly blob: BlobClient, private readonly retryDelayMs = 600) {}

  private async readWithRetry(id: string): Promise<Grievance | null> {
    for (let attempt = 0; attempt < 4; attempt++) {
      const found = await this.read(id)
      if (found) return found
      await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs))
    }
    return null
  }

  private serialize<T>(task: () => Promise<T>): Promise<T> {
    const run = this.queue.then(task, task)
    this.queue = run.catch(() => undefined)
    return run
  }

  private recordPath = (id: string) => `grievances/${id}.json`
  private photoPath = (id: string) => `photos/${id}.jpg`

  private async read(id: string): Promise<Grievance | null> {
    const bytes = await this.blob.read(this.recordPath(id))
    return bytes ? (JSON.parse(new TextDecoder().decode(bytes)) as Grievance) : null
  }

  private write(g: Grievance): Promise<void> {
    return this.blob.put(this.recordPath(g.id), JSON.stringify(g), 'application/json')
  }

  create(input: SubmitInput): Promise<Grievance> {
    return this.serialize(async () => {
      let id = generateTrackingId()
      while (await this.blob.exists(this.recordPath(id))) id = generateTrackingId()
      const grievance = buildGrievance(input, id)
      await this.write(grievance)
      return grievance
    })
  }

  getById(id: string): Promise<Grievance | null> {
    return isValidTrackingId(id) ? this.read(id) : Promise.resolve(null)
  }

  savePhoto(id: string, token: string, bytes: Uint8Array): Promise<PhotoSaveResult> {
    return this.serialize(async () => {
      if (!checkPhoto(bytes).ok) return 'invalid'
      if (!isValidTrackingId(id)) return 'not_found'
      const found = await this.readWithRetry(id)
      if (!found) return 'not_found'
      if (!tokenMatches(found.photoToken, token)) return 'forbidden'
      if (found.hasPhoto) return 'exists'
      await this.blob.put(this.photoPath(id), bytes, 'image/jpeg')
      await this.write({ ...found, hasPhoto: true })
      return 'saved'
    })
  }

  async getPhoto(id: string): Promise<Uint8Array | null> {
    return isValidTrackingId(id) ? this.blob.read(this.photoPath(id)) : null
  }
}

let repository: GrievanceRepository | null = null

export function getRepository(): GrievanceRepository {
  repository ??= process.env.BLOB_READ_WRITE_TOKEN
    ? new BlobGrievanceRepository(vercelBlobClient())
    : new JsonFileGrievanceRepository(process.env.GRIEVANCE_DATA_FILE || path.join(process.cwd(), 'data', 'grievances.json'))
  return repository
}
