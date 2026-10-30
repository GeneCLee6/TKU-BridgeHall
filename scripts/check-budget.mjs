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
//   - the convention page's chunk (src/pages/ConventionPage.tsx) and what it adds to the home page's.
// Sizes are gzip (level 9, like most CDNs), in kB = 1000 bytes.
//
// And that no convention text is in dist at all (L0, e10-t20): the built-in conventions are served
// by the Worker to members only, so every file the site publishes is searched for their summaries
// and for every text in their sections long enough to be their own (MIN_TEXT characters). Their
// text is in the private repository checked out into src/content-private/ (CONTENT_GUIDE.md §0):
// without the checkout that check is skipped, and says so. It never prints the text it finds (CI
// logs are public), only the file and the convention's slug.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'

const KB = 1000
const BUDGET = {
  homeJs: 150 * KB,
  conventionExtra: 30 * KB,
}
const CONVENTION_PAGE = 'src/pages/ConventionPage.tsx'
/** The catalogue: its own chunk, which every handbook page starts loading at once (HandbookShell) */
const CATALOGUE = 'src/components/Sidebar.tsx'
/** Shorter texts (a meaning such as 「迫叫一輪」) may be the interface's own words too */
const MIN_TEXT = 12

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

// --- Catalogue and convention page ------------------------------------------------------
const keyOf = (src) => Object.keys(manifest).find((k) => (manifest[k].src ?? k) === src)
const closureFiles = (key) => new Set([...staticClosure(key)].map((k) => manifest[k].file))
const catalogueKey = keyOf(CATALOGUE)
const catalogueJs = catalogueKey ? new Set([...closureFiles(catalogueKey)].filter((f) => !homeJs.has(f))) : new Set()
const pageKey = keyOf(CONVENTION_PAGE)
// Its chunk plus shared chunks the home page and the catalogue don't already have
const pageBytes = pageKey
  ? sum(new Set([...closureFiles(pageKey)].filter((f) => !homeJs.has(f) && !catalogueJs.has(f))))
  : null

// --- CSS --------------------------------------------------------------------------------
const allCss = existsSync(join(dist, 'assets'))
  ? readdirSync(join(dist, 'assets'))
      .filter((f) => f.endsWith('.css'))
      .map((f) => `assets/${f}`)
  : []

// --- No convention text in dist (L0) ----------------------------------------------------
const privateIndex = join(import.meta.dirname, '..', 'src', 'content-private', 'index.ts')
const hasContent = existsSync(privateIndex)
const { conventions } = hasContent ? await import(pathToFileURL(privateIndex).href) : { conventions: [] }
/** Each text, and the slug of a convention it is in */
const texts = new Map()
let slug = ''
// Section ids and other identifiers (`continuations`) are names the code may share, not text
const IDENTIFIER = /^[a-z0-9-]+$/
const collect = (value) => {
  if (typeof value === 'string') {
    if (value.trim().length >= MIN_TEXT && !IDENTIFIER.test(value) && !texts.has(value.trim())) texts.set(value.trim(), slug)
  } else if (Array.isArray(value)) value.forEach(collect)
  else if (value && typeof value === 'object') Object.values(value).forEach(collect)
}
for (const c of conventions) {
  slug = c.slug
  collect(c.sections)
  collect(c.summary)
}
const filesIn = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? filesIn(path) : [path]
  })
// A bundler may write a string with \uXXXX escapes, or JSON escapes: look for every form
const unescapeUnicode = (text) => text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
const leaks = []
for (const file of filesIn(dist).filter((f) => /\.(js|mjs|json|html|css|txt|webmanifest|map)$/.test(f))) {
  const body = readFileSync(file, 'utf8')
  const plain = unescapeUnicode(body)
  for (const [text, from] of texts) {
    if (body.includes(text) || plain.includes(text) || plain.includes(JSON.stringify(text).slice(1, -1))) {
      // Where, never what: the text itself would end up in a public log
      leaks.push(`${relative(dist, file)}: text of ${from}`)
      break
    }
  }
}

// --- Report -----------------------------------------------------------------------------
const rows = []
const check = (name, actual, budget, ok, note = '') => rows.push({ name, actual, budget, status: ok, note })

const homeBytes = sum(homeJs)
check('Home initial JS', kB(homeBytes), `≤ ${kB(BUDGET.homeJs)}`, homeBytes <= BUDGET.homeJs, `${homeJs.size} file(s)`)

if (hasContent)
  check(
    'No convention text in dist',
    leaks.length ? `${leaks.length} file(s)` : 'none',
    'none',
    leaks.length === 0,
    leaks.length ? leaks.slice(0, 5).join('; ') : `${texts.size} texts of ${conventions.length} conventions`,
  )
else check('No convention text in dist', 'skipped', 'none', null, 'no src/content-private checkout: the built-in conventions are in a private repository (CONTENT_GUIDE.md §0)')

check('Catalogue JS (loads after the page)', kB(sum(catalogueJs)), 'report', null, CATALOGUE)

if (pageBytes !== null) {
  check('Convention page extra JS', kB(pageBytes), `≤ ${kB(BUDGET.conventionExtra)}`, pageBytes <= BUDGET.conventionExtra, CONVENTION_PAGE)
} else {
  check('Convention page extra JS', 'n/a', `≤ ${kB(BUDGET.conventionExtra)}`, false, `${CONVENTION_PAGE} is not its own chunk`)
}

check('Home CSS', kB(sum(homeCss)), 'report', null, `${homeCss.size} file(s)`)
check('Total CSS', kB(sum(allCss)), 'report', null, `${allCss.length} file(s)`)

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
console.log('\nPerformance budget (e10-t03) and no convention text (e10-t20)')
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
