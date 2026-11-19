/**
 * Fields the assistant must never fill by voice: credentials, one-time codes, payment data and
 * government/financial identifiers. The user types these themselves.
 * Evaluated on the SERVER as well as in the page, because page-supplied flags are not authoritative.
 */
export interface SensitivityInput {
  type: string
  label?: string
  name?: string
  placeholder?: string
  autocomplete?: string
}

const SENSITIVE_PATTERNS: readonly RegExp[] = [
  /\bpass(word|wd|code)?\b/,
  /\bpwd\b/,
  /\botp\b/,
  /one[\s-]?time/,
  /\bcaptcha\b/,
  /\bcvv\b|\bcvc\b|\bcsc\b/,
  /\b(credit|debit|atm)\s*card\b/,
  /\bcard\s*(no|number|num)\b/,
  /\bpin\b(?!\s*code)/,
  /\baadh?aa?r\b|\baadhar\b|\buid(ai)?\b/,
  /\bpan\b(?!\s*(chayat|chayats))/,
  /\bpassport\b/,
  /\bdriving\s*licen[cs]e\b|\bdl\s*(no|number)\b/,
  /\bvoter\s*id\b|\bepic\s*(no|number)\b/,
  /\bssn\b|\bsocial\s*security\b/,
  /\bbank\s*account\b|\baccount\s*(no|number|num)\b|\ba\/c\b/,
  /\bupi\b|\bvpa\b/,
  /आधार|पासवर्ड|ओटीपी|पैन\s*(नंबर|कार्ड)|खाता\s*(संख्या|नंबर)|पासपोर्ट|मतदाता\s*पहचान/,
]

const SENSITIVE_AUTOCOMPLETE = /^(cc-|current-password|new-password|one-time-code)/

export function isSensitiveField(input: SensitivityInput): boolean {
  if (input.type === 'password') return true
  const autocomplete = (input.autocomplete ?? '').trim().toLowerCase()
  if (SENSITIVE_AUTOCOMPLETE.test(autocomplete)) return true
  const haystack = [input.label, input.name, input.placeholder]
    .filter((part): part is string => Boolean(part))
    .join(' ')
    .toLowerCase()
    .replace(/[_\-.]+/g, ' ')
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(haystack))
}
