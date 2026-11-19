import { NextResponse } from 'next/server'
import { fillFields } from '@/lib/fill/fill'
import { fillRequestSchema } from '@/lib/fill/schema'
import { clientKey, jsonError, parseBody } from '@/lib/http'
import { RateLimiter } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const limiter = new RateLimiter(60, 60_000)
const MAX_FILL_BODY_BYTES = 256 * 1024

/**
 * The extension and the mobile bookmarklet call this from third-party pages, so CORS is open.
 * Safe because the endpoint is stateless, uses no cookies or credentials, and returns only values derived
 * from the request itself.
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

  const body = await parseBody(request, fillRequestSchema, MAX_FILL_BODY_BYTES)
  if (!body.ok) {
    for (const [key, value] of Object.entries(CORS_HEADERS)) body.response.headers.set(key, value)
    return body.response
  }

  const result = await fillFields(body.data)
  return NextResponse.json(result, { headers: CORS_HEADERS })
}
