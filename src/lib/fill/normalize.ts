/** Deterministic normalizers for spoken answers (English, Hindi and other Indic digit systems). */

/** Unicode "zero" code points of the decimal digit blocks of Indian scripts and ASCII. */
const DIGIT_ZEROS = [0x30, 0x966, 0x9e6, 0xa66, 0xae6, 0xb66, 0xbe6, 0xc66, 0xce6, 0xd66]

export function toAsciiDigits(text: string): string {
  let out = ''
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0
    const zero = DIGIT_ZEROS.find((z) => cp >= z && cp <= z + 9)
    out += zero === undefined ? ch : String(cp - zero)
  }
  return out
}

const DIGIT_WORDS: Record<string, string> = {
  zero: '0', oh: '0', shunya: '0', shoonya: '0', 'शून्य': '0', 'जीरो': '0',
  one: '1', ek: '1', 'एक': '1',
  two: '2', do: '2', 'दो': '2',
  three: '3', teen: '3', 'तीन': '3',
  four: '4', char: '4', chaar: '4', 'चार': '4',
  five: '5', panch: '5', paanch: '5', 'पांच': '5', 'पाँच': '5',
  six: '6', chhe: '6', chhah: '6', che: '6', chah: '6', 'छह': '6', 'छः': '6', 'छे': '6', 'छ': '6',
  seven: '7', saat: '7', 'सात': '7',
  eight: '8', aath: '8', 'आठ': '8',
  nine: '9', nau: '9', 'नौ': '9',
  // English digit names as Hindi recognition writes them (people often say numbers in English).
  'ज़ीरो': '0', 'वन': '1', 'टू': '2', 'थ्री': '3', 'फोर': '4', 'फ़ोर': '4', 'फाइव': '5', 'फ़ाइव': '5', 'सिक्स': '6',
  'सेवन': '7', 'एट': '8', 'एइट': '8', 'नाइन': '9', 'नाईन': '9',
  // Sound-alikes English recognition produces for digits. Only used for phone and number fields.
  won: '1', to: '2', too: '2', tu: '2', for: '4', fore: '4', ate: '8',
}
const MULTIPLIERS: Record<string, number> = { double: 2, 'डबल': 2, 'दबल': 2, triple: 3, 'ट्रिपल': 3 }

/** Extracts the digit string from speech like "double nine 8 seven ६ ..." (digits and digit words). */
export function spokenToDigits(text: string): string {
  const tokens = toAsciiDigits(text.toLowerCase()).split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean)
  let out = ''
  let repeat = 1
  for (const token of tokens) {
    const multiplier = MULTIPLIERS[token]
    if (multiplier !== undefined) {
      repeat = multiplier
      continue
    }
    const piece = /^\d+$/.test(token) ? token : DIGIT_WORDS[token]
    if (piece !== undefined) {
      out += piece.repeat(repeat)
      repeat = 1
    }
  }
  return out
}

/** Indian mobile numbers: 10 digits starting 6-9, tolerating a +91 / 0 prefix. Otherwise a plain 7-15 digit number. */
export function normalizePhone(text: string): string | null {
  let digits = spokenToDigits(text)
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2)
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1)
  if (/^[6-9]\d{9}$/.test(digits)) return digits
  return null
}

export function normalizeNumber(text: string): string | null {
  const digits = spokenToDigits(text)
  return digits.length > 0 && digits.length <= 15 ? digits : null
}

/** Common email words as Hindi recognition writes them. */
const EMAIL_WORDS: ReadonlyArray<readonly [RegExp, string]> = [
  [/जीमेल|जी मेल/g, 'gmail'],
  [/याहू/g, 'yahoo'],
  [/हॉटमेल|हॉट मेल/g, 'hotmail'],
  [/आउटलुक/g, 'outlook'],
  [/रेडिफ़?मेल/g, 'rediffmail'],
  [/कॉम|कोम/g, 'com'],
]

const EMAIL_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\b(at the rate( of)?|at)\b|एट\s*द\s*रेट|एट/gi, '@'],
  [/\b(dot|period)\b|डॉट|डाट/gi, '.'],
  [/\b(underscore)\b|अंडरस्कोर/gi, '_'],
  [/\b(dash|hyphen|minus)\b|डैश|हाइफन/gi, '-'],
]
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function normalizeEmail(text: string): string | null {
  let value = text.trim().toLowerCase()
  for (const [pattern, replacement] of EMAIL_WORDS) value = value.replace(pattern, ` ${replacement} `)
  for (const [pattern, replacement] of EMAIL_REPLACEMENTS) value = value.replace(pattern, ` ${replacement} `)
  value = value.replace(/\s+/g, '')
  return EMAIL_PATTERN.test(value) ? value : null
}

const MONTHS: Record<string, number> = {
  january: 1, jan: 1, 'जनवरी': 1, february: 2, feb: 2, 'फरवरी': 2, march: 3, mar: 3, 'मार्च': 3,
  april: 4, apr: 4, 'अप्रैल': 4, may: 5, 'मई': 5, june: 6, jun: 6, 'जून': 6,
  july: 7, jul: 7, 'जुलाई': 7, august: 8, aug: 8, 'अगस्त': 8, september: 9, sep: 9, sept: 9, 'सितंबर': 9, 'सितम्बर': 9,
  october: 10, oct: 10, 'अक्टूबर': 10, november: 11, nov: 11, 'नवंबर': 11, 'नवम्बर': 11, december: 12, dec: 12, 'दिसंबर': 12, 'दिसम्बर': 12,
}

function toIsoDate(year: number, month: number, day: number): string | null {
  if (year < 1900 || year > 2100) return null
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Parses numeric (dd/mm/yyyy, yyyy-mm-dd) and "15 November 1990" style dates to ISO yyyy-mm-dd. India uses day-first. */
export function normalizeDate(text: string): string | null {
  const t = toAsciiDigits(text.trim().toLowerCase())
  const iso = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(t)
  if (iso) return toIsoDate(Number(iso[1]), Number(iso[2]), Number(iso[3]))
  const dmy = /^(\d{1,2})[-/. ](\d{1,2})[-/. ](\d{4})$/.exec(t)
  if (dmy) return toIsoDate(Number(dmy[3]), Number(dmy[2]), Number(dmy[1]))
  const words = t.split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean)
  const monthIndex = words.findIndex((w) => MONTHS[w] !== undefined)
  if (monthIndex === -1) return null
  const month = MONTHS[words[monthIndex] ?? '']
  const numbers = words.filter((w) => /^\d+$/.test(w)).map(Number)
  const year = numbers.find((n) => n >= 1900)
  const day = numbers.find((n) => n >= 1 && n <= 31)
  if (month === undefined || year === undefined || day === undefined) return null
  return toIsoDate(year, month, day)
}

const YES_WORDS = new Set(['yes', 'yeah', 'yep', 'ha', 'haan', 'han', 'ji', 'true', 'sure', 'ok', 'okay', 'हाँ', 'हां', 'जी', 'हा', 'सही', 'ठीक'])
const NO_WORDS = new Set(['no', 'nope', 'nahi', 'nahin', 'na', 'false', 'नहीं', 'नही', 'ना', 'न'])

function tokens(text: string): string[] {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .split(/[^\p{L}\p{M}\p{N}]+/u)
    .filter(Boolean)
}

/** Interprets a spoken yes/no. Returns null when it is neither. */
export function parseYesNo(text: string): boolean | null {
  const words = tokens(text)
  const yes = words.some((w) => YES_WORDS.has(w))
  const no = words.some((w) => NO_WORDS.has(w))
  if (yes === no) return null
  return yes
}

/** Picks the single best option for a spoken answer, or null if unclear or ambiguous. */
export function matchOption(
  text: string,
  options: ReadonlyArray<{ value: string; label: string }>,
): string | null {
  const spoken = tokens(text)
  if (spoken.length === 0) return null
  const spokenJoined = spoken.join(' ')

  const exact = options.filter((o) => tokens(o.label).join(' ') === spokenJoined || tokens(o.value).join(' ') === spokenJoined)
  if (exact.length === 1) return exact[0]?.value ?? null

  const yesNo = parseYesNo(text)
  if (yesNo !== null) {
    const wanted = yesNo ? ['yes', 'हाँ', 'हां', 'true'] : ['no', 'नहीं', 'नही', 'false']
    const hit = options.filter((o) => wanted.includes(tokens(o.label).join(' ')) || wanted.includes(tokens(o.value).join(' ')))
    if (hit.length === 1) return hit[0]?.value ?? null
  }

  let best: { value: string; score: number } | null = null
  let tie = false
  for (const option of options) {
    const optionTokens = tokens(option.label)
    if (optionTokens.length === 0) continue
    const inSpoken = optionTokens.filter((t) => spoken.includes(t)).length
    const contains = spokenJoined.includes(optionTokens.join(' ')) || optionTokens.join(' ').includes(spokenJoined)
    const score = Math.max(inSpoken / optionTokens.length, contains ? 1 : 0)
    if (score < 0.6) continue
    if (!best || score > best.score) {
      best = { value: option.value, score }
      tie = false
    } else if (score === best.score) {
      tie = true
    }
  }
  return best && !tie ? best.value : null
}

/** Trims speech-recognition artefacts from free text answers. */
export function cleanFreeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().replace(/[.।]+$/, '')
}
