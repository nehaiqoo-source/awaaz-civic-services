import { describe, expect, it } from 'vitest'
import {
  matchOption,
  normalizeDate,
  normalizeEmail,
  normalizeNumber,
  normalizePhone,
  parseYesNo,
  spokenToDigits,
  toAsciiDigits,
} from '@/lib/fill/normalize'

describe('digits', () => {
  it('converts Indic digits', () => {
    expect(toAsciiDigits('९८७६५ ৪৫ ௧௨')).toBe('98765 45 12')
  })
  it('parses spoken digit words, digits and double/triple', () => {
    expect(spokenToDigits('nine eight seven six five four three two one zero')).toBe('9876543210')
    expect(spokenToDigits('double nine 8 seven')).toBe('9987')
    expect(spokenToDigits('नौ आठ सात छह पाँच ट्रिपल चार')).toBe('98765444')
    expect(spokenToDigits('ek do teen')).toBe('123')
  })
})

describe('phone and number', () => {
  it('accepts 10-digit mobiles and strips +91 / 0', () => {
    expect(normalizePhone('९८७६५४३२१०')).toBe('9876543210')
    expect(normalizePhone('plus 91 98765 43210')).toBe('9876543210')
    expect(normalizePhone('09876543210')).toBe('9876543210')
  })
  it('rejects too short numbers and numbers not starting 6-9', () => {
    expect(normalizePhone('12345')).toBeNull()
    expect(normalizePhone('1234567890')).toBeNull()
  })
  it('normalizes plain numbers', () => {
    expect(normalizeNumber('४५')).toBe('45')
    expect(normalizeNumber('no digits here')).toBeNull()
  })
})

describe('email', () => {
  it('handles spoken separators', () => {
    expect(normalizeEmail('ramesh dot kumar at gmail dot com')).toBe('ramesh.kumar@gmail.com')
    expect(normalizeEmail('asha underscore 12 at the rate yahoo dot in')).toBe('asha_12@yahoo.in')
  })
  it('rejects non-emails', () => {
    expect(normalizeEmail('my name is asha')).toBeNull()
  })
})

describe('date', () => {
  it('parses numeric day-first and ISO', () => {
    expect(normalizeDate('15/08/1990')).toBe('1990-08-15')
    expect(normalizeDate('१५-०८-१९९०')).toBe('1990-08-15')
    expect(normalizeDate('1990-08-15')).toBe('1990-08-15')
  })
  it('parses month names in English and Hindi', () => {
    expect(normalizeDate('15 November 1990')).toBe('1990-11-15')
    expect(normalizeDate('5 अगस्त 1985')).toBe('1985-08-05')
  })
  it('rejects impossible dates', () => {
    expect(normalizeDate('31/02/1990')).toBeNull()
    expect(normalizeDate('hello')).toBeNull()
  })
})

describe('yes/no and options', () => {
  it('parses yes/no in English and Hindi, and refuses ambiguity', () => {
    expect(parseYesNo('हाँ जी')).toBe(true)
    expect(parseYesNo('nahi')).toBe(false)
    expect(parseYesNo('yes no')).toBeNull()
    expect(parseYesNo('maybe')).toBeNull()
  })
  const states = [
    { value: 'MH', label: 'Maharashtra' },
    { value: 'MP', label: 'Madhya Pradesh' },
    { value: 'UP', label: 'Uttar Pradesh' },
  ]
  it('matches exact and contained labels', () => {
    expect(matchOption('Maharashtra', states)).toBe('MH')
    expect(matchOption('I live in madhya pradesh', states)).toBe('MP')
  })
  it('returns null when ambiguous or unknown', () => {
    expect(matchOption('pradesh', states)).toBeNull()
    expect(matchOption('kerala', states)).toBeNull()
  })
  it('maps yes/no onto Yes/No options', () => {
    const yn = [{ value: 'y', label: 'Yes' }, { value: 'n', label: 'No' }]
    expect(matchOption('नहीं', yn)).toBe('n')
    expect(matchOption('haan', yn)).toBe('y')
  })
})
