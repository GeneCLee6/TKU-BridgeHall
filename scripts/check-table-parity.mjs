// Type parity with TKU-BridgeTable (e10-t09, CLAUDE.md rule 10): checks that src/lib/api.ts still
// matches the Worker's shared/protocol.ts and worker/book.ts.
//
//   npm run parity                      # uses $TABLE_DIR, else .table/, else ../TKU-BridgeTable
//   TABLE_DIR=/path/to/table npm run parity
//
// 1. Type-checks parity/table-types.ts with `@table/*` pointing at the table checkout. Only errors
//    in that file count: the table's own files are checked by the table's CI, and are compiled here
//    without its dependencies (a type that fails to resolve becomes `any` and fails a check).
// 2. Runs tests/lib/tableParity.test.ts (the shared constants) with TABLE_DIR set.
//
// With no table checkout it prints why and exits 0, so it never fails a machine without one.

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const parityFile = join(root, 'parity', 'table-types.ts')
const inCi = Boolean(process.env.GITHUB_ACTIONS)

const candidates = process.env.TABLE_DIR ? [resolve(process.env.TABLE_DIR)] : [join(root, '.table'), resolve(root, '..', 'TKU-BridgeTable')]
const tableDir = candidates.find((dir) => existsSync(join(dir, 'shared', 'protocol.ts')) && existsSync(join(dir, 'worker', 'book.ts')))

if (!tableDir) {
  const message = `No TKU-BridgeTable checkout (looked in ${candidates.join(', ')}); type parity skipped`
  console.log(inCi ? `::notice title=Type parity skipped::${message}` : message)
  process.exit(0)
}
console.log(`Type parity against ${tableDir}`)

// ── 1. Types ─────────────────────────────────────────────────────────────────────────────────

const cacheDir = join(root, 'node_modules', '.cache', 'table-parity')
mkdirSync(cacheDir, { recursive: true })
const tsconfig = join(cacheDir, 'tsconfig.json')
writeFileSync(
  tsconfig,
  JSON.stringify(
    {
      compilerOptions: {
        target: 'es2023',
        lib: ['ES2023', 'DOM', 'DOM.Iterable'],
        module: 'esnext',
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        verbatimModuleSyntax: true,
        moduleDetection: 'force',
        noEmit: true,
        strict: true,
        skipLibCheck: true,
        types: [],
        paths: { '@table/*': [`${tableDir.replaceAll('\\', '/')}/*`] },
      },
      files: [parityFile.replaceAll('\\', '/')],
    },
    null,
    2,
  ),
)

const tsc = spawnSync(process.execPath, [join(root, 'node_modules', 'typescript', 'bin', 'tsc'), '-p', tsconfig, '--pretty', 'false'], {
  cwd: root,
  encoding: 'utf8',
})
if (tsc.error) throw tsc.error

// Diagnostics are `file(line,col): error TSxxxx: message`, continued on indented lines
const diagnostics = []
for (const line of `${tsc.stdout}${tsc.stderr}`.split(/\r?\n/)) {
  if (/^\S.*\(\d+,\d+\): error TS\d+:/.test(line)) diagnostics.push(line)
  else if (line.trim() && diagnostics.length) diagnostics[diagnostics.length - 1] += `\n${line}`
}
const isParity = (d) => resolve(root, d.slice(0, d.indexOf('('))) === parityFile
const failures = diagnostics.filter(isParity)
const elsewhere = diagnostics.length - failures.length

if (failures.length) {
  console.error(`\nsrc/lib/api.ts no longer matches TKU-BridgeTable (${failures.length} check(s) in parity/table-types.ts):\n`)
  const source = readFileSync(parityFile, 'utf8').split(/\r?\n/)
  for (const failure of failures) {
    const [, line] = /\((\d+),\d+\)/.exec(failure) ?? []
    // The failing check itself says what no longer matches
    const check = line ? source[Number(line) - 1].trim() : ''
    console.error(`parity/table-types.ts:${line}  ${check}`)
    if (inCi && line) console.log(`::error file=parity/table-types.ts,line=${line}::${check}`)
  }
  if (elsewhere) {
    console.error(`\n${elsewhere} error(s) in other files (they can make a type unresolved, i.e. any):`)
    for (const d of diagnostics.filter((d) => !isParity(d)).slice(0, 20)) console.error(d.split('\n')[0])
  }
  console.error('\nChange src/lib/api.ts and the Worker together (CLAUDE.md rule 10), or note an intended difference in parity/table-types.ts.')
  process.exit(1)
}
console.log(`Types: every check in parity/table-types.ts holds${elsewhere ? ` (${elsewhere} error(s) in the table's own files ignored)` : ''}`)

// ── 2. Constants ─────────────────────────────────────────────────────────────────────────────

const vitest = spawnSync(process.execPath, [join(root, 'node_modules', 'vitest', 'vitest.mjs'), 'run', 'tests/lib/tableParity.test.ts'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, TABLE_DIR: tableDir },
})
if (vitest.error) throw vitest.error
process.exit(vitest.status ?? 1)
