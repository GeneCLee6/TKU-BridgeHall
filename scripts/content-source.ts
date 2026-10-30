// Where the scripts find the club's built-in conventions (2026-10-30): not in this public
// repository but in the private GeneCLee6/TKU-BridgeHall-content, checked out (gitignored) into
// src/content-private/ (CONTENT_GUIDE.md §0). Loaded by path at run time, so the scripts type-check
// and the site builds without the checkout; a script that needs the text says so and stops.
import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import type { Convention } from '../src/types/convention.ts'

export const PRIVATE_CONTENT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content-private')
const privateIndex = join(PRIVATE_CONTENT_DIR, 'index.ts')

export const hasPrivateContent = (): boolean => existsSync(privateIndex)

export const MISSING_PRIVATE_CONTENT =
  'The built-in conventions are not here: clone the private repository into src/content-private/\n' +
  '  git clone https://github.com/GeneCLee6/TKU-BridgeHall-content.git src/content-private\n' +
  '(it needs access to that repository; CONTENT_GUIDE.md §0).'

/** The built-in conventions in catalogue order, from src/content-private/index.ts; throws when it is missing */
export async function privateConventions(): Promise<Convention[]> {
  if (!hasPrivateContent()) throw new Error(MISSING_PRIVATE_CONTENT)
  const registry = (await import(pathToFileURL(privateIndex).href)) as { conventions?: Convention[] }
  if (!registry.conventions?.length) throw new Error(`${privateIndex} has no conventions`)
  return registry.conventions
}

/** For a script's top level: the conventions, or a clear message and exit code 2 */
export async function privateConventionsOrExit(): Promise<Convention[]> {
  try {
    return await privateConventions()
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e))
    process.exit(2)
  }
}
