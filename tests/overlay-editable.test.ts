// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { applyValue } from '../overlay/apply'
import { resolveFocusTarget, scanForm } from '../overlay/scan'
import { FillSession } from '../overlay/session'
import type { ListenHandle, VoiceIO } from '../overlay/voice'

// A page like X: a search box at the top and a rich text post composer (contenteditable) below it.
const PAGE = `
  <input type="search" aria-label="Search query" id="search">
  <div id="composer" contenteditable="true" role="textbox" aria-label="Post text"><div><span id="inner"></span></div></div>
`

beforeEach(() => {
  document.body.innerHTML = PAGE
})

const composer = () => document.getElementById('composer') as HTMLElement

describe('rich text boxes', () => {
  it('finds the composer as a text field (outermost element only)', () => {
    const { fields, refs } = scanForm(document)
    expect(fields.map((f) => f.label)).toEqual(['Search query', 'Post text'])
    expect([...refs.values()].filter((r) => r.kind === 'editable')).toHaveLength(1)
  })

  it('resolves focus inside the composer to the composer itself', () => {
    expect(resolveFocusTarget(document.getElementById('inner'))).toBe(composer())
    expect(resolveFocusTarget(document.getElementById('search'))).toBe(document.getElementById('search'))
    expect(resolveFocusTarget(document.body)).toBeNull()
  })

  it('when the person was writing a post, only the post box is used', () => {
    const { fields, refs } = scanForm(document, document, { focusTarget: composer() })
    expect(fields).toHaveLength(1)
    expect(fields[0]?.label).toBe('Post text')
    expect(refs.get(fields[0]!.id)?.kind).toBe('editable')
  })

  it('a focused form input goes first, the rest of the form follows', () => {
    document.body.innerHTML = `<label for="a">Name</label><input id="a"><label for="b">City</label><input id="b">`
    const { fields } = scanForm(document, document, { focusTarget: document.getElementById('b') })
    expect(fields.map((f) => f.label)).toEqual(['City', 'Name'])
  })

  it('writes into the composer and undo restores it', () => {
    const { refs, fields } = scanForm(document, document, { focusTarget: composer() })
    const ref = refs.get(fields[0]!.id)!
    let inputs = 0
    composer().addEventListener('input', () => (inputs += 1))
    const undo = applyValue(ref, 'Namaste duniya')
    expect(composer().textContent).toBe('Namaste duniya')
    expect(inputs).toBeGreaterThan(0)
    undo()
    expect(composer().textContent).toBe('')
  })

  it('a voice session fills the post, not the search box', async () => {
    const voice: VoiceIO = {
      speak: async () => {},
      cancelSpeech() {},
      listen: (): ListenHandle => ({ result: Promise.resolve('aaj mausam bahut achha hai'), stop() {} }),
    }
    const session = new FillSession({
      doc: document,
      voice,
      transport: async () => ({ values: {} }) as never,
      lang: 'hi-IN',
      allowServer: false,
      focusTarget: composer(),
      onEvent: () => {},
    })
    await session.runGuided()
    expect(composer().textContent).toBe('aaj mausam bahut achha hai')
    expect((document.getElementById('search') as HTMLInputElement).value).toBe('')
  })
})
