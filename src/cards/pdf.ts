import { ApiError, CARD_PDF_LIMITS, type CardPdfRequest } from '../lib/api.ts'
import type { CardTemplate } from './types.ts'
import { clubHeaders } from '../lib/club.ts'

/**
 * 下載 PDF on the card pages (E3 e3-t13, AC-3.4): the page's own print layout, sent to the
 * BridgeTable Worker (worker/card-pdf.ts), which prints it to A4 with Cloudflare Browser Run and
 * answers the PDF. The Worker runs no JavaScript and fetches nothing, so the HTML carries its
 * styles inline and the browser there uses its own fonts (Arial, Noto CJK). When the Worker cannot
 * (no Browser Run, its allowance used, signed out, offline) the page falls back to the browser's
 * print dialog, as before (CardOutputs.tsx `PdfDownload`).
 */

/** The page as one HTML file: every style rule inline (no web fonts), the body without scripts or what printing hides */
export function printableHtml(doc: Document = document): string {
  const css: string[] = []
  for (const sheet of Array.from(doc.styleSheets)) {
    let rules: CSSRuleList
    try {
      rules = sheet.cssRules
    } catch {
      continue
    }
    const text = Array.from(rules)
      .map((rule) => rule.cssText)
      .filter((rule) => !rule.startsWith('@font-face'))
      .join('\n')
    if (!text) continue
    const media = sheet.media?.mediaText
    css.push(media && media !== 'all' ? `@media ${media} {\n${text}\n}` : text)
  }
  const body = doc.body.cloneNode(true) as HTMLElement
  for (const node of Array.from(body.querySelectorAll('script, noscript, iframe, link, template, [data-print="hide"]'))) node.remove()
  const root = doc.documentElement
  const attributes = Array.from(root.attributes)
    .map((a) => ` ${a.name}="${a.value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`)
    .join('')
  // `</style` inside a rule would end the style element early
  const style = css.join('\n').replace(/<\/style/gi, '<\\/style')
  return `<!doctype html><html${attributes}><head><meta charset="utf-8"><style>${style}</style></head>${body.outerHTML}</html>`
}

/** The PDF's file name: like the Word file's (cards/docx.ts `cardFileName`), ASCII only for the Worker */
export function pdfFileName(template: CardTemplate, profileName: string, version?: number): string {
  const safe = profileName.replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '')
  return [template.id, safe, version ? `v${version}` : ''].filter(Boolean).join('-')
}

/** Asks the Worker for the PDF; throws ApiError (or a network error) when it cannot */
export async function fetchCardPdf(input: CardPdfRequest): Promise<Blob> {
  if (new TextEncoder().encode(input.html).length > CARD_PDF_LIMITS.htmlBytesMax) {
    throw new ApiError('制度卡太大', 413, 'tooLarge')
  }
  const response = await fetch('/api/book/card-pdf', {
    method: 'POST',
    credentials: 'same-origin',
    headers: clubHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(input),
  })
  if (!response.ok || !(response.headers.get('Content-Type') ?? '').includes('application/pdf')) {
    const data = await response.json().catch(() => ({}))
    throw new ApiError(data.error ?? `伺服器回應 ${response.status}`, response.status, data.code ?? '', data.params ?? {})
  }
  return response.blob()
}

/** Starts a download of `blob` as `name` (as cards/docx.ts `downloadBlob`, without loading the Word chunk) */
export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
