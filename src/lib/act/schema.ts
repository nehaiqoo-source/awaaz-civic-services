import { z } from 'zod'
import { fieldDescriptorSchema } from '@/lib/fill/schema'

/** Maximum number of clickable elements sent to the planner. */
export const MAX_ELEMENTS = 80
export const MAX_ACTIONS = 5
export const MAX_COMMAND_CHARS = 500

export const ELEMENT_ROLES = ['link', 'button', 'tab', 'menuitem'] as const
export type ElementRole = (typeof ELEMENT_ROLES)[number]

/**
 * Description of one clickable thing on the page. Untrusted: it comes from a third-party site.
 * Only the host of a link is sent (never the full URL: it may carry tokens or personal data).
 */
export const elementDescriptorSchema = z.object({
  id: z.string().min(1).max(20),
  role: z.enum(ELEMENT_ROLES),
  label: z.string().trim().max(200),
  hrefHost: z.string().max(200).optional(),
  /** Link goes to another site than the current page. */
  external: z.boolean().optional(),
  /** Pressing this submits a form. */
  submit: z.boolean().optional(),
  /** Link scheme other than http(s) (javascript:, mailto:, tel:, data: ...). */
  scheme: z.string().max(20).optional(),
  /** Link downloads a file. */
  download: z.boolean().optional(),
})
export type ElementDescriptor = z.infer<typeof elementDescriptorSchema>

export const actRequestSchema = z.object({
  transcript: z.string().trim().min(1).max(MAX_COMMAND_CHARS),
  language: z.string().trim().min(2).max(20).optional(),
  elements: z.array(elementDescriptorSchema).max(MAX_ELEMENTS),
  fields: z.array(fieldDescriptorSchema).max(60),
})
export type ActRequest = z.infer<typeof actRequestSchema>

/**
 * The CLOSED set of things a voice command can do. There is deliberately no "run script", "open URL",
 * "type into any element" or "download" action: every action targets an element id from the page snapshot.
 */
export const actionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('click'), target: z.string().min(1).max(20) }),
  z.object({ type: z.literal('fill'), target: z.string().min(1).max(40), value: z.string().max(4000) }),
  z.object({ type: z.literal('scroll'), direction: z.enum(['up', 'down', 'top', 'bottom']) }),
  z.object({ type: z.literal('back') }),
  z.object({ type: z.literal('read') }),
  z.object({ type: z.literal('stop') }),
])
export type Action = z.infer<typeof actionSchema>

export type PlanReason = 'not_understood' | 'no_match' | 'ai_unavailable' | 'too_complex'

export interface ActPlan {
  actions: Action[]
  source: 'rules' | 'llm' | 'none'
  reason?: PlanReason
}

/** What a capability lets the assistant do. Granted by the person, per site, for a short time. */
export const CAPABILITIES = ['view', 'fill', 'click', 'external', 'risky'] as const
export type Capability = (typeof CAPABILITIES)[number]
