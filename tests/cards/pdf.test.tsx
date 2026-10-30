import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { ThemeProvider } from 'styled-components'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchCardPdf, pdfFileName, printableHtml } from '../../src/cards/pdf.ts'
import { cardTemplates } from '../../src/cards/templates/index.ts'
import { CARD_PDF_LIMITS } from '../../src/lib/api.ts'
import { PdfDownload } from '../../src/pages/CardOutputs.tsx'
import { cardStrings as t } from '../../src/pages/cardStrings.ts'
import { createTheme } from '../../src/styles/tokens.ts'

const themed = (ui: ReactElement) => render(<ThemeProvider theme={createTheme('light')}>{ui}</ThemeProvider>)
const wbf = cardTemplates.find((x) => x.id === 'wbf')!

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.head.querySelectorAll('style[data-test]').forEach((n) => n.remove())
  document.body.innerHTML = ''
})

describe('card PDFs (e3-t13)', () => {
  it('makes one HTML file of the page: styles inline without web fonts, no scripts, nothing printing hides', () => {
    const style = document.createElement('style')
    style.dataset.test = ''
    style.textContent = '@font-face { font-family: X; src: url(/x.woff2); } [data-card-paper] { width: 750pt; }'
    document.head.append(style)
    const print = document.createElement('style')
    print.dataset.test = ''
    print.media = 'print'
    print.textContent = '@page { size: A4 landscape; margin: 20pt 46pt; }'
    document.head.append(print)
    document.documentElement.lang = 'zh-Hant'
    document.body.innerHTML =
      '<div data-print="hide"><button>下載 PDF</button></div><div data-card-paper>1NT 15-17</div><script>alert(1)</script>'

    const html = printableHtml()
    expect(html.startsWith('<!doctype html><html')).toBe(true)
    expect(html).toContain('lang="zh-Hant"')
    expect(html).toContain('width: 750pt')
    expect(html).toMatch(/@media print \{\s*@page/)
    expect(html).not.toContain('@font-face')
    expect(html).toContain('<div data-card-paper="">1NT 15-17</div>')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('下載 PDF')
  })

  it('names the file in ASCII, as the Worker keeps it', () => {
    expect(pdfFileName(wbf, '社團預設')).toBe('wbf')
    expect(pdfFileName(wbf, 'A team', 3)).toBe('wbf-A-team-v3')
  })

  it('posts the page and returns the PDF; the Worker’s refusal is an error with its code', async () => {
    const fetch = vi.fn(async () => new Response('%PDF-', { headers: { 'Content-Type': 'application/pdf' } }))
    vi.stubGlobal('fetch', fetch)
    const blob = await fetchCardPdf({ html: '<p>x</p>', paper: 'A4-landscape', name: 'wbf' })
    expect(await blob.text()).toBe('%PDF-')
    expect(fetch).toHaveBeenCalledWith('/api/book/card-pdf', expect.objectContaining({ method: 'POST' }))
    expect(JSON.parse((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)).toEqual({
      html: '<p>x</p>',
      paper: 'A4-landscape',
      name: 'wbf',
    })

    vi.stubGlobal('fetch', async () => Response.json({ error: '額度用完了', code: 'cardPdfBusy' }, { status: 429 }))
    await expect(fetchCardPdf({ html: '<p>x</p>', paper: 'A4-portrait' })).rejects.toMatchObject({ status: 429, code: 'cardPdfBusy' })
    await expect(fetchCardPdf({ html: 'x'.repeat(CARD_PDF_LIMITS.htmlBytesMax + 1), paper: 'A4-portrait' })).rejects.toMatchObject({ status: 413 })
  })

  it('falls back to the print dialog, saying why, when the Worker cannot make it', async () => {
    vi.stubGlobal('fetch', async () => Response.json({ error: '現在無法在伺服器產生 PDF', code: 'cardPdfOff' }, { status: 503 }))
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    themed(<PdfDownload template={wbf} profileName="社團預設" />)
    await userEvent.click(screen.getByRole('button', { name: t.pdf }))
    expect(await screen.findByRole('status')).toHaveTextContent(t.pdfFallback('現在無法在伺服器產生 PDF'))
    expect(print).toHaveBeenCalledOnce()
  })

  it('downloads the PDF when the Worker makes it, without printing', async () => {
    vi.stubGlobal('fetch', async () => new Response('%PDF-', { headers: { 'Content-Type': 'application/pdf' } }))
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    const created = vi.fn(() => 'blob:x')
    URL.createObjectURL = created
    URL.revokeObjectURL = () => {}
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    themed(<PdfDownload template={wbf} profileName="A" version={2} />)
    await userEvent.click(screen.getByRole('button', { name: t.pdf }))
    await vi.waitFor(() => expect(click).toHaveBeenCalledOnce())
    expect(created).toHaveBeenCalledOnce()
    expect(print).not.toHaveBeenCalled()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
