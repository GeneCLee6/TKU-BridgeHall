// Writes the handbook's call questions as a file of TKU-BridgeTable's bidding question bank
// (E6 e6-t08, src/lib/quizExport.ts), from the bundled content as the club's profile has it:
//
//   npm run quiz-bank -- ../TKU-BridgeTable/tests/bidding-quiz/book.json
//
// With no path it prints the file. Online edits and the editors' hand-made questions are not in
// the bundle; an editor downloads those from 修題 (/practice/fixes) instead.
import { writeFileSync } from 'node:fs'
import { privateConventionsOrExit } from './content-source.ts'
import { generateQuizzes } from '../src/lib/quiz.ts'
import { bankFile, exportQuizzes } from '../src/lib/quizExport.ts'

// The club's conventions, from the private checkout (scripts/content-source.ts)
const conventions = await privateConventionsOrExit()
const { quizzes } = generateQuizzes(conventions, 'club')
const names = new Map(conventions.map((c) => [c.slug, c.nameZh]))
const { questions, skipped } = exportQuizzes(quizzes, names)
const body = `${JSON.stringify(bankFile(questions), null, 2)}\n`
const target = process.argv[2]
if (target) writeFileSync(target, body)
else process.stdout.write(body)
const calls = skipped.filter((s) => s.reason !== 'meaning')
console.error(
  `quiz-bank: ${questions.length} questions; ${calls.length} call questions left out` +
    (calls.length ? ` (${calls.map((s) => `${s.id}: ${s.reason}`).join(', ')})` : ''),
)
