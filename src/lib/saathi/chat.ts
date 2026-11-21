import { getService, type Service } from './catalog'
import { matchServices, type Match } from './match'

/**
 * Saathi chat: a small rule-based conversation. No network, no AI. It asks at most two short questions, then shows services
 * from the closed catalog. Questions and answers are fixed text written here, so the bot cannot say something it was not given.
 */
export interface Bilingual {
  en: string
  hi: string
}

export interface ChatOption {
  id: string
  label: Bilingual
  /** Catalog ids this choice leads to. */
  serviceIds: readonly string[]
}

export interface ChatQuestion {
  id: string
  text: Bilingual
  options: readonly ChatOption[]
}

export type ChatReply =
  | { kind: 'ask'; question: ChatQuestion }
  | { kind: 'answer'; services: Service[]; confident: boolean }

const tokenize = (text: string): string[] => text.toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) ?? []

export const QUESTIONS: Record<string, ChatQuestion> = {
  pension: {
    id: 'pension',
    text: { en: 'Which kind of pension is it?', hi: 'यह किस तरह की पेंशन है?' },
    options: [
      { id: 'central', label: { en: 'Retired from a central government job', hi: 'केंद्र सरकार की नौकरी से रिटायर' }, serviceIds: ['cpengrams', 'jeevan-pramaan'] },
      { id: 'epfo', label: { en: 'Provident fund / company or private job', hi: 'PF / कंपनी या निजी नौकरी' }, serviceIds: ['epfo'] },
      { id: 'scheme', label: { en: 'Old age, widow or other scheme pension', hi: 'वृद्धा, विधवा या दूसरी योजना की पेंशन' }, serviceIds: ['cpgrams', 'umang'] },
    ],
  },
  ration: {
    id: 'ration',
    text: { en: 'What is the ration problem?', hi: 'राशन की क्या समस्या है?' },
    options: [
      { id: 'card', label: { en: 'New card, name change, or grain not given at the shop', hi: 'नया कार्ड, नाम बदलना, या दुकान पर अनाज नहीं मिलना' }, serviceIds: ['ration'] },
      { id: 'moved', label: { en: 'I have moved to another state for work', hi: 'काम के लिए दूसरे राज्य में आया हूँ' }, serviceIds: ['ration-portability', 'ration'] },
    ],
  },
  area: {
    id: 'area',
    text: { en: 'Is it a problem in your street or area, or with a government office or scheme?', hi: 'क्या यह आपकी गली या इलाके की समस्या है, या किसी सरकारी दफ़्तर या योजना की?' },
    options: [
      { id: 'local', label: { en: 'My street or area (road, water, drain, light, garbage)', hi: 'मेरी गली या इलाका (सड़क, पानी, नाली, बत्ती, कचरा)' }, serviceIds: ['awaaz-local-complaint'] },
      { id: 'office', label: { en: 'A government office or scheme is not helping', hi: 'सरकारी दफ़्तर या योजना में सुनवाई नहीं हो रही' }, serviceIds: ['cpgrams'] },
    ],
  },
  topic: {
    id: 'topic',
    text: { en: 'I did not catch that. What is it about?', hi: 'मैं समझ नहीं पाया। यह किस बारे में है?' },
    options: [
      { id: 'street', label: { en: 'Road, water, drain, light, garbage', hi: 'सड़क, पानी, नाली, बत्ती, कचरा' }, serviceIds: ['awaaz-local-complaint'] },
      { id: 'pension', label: { en: 'Pension', hi: 'पेंशन' }, serviceIds: [] },
      { id: 'ration', label: { en: 'Ration', hi: 'राशन' }, serviceIds: [] },
      { id: 'farm', label: { en: 'Farmer money (PM-KISAN)', hi: 'किसान सम्मान निधि (PM-KISAN)' }, serviceIds: ['pm-kisan'] },
      { id: 'work', label: { en: 'Daily-wage worker card (e-Shram)', hi: 'मज़दूर कार्ड (ई-श्रम)' }, serviceIds: ['eshram'] },
      { id: 'office', label: { en: 'A government office is not listening', hi: 'सरकारी दफ़्तर में सुनवाई नहीं' }, serviceIds: ['cpgrams'] },
      { id: 'police', label: { en: 'Police', hi: 'पुलिस' }, serviceIds: ['police'] },
      { id: 'consumer', label: { en: 'Cheated by a seller', hi: 'दुकानदार ने धोखा दिया' }, serviceIds: ['consumer'] },
      { id: 'health', label: { en: 'Health', hi: 'स्वास्थ्य' }, serviceIds: ['esanjeevani', 'abha'] },
      { id: 'id', label: { en: 'Aadhaar', hi: 'आधार' }, serviceIds: ['aadhaar'] },
    ],
  },
}

/** Topic choices that need a follow-up question instead of an answer. */
const TOPIC_FOLLOW_UP: Record<string, string> = { pension: 'pension', ration: 'ration' }

const PENSION_WORDS = new Set(['pension', 'पेंशन', 'pention', 'pansion'])
const RATION_WORDS = new Set(['ration', 'राशन'])
const PENSION_SPECIFIC = ['cpengrams', 'epfo', 'jeevan-pramaan']
const RATION_SPECIFIC = ['ration-portability']

function resolve(ids: readonly string[]): Service[] {
  return ids.map((id) => getService(id)).filter((s): s is Service => s !== undefined)
}

/**
 * Decide the next bot turn from everything the person has said so far. `asked` lists question ids already put to them,
 * so the bot never asks the same thing twice and never loops.
 */
export function decide(transcript: string, asked: readonly string[]): ChatReply {
  const words = new Set(tokenize(transcript))
  const result = matchServices(transcript, 4)
  const ids = result.matches.map((m: Match) => m.service.id)
  const pick = (id: string): ChatReply | null => (asked.includes(id) ? null : { kind: 'ask', question: QUESTIONS[id]! })

  if ([...words].some((w) => PENSION_WORDS.has(w)) && !ids.some((id) => PENSION_SPECIFIC.includes(id))) {
    const q = pick('pension')
    if (q) return q
  }
  if ([...words].some((w) => RATION_WORDS.has(w)) && !ids.some((id) => RATION_SPECIFIC.includes(id))) {
    const q = pick('ration')
    if (q) return q
  }
  if (ids.length === 0) {
    const q = pick('topic')
    if (q) return q
    return { kind: 'answer', services: [], confident: false }
  }
  if (!result.confident && ids.includes('awaaz-local-complaint') && ids.includes('cpgrams')) {
    const q = pick('area')
    if (q) return q
  }
  return { kind: 'answer', services: result.matches.map((m) => m.service), confident: result.confident }
}

/** The person tapped one of the options of a question. */
export function choose(questionId: string, optionId: string): ChatReply | null {
  const option = QUESTIONS[questionId]?.options.find((o) => o.id === optionId)
  if (!option) return null
  const follow = questionId === 'topic' ? TOPIC_FOLLOW_UP[optionId] : undefined
  if (follow) return { kind: 'ask', question: QUESTIONS[follow]! }
  return { kind: 'answer', services: resolve(option.serviceIds), confident: true }
}
