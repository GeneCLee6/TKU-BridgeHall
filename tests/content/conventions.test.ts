import { categories, conventions } from '../fixtures/content.ts'
import { splitCall } from '../../src/lib/calls.ts'
import { conventionProblems } from '../../src/lib/content.ts'
import { basicHiddenIds } from '../../src/lib/levels.ts'
import { pendingNotes, walkSections } from '../../src/lib/sections.ts'
import { conventionKinds, levels } from '../../src/types/convention.ts'

/**
 * The content schema: what every convention file must satisfy before it ships. Here on the made-up
 * fixtures (tests/fixtures); the same file runs on the club's conventions in the private content
 * repository, and on each day's export there (.github/workflows/content-backup.yml).
 */
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
      return splitCall(call).every(
        (p) => Boolean(p.suit) || /^(\dNT|NT|Pass|X|XX|\?|—)$/.test(p.text),
      )
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
    // A bid like "3H", or a lone suit letter right before Chinese text, means a missed conversion
    // (letters inside English words such as VOID do not count)
    const missed = /\d[CDHS](?![a-z])|(?<![A-Za-z])[CDHS](?=[一-鿿])/
    for (const c of conventions) {
      walkSections(c.sections, (s) => {
        for (const block of s.blocks ?? []) {
          if (block.kind !== 'responses') continue
          block.rows.forEach((r) => expect(r.meaning, `${c.slug}/${s.id}`).not.toMatch(missed))
        }
      })
    }
  })

  it.each(conventions.map((c) => [c.slug, c] as const))(
    '%s has a known kind and level, and prerequisites that exist',
    (_, c) => {
      const slugs = conventions.map((x) => x.slug)
      // Every bundled card is classified (CONTENT_GUIDE.md §2.1); the fields stay optional in the type
      expect(conventionKinds).toContain(c.kind)
      expect(levels).toContain(c.level)
      walkSections(c.sections, (s) => {
        if (s.level !== undefined) expect(levels, `${c.slug}/${s.id}`).toContain(s.level)
      })
      const prerequisites = c.prerequisites ?? []
      expect(new Set(prerequisites).size).toBe(prerequisites.length)
      for (const p of prerequisites) {
        expect(slugs, `${c.slug} → ${p}`).toContain(p)
        expect(p).not.toBe(c.slug)
      }
      expect(conventionProblems(c, categories.map((x) => x.id))).toEqual([])
    },
  )

  // 入門版 must not empty a 入門 convention (PRD E4 risks; e4-t02)
  it.each(conventions.filter((c) => c.level === 'basic').map((c) => [c.slug, c] as const))(
    '%s keeps a section in 入門版',
    (_, c) => {
      const hidden = basicHiddenIds(c.sections, c.level)
      expect(c.sections.some((s) => !hidden.has(s.id))).toBe(true)
    },
  )

  it('has no circular prerequisites', () => {
    const bySlug = new Map(conventions.map((c) => [c.slug, c.prerequisites ?? []]))
    const visit = (slug: string, path: string[]): void => {
      expect(path, `circular: ${[...path, slug].join(' → ')}`).not.toContain(slug)
      for (const next of bySlug.get(slug) ?? []) visit(next, [...path, slug])
    }
    for (const c of conventions) visit(c.slug, [])
  })

  it('records the known 待確認 items', () => {
    const count = (slug: string) => pendingNotes(conventions.find((c) => c.slug === slug)!).length
    // The made-up fixtures; the club's counts are recorded in the private content repository's copy
    // of this test (CONTENT_GUIDE.md §0, its PENDING.md lists them)
    expect(count('fixture-alpha')).toBe(2)
    expect(count('fixture-beta')).toBe(1)
    expect(count('fixture-system')).toBe(0)
  })
})
