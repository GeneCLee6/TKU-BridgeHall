import { conventions } from '../../src/content/index.ts'
import { loadBundled } from '../../src/content/loaders.ts'
import { manifest } from '../../src/content/manifest.ts'
import { conventionMeta } from '../../src/lib/sections.ts'

/** The manifest and the lazy chunks must describe exactly the registered conventions */
describe('content manifest', () => {
  it('is up to date (run `npm run manifest` after changing a convention)', () => {
    expect(manifest).toEqual(conventions.map(conventionMeta))
  })

  it('holds no content', () => {
    for (const meta of manifest) expect(meta).not.toHaveProperty('sections')
  })

  it.each(conventions.map((c) => [c.slug, c] as const))('%s loads from its own file', async (slug, c) => {
    expect(await loadBundled(slug)).toBe(c)
  })

  it('loads nothing for an unknown slug', async () => {
    expect(await loadBundled('no-such-convention')).toBeUndefined()
  })
})
