import { glossary as bundled } from '../../src/content/glossary.ts'
import { draftsToTerms } from '../../src/glossary/drafts.ts'
import { compileGlossary, filterTerms, resolveGlossary, splitTerms, termAnchor } from '../../src/glossary/match.ts'
import type { Term } from '../../src/types/glossary.ts'

/** Test data only: the club's explanations are the officers' to write (CLAUDE.md rule 1) */
const terms: Term[] = [
  { term: 'GF', aliases: ['成局迫叫'], definition: '測試定義甲' },
  { term: '2NT', aliases: [], definition: '測試定義乙' },
  { term: 'Jacoby 2NT', aliases: [], definition: '測試定義丙', see: 'jacoby-2nt' },
  { term: '束叫', aliases: [], definition: '測試定義丁' },
]
const compiled = compileGlossary(terms)
const split = (text: string, seen = new Set<string>()) => splitTerms(text, compiled, seen)
const marked = (text: string) => split(text).filter((p) => p.term).map((p) => p.text)

describe('glossary matching (e4-t06)', () => {
  it('never changes the text', () => {
    const text = '[原文已移除]2NT為人為性叫品，pass束叫。'
    expect(split(text).map((p) => p.text).join('')).toBe(text)
    expect(marked(text)).toEqual(['GF', '2NT', '束叫'])
  })

  it('matches whole words only for names made of letters and digits', () => {
    expect(marked('GFX 與 AGF 都不是')).toEqual([])
    expect(marked('12NT 不算，(2NT) 算')).toEqual(['2NT'])
    expect(marked('不束叫')).toEqual(['束叫'])
  })

  it('prefers the longest name and ignores case', () => {
    expect(marked('用 jacoby 2nt 回答')).toEqual(['jacoby 2nt'])
    expect(split('jacoby 2nt').find((p) => p.term)?.term?.term).toBe('Jacoby 2NT')
  })

  it('marks each term once a paragraph, counting its aliases', () => {
    expect(marked('GF 之後再 GF，成局迫叫')).toEqual(['GF'])
    const seen = new Set<string>()
    split('GF', seen)
    expect(split('GF', seen).filter((p) => p.term)).toEqual([])
  })

  it('does nothing without terms', () => {
    const empty = compileGlossary([])
    expect(empty.pattern).toBeNull()
    expect(splitTerms('GF', empty, new Set())).toEqual([{ text: 'GF' }])
  })
})

describe('the glossary list (e4-t05)', () => {
  it('ships empty until the officers write it', () => {
    expect(bundled).toEqual([])
  })

  it('uses the online list once saved, even when empty', () => {
    expect(resolveGlossary(terms, undefined)).toHaveLength(4)
    expect(resolveGlossary(terms, { version: 0, terms: [] })).toHaveLength(4)
    expect(resolveGlossary(terms, { version: 2, terms: [] })).toEqual([])
    expect(resolveGlossary([], { version: 1, terms: [terms[3], terms[0]] }).map((t) => t.term)).toEqual(['束叫', 'GF'])
  })

  it('filters by name, alias and explanation', () => {
    expect(filterTerms(terms, 'gf').map((t) => t.term)).toEqual(['GF'])
    expect(filterTerms(terms, '成局').map((t) => t.term)).toEqual(['GF'])
    expect(filterTerms(terms, '定義丙').map((t) => t.term)).toEqual(['Jacoby 2NT'])
    expect(filterTerms(terms, ' ')).toHaveLength(4)
  })

  it('gives each term an anchor usable as an id', () => {
    expect(termAnchor('Jacoby 2NT')).toBe('term-jacoby202nt')
    expect(termAnchor('束叫')).toMatch(/^term-[A-Za-z0-9-]+$/)
  })
})

describe('glossary editor drafts (e4-t07)', () => {
  const row = (term: string, aliases = '', definition = '測試', see = '') => ({ term, aliases, definition, see })
  it('turns rows into terms', () => {
    expect(draftsToTerms([row(' GF ', '成局迫叫，GF force, ', ' 測試 ', 'jacoby-2nt')])).toEqual([
      { term: 'GF', aliases: ['成局迫叫', 'GF force'], definition: '測試', see: 'jacoby-2nt' },
    ])
  })
  it('refuses incomplete rows and names used twice', () => {
    expect(draftsToTerms([row('GF', '', ' ')])).toBe('每個名詞都要有名稱與解釋。')
    expect(draftsToTerms([row('GF'), row('束叫', 'gf')])).toBe('名詞或別名重複：gf')
  })
})
