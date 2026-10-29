import { describe, expect, it } from 'vitest'
import { bySeries, type Ebook, formatBytes, formOf, formToInput, nearlyFull, offeredLicenses, pdfProblem } from '../../src/lib/ebooks.ts'

/** 電子書 (e5-t09, e5-t15): the pure parts of the upload form and the list */

const book = (id: string, title: string, series: string): Ebook => ({
  id,
  title,
  series,
  authors: ['學長'],
  license: 'own',
  fileKey: `ebook/${id.padEnd(24, '0')}.pdf`,
  size: 1,
  uploadedBy: 'r',
  createdAt: 0,
  updatedAt: 0,
  updatedBy: 'r',
})

describe('e-books', () => {
  it('turns the form into a record, needing title, authors, series and a license', () => {
    const form = { title: ' 主打 ', authors: '甲、乙, 丙，', series: '主打', year: '2024', license: 'members-only' as const, pages: '' }
    expect(formToInput(form, 'ebook/x.pdf', 'article/c.webp')).toEqual({
      title: '主打',
      authors: ['甲', '乙', '丙'],
      series: '主打',
      year: 2024,
      license: 'members-only',
      fileKey: 'ebook/x.pdf',
      cover: 'article/c.webp',
    })
    expect(formToInput({ ...form, license: '' }, 'k')).toBe('license')
    expect(formToInput({ ...form, title: ' ' }, 'k')).toBe('title')
    expect(formToInput({ ...form, authors: '、' }, 'k')).toBe('authors')
    expect(formToInput({ ...form, series: '' }, 'k')).toBe('series')
    expect(formToInput({ ...form, year: '99' }, 'k')).toBe('year')
    expect(formToInput({ ...form, pages: '1.5' }, 'k')).toBe('pages')
  })

  it('starts a new book as 經授權轉載, and offers 僅社員可看 only to a book that has it (2026-10-29)', () => {
    expect(formOf().license).toBe('permitted')
    expect(offeredLicenses('permitted')).toEqual(['own', 'permitted'])
    expect(offeredLicenses('members-only')).toEqual(['own', 'permitted', 'members-only'])
    expect(formOf(book('a', 'A', 'S')).license).toBe('own')
  })

  it('takes only PDFs up to 50 MB', () => {
    expect(pdfProblem({ type: 'application/pdf', name: 'a.pdf', size: 10 })).toBeNull()
    expect(pdfProblem({ type: '', name: 'A.PDF', size: 10 })).toBeNull()
    expect(pdfProblem({ type: 'image/png', name: 'a.png', size: 10 })).toBe('type')
    expect(pdfProblem({ type: 'application/pdf', name: 'a.pdf', size: 50 * 1024 * 1024 + 1 })).toBe('size')
  })

  it('groups the books by series, in order of first appearance, titles sorted (by strokes, as in Taiwan)', () => {
    const groups = bySeries([book('1', '王牌', '防守'), book('2', '甲', '主打'), book('3', '一墩', '防守')])
    expect(groups.map(([series, books]) => [series, books.map((b) => b.id)])).toEqual([
      ['防守', ['3', '1']],
      ['主打', ['2']],
    ])
  })

  it('shows sizes and warns past 8 GB (e5-t15)', () => {
    expect(formatBytes(512)).toBe('1 KB')
    expect(formatBytes(12.34 * 1024 ** 2)).toBe('12.3 MB')
    expect(formatBytes(8 * 1024 ** 3)).toBe('8.0 GB')
    const usage = { bytes: 8 * 1024 ** 3 - 1, warnBytes: 8 * 1024 ** 3, maxBytes: 10 * 1024 ** 3 }
    expect(nearlyFull(usage)).toBe(false)
    expect(nearlyFull({ ...usage, bytes: usage.warnBytes })).toBe(true)
    expect(nearlyFull(undefined)).toBe(false)
  })
})
