import { NextResponse } from 'next/server'
import { submitInputSchema } from '@/lib/grievance/schema'
import { getRepository } from '@/lib/grievance/store'
import { clientKey, jsonError, parseBody } from '@/lib/http'
import { RateLimiter } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const limiter = new RateLimiter(10, 60_000)

export async function POST(request: Request) {
  const wait = limiter.check(clientKey(request))
  if (wait !== null) return jsonError('Too many requests', 429, { 'Retry-After': String(wait) })

  const body = await parseBody(request, submitInputSchema)
  if (!body.ok) return body.response

  let grievance
  try {
    grievance = await getRepository().create(body.data)
  } catch (error) {
    console.error('grievance create failed:', error instanceof Error ? error.message : 'unknown error')
    return jsonError('Could not save the complaint. Please try again.', 503)
  }
  return NextResponse.json(
    { id: grievance.id, status: grievance.status, createdAt: grievance.createdAt, photoToken: grievance.photoToken },
    { status: 201, headers: { 'Cache-Control': 'no-store' } },
  )
}
