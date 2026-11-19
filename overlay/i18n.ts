import type { FieldDescriptor } from '@/lib/fill/schema'

type Lang = 'hi' | 'en'

const STRINGS = {
  hi: {
    ask: 'कृपया बताइए:',
    options: 'विकल्प:',
    yesNo: 'हाँ या नहीं?',
    dateHint: 'दिन, महीना और साल बोलिए।',
    manual: 'यह जानकारी सुरक्षा के लिए आप खुद भरिए।',
    fillYourself: 'आप खुद भरें:',
    retry: 'समझ नहीं आया, फिर से बोलिए।',
    done: 'हो गया। कृपया फ़ॉर्म जाँच लें और सबमिट खुद दबाइए।',
    noFields: 'इस पेज पर भरने लायक फ़ॉर्म नहीं मिला।',
    cmdListening: 'बोलिए, मैं सुन रहा हूँ।',
    cmdDone: 'हो गया:',
    cmdBlocked: 'सुरक्षा के लिए यह आप खुद कीजिए:',
    cmdNoPermission: 'इसकी अनुमति नहीं दी गई है:',
    cmdDeclined: 'रद्द किया:',
    cmdStale: 'पेज बदल गया, कुछ नहीं किया:',
    cmdRateLimited: 'बहुत तेज़ी से आदेश हो रहे हैं, थोड़ा रुकिए।',
    cmdNotUnderstood: 'समझ नहीं आया। फिर से बोलिए।',
    cmdNoMatch: 'इस पेज पर ऐसा कुछ नहीं मिला।',
    cmdIdle: 'कोई आवाज़ नहीं आई, मैं रुक गया।',
    cmdUndone: 'पिछला बदलाव वापस किया।',
    cmdNothingToUndo: 'वापस करने के लिए कुछ नहीं है।',
  },
  en: {
    ask: 'Please say:',
    options: 'Options:',
    yesNo: 'Yes or no?',
    dateHint: 'Say day, month and year.',
    manual: 'For your safety, please fill this one yourself.',
    fillYourself: 'Please fill yourself:',
    retry: 'Sorry, I did not catch that. Please say it again.',
    done: 'All done. Please check the form and press Submit yourself.',
    noFields: 'No fillable form was found on this page.',
    cmdListening: 'Go ahead, I am listening.',
    cmdDone: 'Done:',
    cmdBlocked: 'For your safety, please do this yourself:',
    cmdNoPermission: 'You have not allowed this:',
    cmdDeclined: 'Cancelled:',
    cmdStale: 'The page changed, so I did nothing:',
    cmdRateLimited: 'Too many commands too fast. Please wait a moment.',
    cmdNotUnderstood: 'Sorry, I did not understand. Please say it again.',
    cmdNoMatch: 'I could not find that on this page.',
    cmdIdle: 'I heard nothing, so I stopped.',
    cmdUndone: 'Undid the last change.',
    cmdNothingToUndo: 'Nothing to undo.',
  },
} as const

export type StringKey = keyof (typeof STRINGS)['en']

export function langOf(tag: string): Lang {
  return tag.toLowerCase().startsWith('hi') ? 'hi' : 'en'
}

export function t(tag: string, key: StringKey): string {
  return STRINGS[langOf(tag)][key]
}

const MAX_SPOKEN_OPTIONS = 8

/** The spoken question for a field. Labels come from the page and are only ever spoken or shown as text. */
export function questionFor(field: FieldDescriptor, lang: string): string {
  const parts: string[] = []
  if (field.type === 'checkbox') parts.push(`${field.label}? ${t(lang, 'yesNo')}`)
  else parts.push(`${t(lang, 'ask')} ${field.label}`)
  if (field.type === 'date') parts.push(t(lang, 'dateHint'))
  if ((field.type === 'select' || field.type === 'radio') && field.options && field.options.length <= MAX_SPOKEN_OPTIONS) {
    parts.push(`${t(lang, 'options')} ${field.options.map((o) => o.label).join(', ')}`)
  }
  return parts.join('. ')
}
