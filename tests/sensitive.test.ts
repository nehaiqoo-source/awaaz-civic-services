import { describe, expect, it } from 'vitest'
import { isSensitiveField } from '@/lib/fill/sensitive'

const f = (label: string, extra: Partial<Parameters<typeof isSensitiveField>[0]> = {}) =>
  isSensitiveField({ type: 'text', label, ...extra })

describe('isSensitiveField', () => {
  it('flags credentials, OTP, captcha and payment data', () => {
    expect(isSensitiveField({ type: 'password', label: 'Anything' })).toBe(true)
    expect(f('Enter OTP')).toBe(true)
    expect(f('Captcha')).toBe(true)
    expect(f('CVV')).toBe(true)
    expect(f('Card number')).toBe(true)
    expect(f('ATM PIN')).toBe(true)
    expect(f('', { autocomplete: 'cc-number' })).toBe(true)
    expect(f('', { autocomplete: 'one-time-code' })).toBe(true)
  })
  it('flags government and financial identifiers in English and Hindi', () => {
    expect(f('Aadhaar Number')).toBe(true)
    expect(f('आधार संख्या')).toBe(true)
    expect(f('PAN number')).toBe(true)
    expect(f('Passport No')).toBe(true)
    expect(f('Bank Account Number')).toBe(true)
    expect(f('Driving licence number')).toBe(true)
    expect(f('UPI ID')).toBe(true)
  })
  it('uses name/id attributes too', () => {
    expect(f('Number', { name: 'aadhaar_no' })).toBe(true)
    expect(f('Code', { name: 'user_password' })).toBe(true)
  })
  it('does not flag ordinary fields', () => {
    expect(f('Full name')).toBe(false)
    expect(f('Pin code')).toBe(false)
    expect(f('PINCODE', { name: 'pincode' })).toBe(false)
    expect(f('Mobile number')).toBe(false)
    expect(f('Complaint details')).toBe(false)
    expect(f('Company name')).toBe(false)
    expect(f('Gram Panchayat')).toBe(false)
  })
})
