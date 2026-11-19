import { NextResponse } from 'next/server'
import { structureTranscript } from '@/lib/grievance/structure'
import { transcriptInputSchema } from '@/lib/grievance/schema'
import { clientKey, jsonError, parseBody } from '@/lib/http'
import { RateLimiter } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const limiter = new RateLimiter(20, 60_000)

export async function POST(request: Request) {
  const wait = limiter.check(clientKey(request))
  if (wait !== null) return jsonError('Too many requests', 429, { 'Retry-After': String(wait) })

  const body = await parseBody(request, transcriptInputSchema)
  if (!body.ok) return body.response

  const result = await structureTranscript(body.data.transcript)
  return NextResponse.json(result)
}
