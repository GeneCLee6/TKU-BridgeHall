// @vitest-environment node
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { exportFiles, exportName, exportSummary } from '../../scripts/export-files.ts'
import { conventions } from '../fixtures/content.ts'
import type { BookExport } from '../../src/lib/api.ts'
import type { Convention } from '../../src/types/convention.ts'

/**
 * The backup (L1, e8-t12): GET /api/book/export turned into files laid out like the private content repository. The text must
 * come out exactly as the Worker served it (CLAUDE.md rule 1), so the files are imported back here.
 */
const amy = { version: 3, updatedAt: Date.UTC(2026, 9, 29), updatedBy: 'amy', bundledUpdated: '2026-10-21' }
const edited: Convention = { ...conventions[1], summary: '線上改過的摘要' }
const added: Convention = { ...conventions[0], slug: '2-over-1', nameZh: '二蓋一' }

function sample(extra: Partial<BookExport> = {}): BookExport {
  return {
    format: 1,
    exportedAt: Date.UTC(2026, 9, 30),
    version: 7,
    builtinVersion: 2,
    conventions: [
      { slug: conventions[0].slug, source: 'builtin', builtin: true, convention: conventions[0] },
      { slug: edited.slug, source: 'online', builtin: true, convention: edited, online: amy },
      ...conventions.slice(3).map((c) => ({ slug: c.slug, source: 'builtin' as const, builtin: true, convention: c })),
      { slug: added.slug, source: 'online', builtin: false, convention: added, online: { ...amy, version: 1, bundledUpdated: undefined } },
    ],
    hidden: [{ slug: conventions[2].slug, builtin: true, online: { ...amy, version: 2 } }],
    categories: [],
    ...extra,
  }
}

const scratch = resolve(__dirname, '../../tmp/export-test')
afterAll(() => rmSync(scratch, { recursive: true, force: true }))

describe('content export (backup)', () => {
  it('names each convention as the registry does', () => {
    for (const c of conventions) expect(exportName(c.slug)).toMatch(/^[a-z][A-Za-z0-9]*$/)
    expect(exportName('fixture-alpha')).toBe('fixtureAlpha')
    expect(exportName('made-up-vs-2nt')).toBe('madeUpVs2nt')
    expect(exportName('2-over-1')).toBe('c2Over1')
  })

  it('writes one file per convention read, the registry in order, and leaves out what is hidden', () => {
    const data = sample()
    const files = exportFiles(data)
    const conventionFiles = [...files.keys()].filter((p) => p.startsWith('conventions/'))
    expect(conventionFiles).toEqual(data.conventions.map((c) => `conventions/${c.slug}.ts`))
    expect(files.has(`conventions/${conventions[2].slug}.ts`)).toBe(false)
    expect(files.has('categories.ts')).toBe(false)
    expect(files.get(`conventions/${edited.slug}.ts`)).toContain('An online version over the built-in convention: online version 3 (amy, 2026-10-29)')
    expect(files.get('conventions/2-over-1.ts')).toContain('Online only: online version 1')
    const readme = files.get('README.md')!
    expect(readme).toContain(`\`${conventions[2].slug}\` (built-in): online version 2`)
    expect(readme).toContain('| `2-over-1` | 二蓋一 | online only | online version 1 (amy, 2026-10-29) |')
  })

  it('keeps export.json free of the export time, so an unchanged export changes no file', () => {
    const a = exportFiles(sample())
    const b = exportFiles(sample({ exportedAt: Date.UTC(2027, 0, 1) }))
    expect([...a.entries()]).toEqual([...b.entries()])
    const json = JSON.parse(a.get('export.json')!)
    expect(json.exportedAt).toBeUndefined()
    expect(json.conventions[1].convention).toEqual(edited)
  })

  it('writes the categories only when they were edited online', () => {
    const categories = [
      { id: 'b', label: '乙', description: '', order: 1 },
      { id: 'a', label: '甲', description: '說明', order: 0 },
    ]
    const edited = exportFiles(sample({ categories }))
    const text = edited.get('categories.ts')!
    expect(JSON.parse(text.slice(text.indexOf('= ') + 2))).toEqual([categories[1], categories[0]])
    // The registry sits in src/content-private/: its own categories, or BridgeHall's
    expect(edited.get('index.ts')).toContain("export { categories } from './categories.ts'")
    expect(exportFiles(sample()).get('index.ts')).toContain("export { categories } from '../content/categories.ts'")
  })

  it('round-trips every convention word for word through the generated .ts files', async () => {
    const data = sample()
    rmSync(scratch, { recursive: true, force: true })
    for (const [path, text] of exportFiles(data)) {
      const file = join(scratch, 'private', path)
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, text)
    }
    mkdirSync(join(scratch, 'content'), { recursive: true })
    writeFileSync(join(scratch, 'content/categories.ts'), 'export const categories = []\n')
    writeFileSync(join(scratch, 'content/references.ts'), 'export const references = []\n')
    const registry = await import(pathToFileURL(join(scratch, 'private/index.ts')).href)
    expect(registry.conventions).toEqual(data.conventions.map((c) => c.convention))
    expect(JSON.stringify(registry.conventions)).toBe(JSON.stringify(data.conventions.map((c) => c.convention)))
    expect(registry.conventionBySlug(edited.slug).summary).toBe('線上改過的摘要')
  })

  it('summarizes without any convention text, for public logs', () => {
    const summary = exportSummary(sample())
    expect(summary).toBe(`${sample().conventions.length} conventions (2 online, 1 of them online only), 1 hidden; online version 7, built-in version 2`)
    expect(summary).not.toContain(conventions[0].nameZh)
  })

  it('refuses an export in a format it does not know', () => {
    expect(() => exportFiles({ ...sample(), format: 2 } as unknown as BookExport)).toThrow('Unknown export format')
  })
})
