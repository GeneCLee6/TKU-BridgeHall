// Exports every convention members read from TKU BridgeTable's Worker (L1, e8-t12; CONTENT_GUIDE.md §6.5):
// the built-in layer with the online versions laid over it, as JSON and as src/content-style `.ts`
// files (scripts/export-files.ts). .github/workflows/content-backup.yml runs it every day and pushes
// the files to the private backup repository; run it by hand for a copy of your own:
//
//   npm run export-content                       # writes tmp/content-export/ (tmp/ is never committed)
//   npm run export-content -- --out <dir>        # somewhere else (the directory is emptied first)
//
// Options: --base <url> (default: production's Worker). The token is BOOK_EXPORT_TOKEN (read only;
// TKU-BridgeTable DEPLOY.md §4.10), from the environment or from .env.seed (never committed).
// It prints only counts, never convention text: the workflow's logs are public.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { BookExport } from '../src/lib/bookExport.ts'
import { exportFiles, exportSummary } from './export-files.ts'

const PRODUCTION = 'https://tku-bridge-table.genelee-pro.workers.dev'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const args = process.argv.slice(2)
const option = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const base = (option('base') ?? PRODUCTION).replace(/\/$/, '')
const out = resolve(option('out') ?? join(root, 'tmp', 'content-export'))

function exportToken(): string {
  if (process.env.BOOK_EXPORT_TOKEN) return process.env.BOOK_EXPORT_TOKEN
  try {
    const line = readFileSync(join(root, '.env.seed'), 'utf8')
      .split(/\r?\n/)
      .find((l) => l.startsWith('BOOK_EXPORT_TOKEN='))
    if (line) return line.slice('BOOK_EXPORT_TOKEN='.length).trim()
  } catch {
    // No file: say so below
  }
  console.error('No export token: set BOOK_EXPORT_TOKEN or put BOOK_EXPORT_TOKEN=... in .env.seed (TKU-BridgeTable DEPLOY.md §4.10).')
  process.exit(2)
}

const response = await fetch(`${base}/api/book/export`, { headers: { Authorization: `Bearer ${exportToken()}` } })
if (!response.ok) {
  // The error body is the Worker's code and message, never content
  console.error(`GET /api/book/export at ${base}: ${response.status} ${(await response.text()).slice(0, 300)}`)
  process.exit(1)
}
const data = (await response.json()) as BookExport
if (!data.conventions?.length) {
  console.error(`The export from ${base} has no conventions: refusing to write an empty backup.`)
  process.exit(1)
}
const files = exportFiles(data)

rmSync(out, { recursive: true, force: true })
for (const [path, text] of files) {
  const file = join(out, path)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, text)
}
console.log(`Exported from ${base}: ${exportSummary(data)}.`)
console.log(`Wrote ${files.size} files to ${out}`)
