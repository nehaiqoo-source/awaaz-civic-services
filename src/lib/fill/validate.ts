import {
  cleanFreeText,
  matchOption,
  normalizeDate,
  normalizeEmail,
  normalizeNumber,
  normalizePhone,
  parseYesNo,
} from './normalize'
import { textLimit } from './limits'
import type { FieldDescriptor } from './schema'

/**
 * Validates and canonicalizes a candidate value (from the rules engine OR the model) for a field.
 * Returns the value to write into the page, or null if it is not acceptable.
 * Model output is untrusted: select/radio values must be one of the page's own option values.
 */
export function validateValue(field: FieldDescriptor, candidate: string): string | null {
  const raw = candidate.trim()
  if (raw.length === 0) return null

  switch (field.type) {
    case 'password':
      return null // credentials are never filled by voice
    case 'select':
    case 'radio': {
      const options = field.options ?? []
      const byValue = options.find((o) => o.value === raw)
      if (byValue) return byValue.value
      return matchOption(raw, options)
    }
    case 'checkbox': {
      const yesNo = parseYesNo(raw)
      return yesNo === null ? null : String(yesNo)
    }
    case 'email':
      return normalizeEmail(raw)
    case 'tel':
      return normalizePhone(raw)
    case 'number':
      return normalizeNumber(raw)
    case 'date':
      return normalizeDate(raw)
    case 'text':
    case 'textarea': {
      const text = cleanFreeText(raw)
      return text.length > 0 && text.length <= textLimit(field) ? text : null
    }
  }
}
