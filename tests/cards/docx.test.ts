import { Packer } from 'docx'
import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { cardDocument, cardFileName } from '../../src/cards/docx.ts'
import { fillCard } from '../../src/cards/fill.ts'
import { cardTemplates } from '../../src/cards/templates/index.ts'
import { wbf } from '../../src/cards/templates/wbf.ts'
import type { CardTemplate } from '../../src/cards/types.ts'
import { conventions as bundled } from '../../src/content/index.ts'
import { resolveProfile } from '../../src/lib/profiles.ts'

const club = resolveProfile([], 'club', bundled)

async function documentXml(template: CardTemplate, font?: 'arial' | 'gill-sans') {
  const card = fillCard(template, club)
  const buffer = await Packer.toBuffer(
    cardDocument(template, card, { title: 't', notesTitle: 'SUPPLEMENTARY NOTES', font }),
  )
  const zip = await JSZip.loadAsync(buffer)
  return {
    card,
    xml: await zip.file('word/document.xml')!.async('string'),
    styles: await zip.file('word/styles.xml')!.async('string'),
  }
}

describe('cardDocument (e3-t08, AC-3.5)', () => {
  it.each(cardTemplates.map((t) => [t.id, t] as const))(
    'builds %s with fixed widths only',
    async (_id, template) => {
      const { xml } = await documentXml(template)
      // Every table is laid out fixed, in twips; nothing is auto-sized
      expect(xml).toContain('w:tblLayout w:type="fixed"')
      expect(xml).not.toMatch(/w:type="auto"/)
      // One section per page, plus the notes when there are any
      expect(xml.match(/<w:sectPr/g)?.length).toBeGreaterThanOrEqual(template.pages.length)
      expect(xml).toContain(
        template.paper === 'A4-landscape' ? 'w:orient="landscape"' : 'w:orient="portrait"',
      )
    },
  )

  it('writes what the card says and the supplementary notes', async () => {
    const { card, xml } = await documentXml(wbf)
    expect(card.notes.length).toBeGreaterThan(0)
    expect(xml).toContain('SUPPLEMENTARY NOTES')
    expect(xml).toContain(`[Note ${card.notes[0]!.n}]`)
    expect(xml).toContain('DEFENSIVE AND COMPETITIVE BIDDING')
    // Some filled text gets in (the first text cell, first line, escaped as XML)
    const first = Object.values(card.cells).find(
      (c) => c.text && !/[&<>"']/.test(c.text.split('\n')[0]!),
    )
    expect(xml).toContain(first!.text!.split('\n')[0]!.split(/[♥♦]/u)[0]!)
  })

  it('offers the WBF card in Gill Sans', async () => {
    const plain = await documentXml(wbf)
    const gill = await documentXml(wbf, 'gill-sans')
    expect(plain.styles).toContain('w:ascii="Arial"')
    expect(gill.styles).toContain('w:ascii="Gill Sans MT"')
  })

  it('names the file after the card, the profile and the font', () => {
    expect(cardFileName(wbf, '社團 預設')).toBe('wbf-社團-預設.docx')
    expect(cardFileName(wbf, 'A/B', 'gill-sans', 3)).toBe('wbf-A-B-v3-gillsans.docx')
  })
})
