import { ApiError, request, send, TABLE_SITE } from './api.ts'
import type { FileTicket, UploadedFile } from './account.ts'

/**
 * 電子書（E5 e5-t09～e5-t11、e5-t15）: the calls and types only the e-book pages use, kept out of
 * `api.ts` so the home page's bundle does not carry them. The types mirror TKU-BridgeTable
 * `shared/ebooks.ts` (`parity/table-types.ts`, `tests/lib/tableParity.test.ts`).
 *
 * Uploading: a reviewer takes a pass (`POST /api/book/ebooks/ticket`), sends the PDF straight to
 * the Worker (`PUT`, at most 50 MB: too large to go through the site's `/api` rewrite), then saves
 * the record. Reading: anyone, but `members-only` books are left out for someone signed out and
 * their PDF's address is only signed for a member, and only for 15 minutes.
 */

export const EBOOK_TYPE = 'application/pdf'
export const EBOOK_KEY = /^ebook\/[0-9a-f]{24}\.pdf$/
export const EBOOK_LICENSES = ['own', 'permitted', 'members-only'] as const
export type EbookLicense = (typeof EBOOK_LICENSES)[number]

export const EBOOK_LIMITS = {
  maxBytes: 50 * 1024 * 1024,
  titleMax: 120,
  authorsMax: 10,
  nameMax: 40,
  seriesMax: 40,
  urlMs: 15 * 60 * 1000,
  booksMax: 500,
} as const

export const STORAGE_LIMITS = {
  warnBytes: 8 * 1024 ** 3,
  maxBytes: 10 * 1024 ** 3,
} as const

export interface FileUsage {
  bytes: number
  warnBytes: number
  maxBytes: number
}

export interface EbookTicketRequest {
  size: number
}

export interface EbookInput {
  title: string
  authors: string[]
  series: string
  year?: number
  license: EbookLicense
  fileKey: string
  pages?: number
  cover?: string
}

export interface Ebook extends EbookInput {
  id: string
  size: number
  uploadedBy: string
  createdAt: number
  updatedAt: number
  updatedBy: string
}

export type EbookFiles = Record<string, { url: string; thumbUrl?: string }>

export interface EbookList {
  ebooks: Ebook[]
  files: EbookFiles
  usage?: FileUsage
}

export interface EbookResponse {
  ebook: Ebook
  files: EbookFiles
}

/**
 * A Worker address (`/api/…`) as the browser should reach it: straight at the Worker on the
 * site, since a large PDF should not go through Vercel's rewrite (the Worker answers CORS for
 * uploads and files); through the dev server's proxy while developing
 */
export const workerUrl = (path: string) => (import.meta.env.DEV ? path : `${TABLE_SITE}${path}`)

export const ebookApi = {
  list: () => request<EbookList>('/api/book/ebooks'),
  get: (id: string) => request<EbookResponse>(`/api/book/ebooks/${encodeURIComponent(id)}`),
  ticket: (size: number) => send<FileTicket>('POST', '/api/book/ebooks/ticket', { size } satisfies EbookTicketRequest),
  create: (input: EbookInput) => send<{ ebook: Ebook }>('POST', '/api/book/ebooks', input).then((r) => r.ebook),
  update: (id: string, input: EbookInput) =>
    send<{ ebook: Ebook }>('PUT', `/api/book/ebooks/${encodeURIComponent(id)}`, input).then((r) => r.ebook),
  remove: (id: string) => send<{ ok: true }>('DELETE', `/api/book/ebooks/${encodeURIComponent(id)}`),
}

/** Why a PDF cannot be uploaded, before asking the Worker: not a PDF, or too large */
export function pdfProblem(file: { type: string; name: string; size: number }): 'type' | 'size' | null {
  if (file.type !== EBOOK_TYPE && !/\.pdf$/i.test(file.name)) return 'type'
  if (file.size > EBOOK_LIMITS.maxBytes) return 'size'
  return null
}

/** The Worker's answer to an upload, as `request` reads one */
function uploadResult(xhr: XMLHttpRequest): { file?: UploadedFile; error?: string; code?: string; params?: Record<string, string | number> } {
  try {
    return JSON.parse(xhr.responseText)
  } catch {
    return {}
  }
}

/**
 * Takes a pass and uploads the PDF, telling `onProgress` the share sent (0–1). Resolves with the
 * file's key; rejects with an ApiError as `request` would (status 0 when the network failed)
 */
export async function uploadPdf(file: Blob, onProgress: (share: number) => void = () => {}): Promise<string> {
  const ticket = await ebookApi.ticket(file.size)
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', workerUrl(ticket.uploadUrl))
    xhr.setRequestHeader('Content-Type', EBOOK_TYPE)
    xhr.upload.onprogress = (event) => event.lengthComputable && onProgress(event.loaded / event.total)
    xhr.onload = () => {
      const result = uploadResult(xhr)
      if (xhr.status >= 200 && xhr.status < 300 && result.file) resolve(result.file.key)
      else reject(new ApiError(result.error ?? `伺服器回應 ${xhr.status}`, xhr.status, result.code ?? '', result.params ?? {}))
    }
    xhr.onerror = () => reject(new TypeError('network'))
    xhr.send(file)
  })
}

/** "12.3 MB", "850 KB", "7.9 GB" */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

/** True once the files pass the warning line (8 GB of R2's free 10 GB, e5-t15) */
export const nearlyFull = (usage: FileUsage | undefined) => !!usage && usage.bytes >= usage.warnBytes

/** The books grouped by series, in the order each series first appears; books by title within one */
export function bySeries(ebooks: Ebook[]): [string, Ebook[]][] {
  const groups = new Map<string, Ebook[]>()
  for (const book of ebooks) groups.set(book.series, [...(groups.get(book.series) ?? []), book])
  return [...groups].map(([series, books]) => [series, books.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hant'))])
}

/** The form's fields, as typed, to a record for the Worker; authors are separated by 、 , or ， */
export interface EbookForm {
  title: string
  authors: string
  series: string
  year: string
  license: EbookLicense | ''
  pages: string
}

export function formToInput(form: EbookForm, fileKey: string, cover?: string): EbookInput | string {
  const title = form.title.trim()
  const series = form.series.trim()
  const authors = form.authors
    .split(/[、,，]/)
    .map((a) => a.trim())
    .filter(Boolean)
  if (!title) return 'title'
  if (!authors.length) return 'authors'
  if (!series) return 'series'
  if (!form.license) return 'license'
  const input: EbookInput = { title, authors, series, license: form.license, fileKey }
  if (form.year.trim()) {
    const year = Number(form.year)
    if (!Number.isInteger(year) || year < 1900 || year > 2100) return 'year'
    input.year = year
  }
  if (form.pages.trim()) {
    const pages = Number(form.pages)
    if (!Number.isInteger(pages) || pages <= 0) return 'pages'
    input.pages = pages
  }
  if (cover) input.cover = cover
  return input
}

export const formOf = (book?: Ebook): EbookForm => ({
  title: book?.title ?? '',
  authors: book?.authors.join('、') ?? '',
  series: book?.series ?? '',
  year: book?.year ? String(book.year) : '',
  // No default: every book needs its license chosen (AC-5.4)
  license: book?.license ?? '',
  pages: book?.pages ? String(book.pages) : '',
})
