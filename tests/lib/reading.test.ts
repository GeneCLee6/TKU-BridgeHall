import { placeParam, readingPath, readingShare } from '../../src/lib/reading.ts'

/** 閱讀進度 (e5-t14): where 「繼續閱讀」 goes, and how far along */
describe('reading places', () => {
  it('goes back to the block or page reached', () => {
    expect(readingPath({ kind: 'article', id: 'leads', place: 4 })).toBe('/library/leads?at=4')
    expect(readingPath({ kind: 'article', id: 'leads', place: 0 })).toBe('/library/leads')
    expect(readingPath({ kind: 'ebook', id: '0123456789ab', place: 40 })).toBe('/library/book/0123456789ab?page=40')
    expect(readingPath({ kind: 'ebook', id: '0123456789ab', place: 1 })).toBe('/library/book/0123456789ab')
  })

  it('reads a place from the address only when it is a whole number in range', () => {
    expect(placeParam('3', 0, 5)).toBe(3)
    expect(placeParam('0', 0, 5)).toBe(0)
    for (const value of [null, '', '6', '-1', '1.5', 'x', '0', ' 2']) expect(placeParam(value, 1, 5)).toBeUndefined()
  })

  it('counts the last block of an article and the last page of a book as all of it', () => {
    expect(readingShare({ kind: 'article', place: 0, of: 4 })).toBe(25)
    expect(readingShare({ kind: 'article', place: 3, of: 4 })).toBe(100)
    expect(readingShare({ kind: 'ebook', place: 50, of: 200 })).toBe(25)
    expect(readingShare({ kind: 'ebook', place: 200, of: 200 })).toBe(100)
  })
})
