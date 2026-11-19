import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { SubmitInput } from '@/lib/grievance/schema'
import { JsonFileGrievanceRepository, generateTrackingId, isValidTrackingId } from '@/lib/grievance/store'

const input: SubmitInput = {
  draft: {
    title: 'No water',
    description: 'No water supply for five days',
    category: 'water_supply',
    urgency: 'high',
    location: 'Ward 4',
    complainantName: 'Asha',
  },
  transcript: 'No water supply for five days',
  language: 'en-IN',
}

describe('tracking ids', () => {
  it('generates valid, unique-looking ids', () => {
    const ids = new Set(Array.from({ length: 200 }, generateTrackingId))
    expect(ids.size).toBe(200)
    for (const id of ids) expect(isValidTrackingId(id)).toBe(true)
  })
  it('rejects malformed ids', () => {
    expect(isValidTrackingId('GRV-123')).toBe(false)
    expect(isValidTrackingId('../etc/passwd')).toBe(false)
  })
})

describe('JsonFileGrievanceRepository', () => {
  let dir: string
  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'grievance-'))
  })
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('persists and retrieves a grievance', async () => {
    const repo = new JsonFileGrievanceRepository(path.join(dir, 'g.json'))
    const created = await repo.create(input)
    expect(created.status).toBe('received')
    expect((await repo.getById(created.id))?.title).toBe('No water')
    expect(await repo.getById('GRV-AAAAAAAA')).toBeNull()
  })

  it('does not lose records under concurrent writes', async () => {
    const repo = new JsonFileGrievanceRepository(path.join(dir, 'g.json'))
    const created = await Promise.all(Array.from({ length: 25 }, () => repo.create(input)))
    for (const g of created) expect(await repo.getById(g.id)).not.toBeNull()
  })
})
