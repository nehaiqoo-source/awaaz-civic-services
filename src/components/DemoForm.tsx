'use client'

import { useState } from 'react'

const STATES = ['Maharashtra', 'Madhya Pradesh', 'Uttar Pradesh', 'Bihar', 'Rajasthan', 'Tamil Nadu']

/** A realistic service-style form. Name and mobile are React-controlled on purpose: it proves programmatic fills reach framework state. */
export function DemoForm() {
  const [name, setName] = useState('')
  const [mobile, setMobile] = useState('')
  const [submitted, setSubmitted] = useState<Record<string, FormDataEntryValue> | null>(null)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = Object.fromEntries(new FormData(event.currentTarget).entries())
    delete data.aadhaar
    setSubmitted(data)
  }

  return (
    <form className="card demo" onSubmit={handleSubmit} aria-labelledby="demo-title">
      <h2 id="demo-title">Pension application (demo) · पेंशन आवेदन</h2>
      <label>
        Full name · पूरा नाम *
        <input name="fullName" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        Mobile number · मोबाइल नंबर
        <input name="mobile" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} />
      </label>
      <label>
        Email
        <input name="email" type="email" />
      </label>
      <label>
        Date of birth · जन्म तिथि
        <input name="dob" type="date" />
      </label>
      <label>
        State · राज्य
        <select name="state" defaultValue="">
          <option value="">-- Select --</option>
          {STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend>Gender · लिंग</legend>
        <label className="inline"><input type="radio" name="gender" value="female" /> Female</label>
        <label className="inline"><input type="radio" name="gender" value="male" /> Male</label>
        <label className="inline"><input type="radio" name="gender" value="other" /> Other</label>
      </fieldset>
      <label>
        Aadhaar number · आधार संख्या (you type this)
        <input name="aadhaar" inputMode="numeric" />
      </label>
      <label>
        Reason for application · आवेदन का कारण
        <textarea name="reason" rows={3} maxLength={300} />
      </label>
      <label className="inline">
        <input type="checkbox" name="declaration" /> I declare the information is true · मैं घोषणा करता/करती हूँ
      </label>
      <button type="submit" className="primary">Submit · जमा करें</button>
      {submitted && (
        <pre className="submitted" aria-label="Submitted data (demo only, not stored)">{JSON.stringify(submitted, null, 2)}</pre>
      )}
    </form>
  )
}
