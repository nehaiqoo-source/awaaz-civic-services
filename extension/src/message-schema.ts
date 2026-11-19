import { z } from 'zod'
import { actRequestSchema } from '../../src/lib/act/schema'
import { fillRequestSchema } from '../../src/lib/fill/schema'
import { AWAAZ_ACT, AWAAZ_FILL } from './messages'

/** Background-worker-only: validates messages from content scripts before anything is forwarded. */
export const fillMessageSchema = z.object({
  type: z.literal(AWAAZ_FILL),
  request: fillRequestSchema,
})

export const actMessageSchema = z.object({
  type: z.literal(AWAAZ_ACT),
  request: actRequestSchema,
})
