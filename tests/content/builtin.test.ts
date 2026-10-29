import { builtinPayload, compareBuiltin } from '../../scripts/builtin-payload.ts'
import { conventions } from '../../src/content/index.ts'
import { buildSearchIndex } from '../../src/lib/search.ts'
import { builtinSource } from '../../src/state/builtinSource.ts'

/**
 * The built-in conventions go to the Worker as JSON (scripts/seed-builtin.ts, L0, e10-t20); the
 * text must arrive exactly as transcribed (CLAUDE.md rule 1)
 */
describe('built-in conventions seed', () => {
  it('sends every registered convention in catalogue order, with their search index', () => {
    const payload = builtinPayload()
    expect(payload.conventions.map((c) => c.slug)).toEqual(conventions.map((c) => c.slug))
    expect(payload.searchIndex).toEqual(buildSearchIndex(conventions))
  })

  // A field set to undefined is the same as none (the Worker keeps neither); anything else JSON
  // cannot carry (a date, NaN, a function) would change the text and fails here
  it.each(conventions.map((c) => [c.slug, c] as const))('%s survives JSON unchanged', (_slug, c) => {
    expect(JSON.parse(JSON.stringify(c))).toEqual(c)
  })

  it('finds nothing to report when the Worker serves exactly the source', () => {
    const { conventions: list, searchIndex } = builtinPayload()
    expect(compareBuiltin(JSON.stringify(list), JSON.stringify(searchIndex))).toEqual([])
  })

  it('reports a changed character, a missing convention, another order and a stale index', () => {
    const { conventions: list, searchIndex } = builtinPayload()
    const edited = structuredClone(list)
    edited[0] = { ...edited[0], summary: `${edited[0].summary}。` }
    expect(compareBuiltin(JSON.stringify(edited), JSON.stringify(searchIndex))).toEqual([`${list[0].slug}: content differs`])
    const fewer = list.slice(1)
    expect(compareBuiltin(JSON.stringify(fewer), JSON.stringify(searchIndex))).toEqual([
      expect.stringContaining('order or set differs'),
      `${list[0].slug}: not served`,
    ])
    const swapped = [list[1], list[0], ...list.slice(2)]
    expect(compareBuiltin(JSON.stringify(swapped), JSON.stringify(searchIndex))).toEqual([expect.stringContaining('order or set differs')])
    expect(compareBuiltin(JSON.stringify(list), '{"version":1,"records":[]}')).toEqual(['search index differs'])
  })

  it('gives the component tests the same conventions (tests/setup.ts)', async () => {
    expect(builtinSource.fallback.map((m) => m.slug)).toEqual(conventions.map((c) => c.slug))
    expect(await builtinSource.load('lebensohl')).toBe(conventions.find((c) => c.slug === 'lebensohl'))
  })
})
