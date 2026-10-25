#!/usr/bin/env node
// Performance budget check (e10-t03, AC-10.1). Run after `npm run build`:
//
//   npm run budget              # exit 1 if any budget is exceeded
//   npm run budget -- --no-fail # report only
//
// Reads the Vite build manifest (dist/.vite/manifest.json, enabled by `build.manifest` in
// vite.config.ts) to find:
//   - the home page's initial JS: the entry chunk of index.html plus everything it statically
//     imports, transitively (plus any script / modulepreload tag in dist/index.html);
//   - convention chunks: manifest entries whose `src` is under src/content/conventions/.
// Sizes are gzip (level 9, like most CDNs), in kB = 1000 bytes.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { gzipSync } from 'node:zlib'

const KB = 1000
const BUDGET = {
  homeJs: 150 * KB,
  conventionExtra: 30 * KB,
  searchIndex: 300 * KB,
}
const CONVENTIONS_DIR = 'src/content/conventions'

const root = process.cwd()
const dist = join(root, 'dist')
const manifestPath = join(dist, '.vite', 'manifest.json')
const noFail = process.argv.includes('--no-fail')

if (!existsSync(manifestPath)) {
  console.error(
    `Missing ${relative(root, manifestPath)}. Run \`npm run build\` first ` +
      '(vite.config.ts must set build.manifest: true).',
  )
  process.exit(2)
}

/** @type {Record<string, {file: string, src?: string, isEntry?: boolean, isDynamicEntry?: boolean, imports?: string[], dynamicImports?: string[], css?: string[]}>} */
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

const gzipCache = new Map()
const gz = (file) => {
  if (!gzipCache.has(file)) gzipCache.set(file, gzipSync(readFileSync(join(dist, file)), { level: 9 }).length)
  return gzipCache.get(file)
}
const sum = (files) => [...files].reduce((n, f) => n + gz(f), 0)
const kB = (bytes) => `${(bytes / KB).toFixed(2)} kB`

/** Manifest keys reachable from `start` through static imports, including `start`. */
const staticClosure = (start) => {
  const seen = new Set()
  const stack = [start]
  while (stack.length) {
    const key = stack.pop()
    if (seen.has(key) || !manifest[key]) continue
    seen.add(key)
    stack.push(...(manifest[key].imports ?? []))
  }
  return seen
}

// --- Home page initial JS ---------------------------------------------------------------
const entryKey = Object.keys(manifest).find((k) => manifest[k].isEntry && k.endsWith('index.html'))
if (!entryKey) {
  console.error('No index.html entry in the Vite manifest.')
  process.exit(2)
}
const homeKeys = staticClosure(entryKey)
const homeJs = new Set([...homeKeys].map((k) => manifest[k].file))
// Anything index.html loads eagerly that the manifest graph missed (e.g. a modulepreload).
const html = readFileSync(join(dist, 'index.html'), 'utf8')
for (const [, href] of html.matchAll(/<(?:script|link)[^>]+(?:src|href)="\/?(assets\/[^"]+\.js)"/g)) homeJs.add(href)
const homeCss = new Set([...homeKeys].flatMap((k) => manifest[k].css ?? []))

// --- Convention chunks ------------------------------------------------------------------
const conventionSources = existsSync(join(root, CONVENTIONS_DIR))
  ? readdirSync(join(root, CONVENTIONS_DIR))
      .filter((f) => /\.tsx?$/.test(f))
      .map((f) => `${CONVENTIONS_DIR}/${f}`)
      .sort()
  : []
const conventionKeys = Object.keys(manifest).filter((k) => (manifest[k].src ?? k).startsWith(`${CONVENTIONS_DIR}/`))
const conventionFiles = new Set(conventionKeys.map((k) => manifest[k].file))
const notSplit = conventionSources.filter((src) => !conventionKeys.includes(src))
const homeConventionKeys = [...homeKeys].filter((k) => conventionKeys.includes(k))
const homeConventionFiles = [...homeJs].filter((f) => conventionFiles.has(f))

const perConvention = conventionKeys
  .map((key) => {
    // Extra bytes for a convention page: its chunk plus shared chunks the home page doesn't already have.
    const files = new Set([...staticClosure(key)].map((k) => manifest[k].file).filter((f) => !homeJs.has(f)))
    return { key, slug: key.slice(CONVENTIONS_DIR.length + 1).replace(/\.tsx?$/, ''), bytes: sum(files) }
  })
  .sort((a, b) => b.bytes - a.bytes)

// --- CSS and search index ---------------------------------------------------------------
const allCss = existsSync(join(dist, 'assets'))
  ? readdirSync(join(dist, 'assets'))
      .filter((f) => f.endsWith('.css'))
      .map((f) => `assets/${f}`)
  : []
const searchIndex = ['search-index.json'].find((f) => existsSync(join(dist, f)))

// --- Report -----------------------------------------------------------------------------
const rows = []
const check = (name, actual, budget, ok, note = '') => rows.push({ name, actual, budget, status: ok, note })

const homeBytes = sum(homeJs)
check('Home initial JS', kB(homeBytes), `≤ ${kB(BUDGET.homeJs)}`, homeBytes <= BUDGET.homeJs, `${homeJs.size} file(s)`)

const homeHasConventions = homeConventionKeys.length > 0 || homeConventionFiles.length > 0
check(
  'Home loads no convention',
  homeHasConventions ? `${homeConventionKeys.length} in graph` : notSplit.length ? 'bundled' : 'none',
  'none',
  !homeHasConventions && notSplit.length === 0,
  notSplit.length
    ? `${notSplit.length}/${conventionSources.length} convention(s) not split into own chunk (bundled)`
    : `${conventionKeys.length} convention chunk(s)`,
)

if (perConvention.length) {
  const worst = perConvention[0]
  const over = perConvention.filter((c) => c.bytes > BUDGET.conventionExtra)
  check(
    'Convention page extra JS (max)',
    kB(worst.bytes),
    `≤ ${kB(BUDGET.conventionExtra)}`,
    over.length === 0,
    over.length ? `over: ${over.map((c) => `${c.slug} ${kB(c.bytes)}`).join(', ')}` : worst.slug,
  )
} else {
  check('Convention page extra JS (max)', 'n/a', `≤ ${kB(BUDGET.conventionExtra)}`, null, 'no convention chunks')
}

if (searchIndex) {
  const bytes = gz(searchIndex)
  check('Search index', kB(bytes), `≤ ${kB(BUDGET.searchIndex)}`, bytes <= BUDGET.searchIndex, searchIndex)
} else {
  check('Search index', 'n/a', `≤ ${kB(BUDGET.searchIndex)}`, null, 'dist/search-index.json not present (skipped)')
}

check('Home CSS', kB(sum(homeCss)), 'report', null, `${homeCss.size} file(s)`)
check('Total CSS', kB(sum(allCss)), 'report', null, `${allCss.length} file(s)`)

if (perConvention.length) {
  console.log('\nConvention chunks (gzip, extra over home):')
  for (const c of perConvention) console.log(`  ${c.slug.padEnd(28)} ${kB(c.bytes).padStart(10)}`)
}

const label = (s) => (s === true ? 'PASS' : s === false ? 'FAIL' : '-')
const cols = [
  ['Check', (r) => r.name],
  ['Actual (gzip)', (r) => r.actual],
  ['Budget', (r) => r.budget],
  ['Status', (r) => label(r.status)],
  ['Note', (r) => r.note],
]
const widths = cols.map(([h, f]) => Math.max(h.length, ...rows.map((r) => f(r).length)))
const line = (cells) => `| ${cells.map((c, i) => c.padEnd(widths[i])).join(' | ')} |`
console.log('\nPerformance budget (e10-t03)')
console.log(line(cols.map(([h]) => h)))
console.log(`|${widths.map((w) => '-'.repeat(w + 2)).join('|')}|`)
for (const r of rows) console.log(line(cols.map(([, f]) => f(r))))

const failed = rows.filter((r) => r.status === false)
if (failed.length) {
  console.log(`\n${failed.length} budget check(s) failed${noFail ? ' (--no-fail: not failing the run)' : ''}.`)
  if (!noFail) process.exit(1)
} else {
  console.log('\nAll budget checks passed.')
}
