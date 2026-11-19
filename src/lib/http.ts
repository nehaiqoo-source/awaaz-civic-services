import { NextResponse } from 'next/server'
import type { ZodType } from 'zod'

const DEFAULT_MAX_BODY_BYTES = 32 * 1024

export function jsonError(message: string, status: number, headers?: HeadersInit): NextResponse {
  return NextResponse.json({ error: message }, { status, headers })
}

/** Reads and validates a JSON body with a hard size cap. Returns a response on failure. */
export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>,
  maxBytes: number = DEFAULT_MAX_BODY_BYTES,
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  const raw = await request.text()
  if (new TextEncoder().encode(raw).length > maxBytes) {
    return { ok: false, response: jsonError('Request too large', 413) }
  }
  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    return { ok: false, response: jsonError('Invalid JSON', 400) }
  }
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    return { ok: false, response: jsonError('Invalid input', 400) }
  }
  return { ok: true, data: parsed.data }
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || 'unknown'
}
