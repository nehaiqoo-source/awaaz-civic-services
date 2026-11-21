// Renders the Play Store feature graphic (1024x500) with the same renderer Next uses for the social image.
import { ImageResponse } from 'next/og.js'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import React from 'react'

const h = React.createElement
const out = path.resolve(import.meta.dirname, '../store/play/assets/feature-graphic-1024x500.png')
const res = new ImageResponse(
  h('div', { style: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 70, background: 'linear-gradient(135deg,#ff9933,#c2410c)', color: 'white' } },
    h('div', { style: { fontSize: 36, opacity: 0.9, display: 'flex' } }, 'Awaaz'),
    h('div', { style: { fontSize: 66, fontWeight: 800, lineHeight: 1.1, marginTop: 12, display: 'flex' } }, 'Speak. It fills the form.'),
    h('div', { style: { fontSize: 34, marginTop: 22, opacity: 0.95, display: 'flex' } }, 'Public services for people who can’t fill a form.')),
  { width: 1024, height: 500 },
)
await writeFile(out, Buffer.from(await res.arrayBuffer()))
console.log('wrote', out)
