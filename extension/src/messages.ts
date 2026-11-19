import type { ActPlan, ActRequest } from '../../src/lib/act/schema'
import type { FillRequest, FillResult } from '../../src/lib/fill/schema'

export const AWAAZ_FILL = 'awaaz-fill'

export interface FillMessage {
  type: typeof AWAAZ_FILL
  request: FillRequest
}
export const AWAAZ_ACT = 'awaaz-act'

export interface ActMessage {
  type: typeof AWAAZ_ACT
  request: ActRequest
}
export type ActResponse = { ok: true; plan: ActPlan } | { ok: false; error: string }

export type FillResponse = { ok: true; result: FillResult } | { ok: false; error: string }
