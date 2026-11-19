import { NextResponse } from 'next/server'
import { planActions } from '@/lib/act/plan'
import { actRequestSchema } from '@/lib/act/schema'
import { clientKey, jsonError, parseBody } from '@/lib/http'
import { RateLimiter } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const limiter = new RateLimiter(60, 60_000)
const MAX_ACT_BODY_BYTES = 128 * 1024

/**
 * Like /api/fill: called from third-party pages, so CORS is open. Safe because it is stateless, cookie-free,
 * and only PROPOSES actions. It never performs anything; the page re-validates every proposal against the
 * live element, the person's granted permissions and its own risk rules before acting.
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: Request) {
  const wait = limiter.check(clientKey(request))
  if (wait !== null) return jsonError('Too many requests', 429, { ...CORS_HEADERS, 'Retry-After': String(wait) })

  const body = await parseBody(request, actRequestSchema, MAX_ACT_BODY_BYTES)
  if (!body.ok) {
    for (const [key, value] of Object.entries(CORS_HEADERS)) body.response.headers.set(key, value)
    return body.response
  }
  return NextResponse.json(await planActions(body.data), { headers: CORS_HEADERS })
}
