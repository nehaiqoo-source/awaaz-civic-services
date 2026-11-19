// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { applyValue } from '../overlay/apply'
import { scanForm } from '../overlay/scan'

const FORM = `
<form>
  <label for="n">Full name *</label><input id="n" name="fullName" type="text" required>
  <label>Mobile number <input name="mobile" type="tel"></label>
  <input name="email" type="email" placeholder="Email address">
  <label for="dob">Date of birth</label><input id="dob" type="date">
  <label>State
    <select name="state"><option value="">-- Select --</option><option value="MH">Maharashtra</option><option value="MP">Madhya Pradesh</option></select>
  </label>
  <fieldset><legend>Gender</legend>
    <label><input type="radio" name="g" value="f"> Female</label>
    <label><input type="radio" name="g" value="m"> Male</label>
  </fieldset>
  <label><input type="checkbox" name="agree"> I agree</label>
  <label for="pw">Password</label><input id="pw" type="password">
  <textarea name="details" aria-label="Complaint details" maxlength="200"></textarea>
  <input type="hidden" name="csrf" value="x">
  <input type="text" name="disabled_one" disabled>
  <input type="text" name="gone" style="display:none" aria-label="Hidden">
  <input type="submit" value="Send">
</form>`

let doc: Document
beforeEach(() => {
  document.body.innerHTML = FORM
  doc = document
})

describe('scanForm', () => {
  it('describes visible, enabled controls in DOM order', () => {
    const { fields } = scanForm(doc)
    expect(fields.map((f) => [f.type, f.label])).toEqual([
      ['text', 'Full name'],
      ['tel', 'Mobile number'],
      ['email', 'Email address'],
      ['date', 'Date of birth'],
      ['select', 'State'],
      ['radio', 'Gender'],
      ['checkbox', 'I agree'],
      ['password', 'Password'],
      ['textarea', 'Complaint details'],
    ])
    expect(fields.map((f) => f.id)).toEqual(['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9'])
  })

  it('lists select options without the placeholder and does not leak option text into the label', () => {
    const state = scanForm(doc).fields.find((f) => f.type === 'select')
    expect(state?.label).toBe('State')
    expect(state?.options).toEqual([
      { value: 'MH', label: 'Maharashtra' },
      { value: 'MP', label: 'Madhya Pradesh' },
    ])
  })

  it('groups radios and keeps required/maxLength metadata', () => {
    const { fields, refs } = scanForm(doc)
    const gender = fields.find((f) => f.type === 'radio')
    expect(gender?.options).toEqual([
      { value: 'f', label: 'Female' },
      { value: 'm', label: 'Male' },
    ])
    expect(refs.get(gender?.id ?? '')?.kind).toBe('radios')
    expect(fields[0]?.required).toBe(true)
    expect(fields.find((f) => f.type === 'textarea')?.maxLength).toBe(200)
  })
})

describe('applyValue', () => {
  it('sets text values, fires input/change events and can undo', () => {
    const { refs } = scanForm(doc)
    const ref = refs.get('f1')
    if (!ref) throw new Error('missing ref')
    const events: string[] = []
    const input = doc.getElementById('n') as HTMLInputElement
    input.addEventListener('input', () => events.push('input'))
    input.addEventListener('change', () => events.push('change'))
    const undo = applyValue(ref, 'रमेश कुमार')
    expect(input.value).toBe('रमेश कुमार')
    expect(events).toEqual(['input', 'change'])
    undo()
    expect(input.value).toBe('')
  })

  it('selects options, clicks radios and toggles checkboxes (with undo)', () => {
    const { refs } = scanForm(doc)
    const select = doc.querySelector('select') as HTMLSelectElement
    applyValue(refs.get('f5') as never, 'MP')
    expect(select.value).toBe('MP')

    const undoRadio = applyValue(refs.get('f6') as never, 'm')
    expect((doc.querySelector('input[value="m"]') as HTMLInputElement).checked).toBe(true)
    undoRadio()
    expect((doc.querySelector('input[value="m"]') as HTMLInputElement).checked).toBe(false)

    const undoCheck = applyValue(refs.get('f7') as never, 'true')
    expect((doc.querySelector('input[name="agree"]') as HTMLInputElement).checked).toBe(true)
    undoCheck()
    expect((doc.querySelector('input[name="agree"]') as HTMLInputElement).checked).toBe(false)
  })
})
