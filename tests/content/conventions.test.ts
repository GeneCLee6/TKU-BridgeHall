import { categories, conventions } from '../../src/content/index.ts'
import { parseCall } from '../../src/lib/calls.ts'
import { pendingNotes, walkSections } from '../../src/lib/sections.ts'

/** The content schema: what every convention file must satisfy before it ships */
describe('convention content', () => {
  it('has unique, URL-safe slugs', () => {
    const slugs = conventions.map((c) => c.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    slugs.forEach((slug) => expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/))
  })

  it.each(conventions.map((c) => [c.slug, c] as const))('%s has every required field', (_, c) => {
    expect(c.nameZh.trim()).not.toBe('')
    expect(c.nameEn.trim()).not.toBe('')
    expect(c.summary.trim()).not.toBe('')
    expect(c.tags.length).toBeGreaterThan(0)
    expect(c.source.title.trim()).not.toBe('')
    expect(c.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(categories.map((cat) => cat.id)).toContain(c.category)
    expect(c.sections.length).toBeGreaterThan(0)
  })

  it.each(conventions.map((c) => [c.slug, c] as const))(
    '%s has unique, URL-safe section ids and no empty sections',
    (_, c) => {
      const ids: string[] = []
      walkSections(c.sections, (s) => {
        ids.push(s.id)
        expect(s.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
        expect(s.title.trim()).not.toBe('')
        expect((s.blocks?.length ?? 0) + (s.children?.length ?? 0)).toBeGreaterThan(0)
      })
      expect(new Set(ids).size).toBe(ids.length)
    },
  )

  it('uses only calls the renderer understands, and never an empty meaning', () => {
    const known = (call: string) => {
      const p = parseCall(call)
      return Boolean(p.suit) || /^(\dNT|Pass|X|XX|\?|—)$/.test(p.text)
    }
    for (const c of conventions) {
      walkSections(c.sections, (s) => {
        for (const block of s.blocks ?? []) {
          if (block.kind !== 'responses') continue
          for (const row of block.rows) {
            expect(row.meaning.trim(), `${c.slug}/${s.id} ${row.call}`).not.toBe('')
            expect(known(row.call), row.call).toBe(true)
          }
          for (const entry of block.auction?.calls ?? []) {
            const call = typeof entry === 'string' ? entry : entry.call
            expect(call === '' || known(call), call).toBe(true)
          }
        }
      })
    }
  })

  it('writes suits as ♠ ♥ ♦ ♣ in meanings, not as letters', () => {
    // A bid like "3H", or a suit letter right before Chinese text, means a missed conversion
    const missed = /\d[CDHS](?![a-z])|[CDHS](?=[一-鿿])/
    for (const c of conventions) {
      walkSections(c.sections, (s) => {
        for (const block of s.blocks ?? []) {
          if (block.kind !== 'responses') continue
          block.rows.forEach((r) => expect(r.meaning, `${c.slug}/${s.id}`).not.toMatch(missed))
        }
      })
    }
  })

  it('records the known 待確認 items', () => {
    const count = (slug: string) => pendingNotes(conventions.find((c) => c.slug === slug)!).length
    expect(count('lebensohl')).toBe(2)
    expect(count('defense-vs-unusual-2nt')).toBe(7)
  })
})
