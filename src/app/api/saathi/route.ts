import { NextResponse } from 'next/server'
import { clientKey, jsonError, parseBody } from '@/lib/http'
import { RateLimiter } from '@/lib/rate-limit'
import { planSaathi, saathiRequestSchema } from '@/lib/saathi/plan'

export const runtime = 'nodejs'

const limiter = new RateLimiter(20, 60_000)

export async function POST(request: Request) {
  const wait = limiter.check(clientKey(request))
  if (wait !== null) return jsonError('Too many requests', 429, { 'Retry-After': String(wait) })
  const body = await parseBody(request, saathiRequestSchema, 4 * 1024)
  if (!body.ok) return body.response
  return NextResponse.json(await planSaathi(body.data.transcript), { headers: { 'Cache-Control': 'no-store' } })
}
