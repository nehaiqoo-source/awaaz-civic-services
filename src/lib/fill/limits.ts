/** Plain constants shared by the server, the extension and the in-page overlay (no runtime dependencies). */
export const MAX_FIELDS = 60
export const MAX_OPTIONS = 100
export const MAX_ANSWER_CHARS = 4000

const DEFAULT_TEXT_LIMIT = 500

/** Maximum accepted length for a text answer (page maxlength, capped). */
export function textLimit(field: { type: string; maxLength?: number }): number {
  return Math.min(field.maxLength ?? DEFAULT_TEXT_LIMIT, field.type === 'textarea' ? MAX_ANSWER_CHARS : DEFAULT_TEXT_LIMIT)
}
