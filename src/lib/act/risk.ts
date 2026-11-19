import { isSensitiveField } from '@/lib/fill/sensitive'
import type { Capability, ElementDescriptor } from './schema'

/**
 * Risk of pressing an element, decided by deterministic rules (never by the model, never by page-supplied flags
 * alone). Evaluated on the server AND again in the page against the live element right before acting.
 *
 *  safe     - ordinary button/link on this site
 *  external - leaves this site
 *  risky    - sends, submits, deletes, logs out, agrees... (needs a physical confirmation tap)
 *  blocked  - payments, credentials, downloads, script/data links: the person does this themselves
 */
export type Risk = 'safe' | 'external' | 'risky' | 'blocked'

const BLOCKED_LABEL: readonly RegExp[] = [
  /\b(pay|payment|pay\s*now|make\s*payment|buy|buy\s*now|purchase|place\s*order|checkout|check\s*out)\b/,
  /\b(transfer|withdraw|send\s*money|donate|recharge|top[\s-]?up)\b/,
  /\b(upi|netbanking|net\s*banking|wallet)\b/,
  /\b(verify|resend|send)\s*(otp|code)\b/,
  /\b(download|install)\b/,
  /भुगतान|खरीद|पैसे\s*भेज|दान|रिचार्ज|डाउनलोड|ओटीपी/,
]

const RISKY_LABEL: readonly RegExp[] = [
  /\b(submit|send|post|publish|apply|register|sign\s*up|enrol+|book|confirm|approve|accept|agree|i\s*agree|continue\s*to\s*pay)\b/,
  /\b(delete|remove|erase|clear|cancel|withdraw\s*application|unsubscribe|deactivate|close\s*account|reset)\b/,
  /\b(log\s*out|logout|sign\s*out|signout|log\s*in|login|sign\s*in|signin)\b/,
  /\b(share|grant|allow|authori[sz]e|permit)\b/,
  /सबमिट|जमा|भेजें|भेजिए|हटाएं|हटाएँ|डिलीट|रद्द|लॉग\s*आउट|लॉगआउट|साइन\s*आउट|पुष्टि|स्वीकार|सहमत|आवेदन|पंजीकरण|रजिस्टर|लॉग\s*इन|लॉगिन/,
]

/** Link targets that are programs or archives. Used by the page when it describes a link (`download: true`). */
export const DOWNLOAD_EXT = /\.(exe|apk|dmg|msi|pkg|bat|cmd|sh|jar|scr|zip|rar|7z|iso|ipa)$/i
const SAFE_SCHEMES = new Set(['http', 'https'])

const normalize = (text: string): string => text.toLowerCase().replace(/[_\-.]+/g, ' ').replace(/\s+/g, ' ').trim()

export function classifyElement(el: Pick<ElementDescriptor, 'label' | 'external' | 'submit' | 'scheme' | 'download'>): Risk {
  const label = normalize(el.label)
  if (el.scheme && !SAFE_SCHEMES.has(el.scheme)) {
    // mailto:/tel: open another app and can cost money or leak data: always the person's own action.
    return 'blocked'
  }
  if (el.download) return 'blocked'
  if (isSensitiveField({ type: 'text', label })) return 'blocked'
  if (BLOCKED_LABEL.some((p) => p.test(label))) return 'blocked'
  if (el.submit) return 'risky'
  if (RISKY_LABEL.some((p) => p.test(label))) return 'risky'
  if (el.external) return 'external'
  return 'safe'
}

/** Capability the person must have granted before an element of this risk may be pressed. */
export function capabilityForRisk(risk: Exclude<Risk, 'blocked'>): Capability {
  if (risk === 'risky') return 'risky'
  if (risk === 'external') return 'external'
  return 'click'
}

/** external and risky actions need the person to confirm each time, in addition to the capability. */
export function needsConfirmation(risk: Risk): boolean {
  return risk === 'risky' || risk === 'external'
}
