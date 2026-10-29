// Seeds the built-in conventions into TKU BridgeTable's Worker (L0, e10-t20; CONTENT_GUIDE.md §1).
// The site no longer ships them: the Worker serves them to members only, and this repository
// (private) is where their text lives. Run after adding or changing a convention in src/content:
//
//   npm run seed-builtin                 # dry run: what would change, nothing is written
//   npm run seed-builtin -- --apply      # back up what is there, write, then --verify
//   npm run seed-builtin -- --verify     # compare what the Worker serves with src/content, byte for byte
//
// Options: --base <url> (default: production's Worker; e.g. http://localhost:5173 for a local
// BridgeTable, or a PR preview's Worker), --allow-remove (a built-in convention left out of
// src/content/index.ts is removed; without it the Worker refuses). The seed token is
// BOOK_SEED_TOKEN, from the environment or from .env.seed (never committed). Online versions are
// never touched: a convention edited on the site keeps showing its online version.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { builtinPayload, compareBuiltin } from './builtin-payload.ts'

const PRODUCTION = 'https://tku-bridge-table.genelee-pro.workers.dev'
const args = process.argv.slice(2)
const flag = (name: string) => args.includes(`--${name}`)
const option = (name: string) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const base = (option('base') ?? PRODUCTION).replace(/\/$/, '')

function seedToken(): string {
  if (process.env.BOOK_SEED_TOKEN) return process.env.BOOK_SEED_TOKEN
  try {
    const line = readFileSync(new URL('../.env.seed', import.meta.url), 'utf8')
      .split(/\r?\n/)
      .find((l) => l.startsWith('BOOK_SEED_TOKEN='))
    if (line) return line.slice('BOOK_SEED_TOKEN='.length).trim()
  } catch {
    // No file: say so below
  }
  console.error('No seed token: set BOOK_SEED_TOKEN or put BOOK_SEED_TOKEN=... in .env.seed (TKU-BridgeTable DEPLOY.md §4.9).')
  process.exit(2)
}
const token = seedToken()

async function call(method: 'GET' | 'PUT', path: string, body?: unknown): Promise<string> {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body !== undefined && { 'Content-Type': 'application/json' }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  if (!response.ok && !(method === 'GET' && response.status === 404)) {
    console.error(`${method} ${path}: ${response.status} ${text.slice(0, 500)}`)
    process.exit(1)
  }
  return response.ok ? text : ''
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const outDir = new URL('../tmp/seed-builtin/', import.meta.url)
function save(name: string, text: string) {
  mkdirSync(outDir, { recursive: true })
  const file = new URL(`${stamp}-${name}`, outDir)
  writeFileSync(file, text)
  return file.pathname
}

interface Report {
  dryRun: boolean
  version: number
  conventions: { slug: string; change: string; online: boolean }[]
  order: string
  searchIndex: string
}

function print(report: Report) {
  console.log(`\n${report.dryRun ? 'Dry run' : 'Written'} at ${base} (built-in version ${report.version})`)
  for (const c of report.conventions) console.log(`  ${c.change.padEnd(8)} ${c.slug}${c.online ? '   (has an online version: readers see that one)' : ''}`)
  console.log(`  order: ${report.order}, search index: ${report.searchIndex}`)
}

const payload = builtinPayload()
const seed = (dryRun: boolean) => call('PUT', '/api/book/builtin', { ...payload, dryRun, allowRemove: flag('allow-remove') })

async function verify() {
  const served = await call('GET', '/api/book/builtin')
  const index = await call('GET', '/api/book/search-index')
  const problems = compareBuiltin(served || '[]', index)
  if (problems.length) {
    console.error(`\nVerify FAILED at ${base}:`)
    for (const p of problems) console.error(`  ${p}`)
    process.exit(1)
  }
  console.log(`\nVerified at ${base}: ${payload.conventions.length} built-in conventions and the search index are byte-identical to src/content.`)
}

if (flag('verify') && !flag('apply')) {
  await verify()
} else {
  const dry = await seed(true)
  console.log(`Dry-run report saved to ${save('dry-run.json', dry)}`)
  print(JSON.parse(dry) as Report)
  if (flag('apply')) {
    const before = await call('GET', '/api/book/builtin')
    console.log(`\nWhat was there before saved to ${save('before.json', before || '[]')}`)
    const done = await seed(false)
    save('applied.json', done)
    print(JSON.parse(done) as Report)
    await verify()
  } else {
    console.log('\nNothing was written. Run again with --apply to write.')
  }
}
