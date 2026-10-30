import type { Convention } from '../../src/types/convention.ts'

/**
 * The built-in conventions tests/setup.ts serves as the Worker would: the made-up ones in
 * tests/fixtures (Vitest project `public`), or the club's from the private checkout (project
 * `content`, vite.config.ts, which sets BOOK_CONTENT=private). The private registry is loaded by a
 * path the type checker does not follow, so the public repository builds without the checkout.
 */
const PRIVATE_INDEX = '../../src/content-private/index.ts'

/** True in the project `content`: the tests there read the club's conventions (no Node types here, hence the cast) */
export const realContent = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env.BOOK_CONTENT === 'private'

export async function builtinConventions(): Promise<Convention[]> {
  if (realContent)
    return ((await import(/* @vite-ignore */ PRIVATE_INDEX)) as { conventions: Convention[] }).conventions
  return (await import('./content.ts')).conventions
}
