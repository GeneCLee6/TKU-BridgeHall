import type { CardFont } from '../cards/docx.ts'
import type { FilledCard } from '../cards/fill.ts'
import type { CardTemplate } from '../cards/types.ts'
import type { CardSnapshotMeta } from '../lib/api.ts'
import { cardStrings as t } from './cardStrings.ts'

/** The Word file of a filled card, made in the browser (e3-t08); the `docx` package loads on first use */
export async function makeDocx(
  template: CardTemplate,
  card: FilledCard,
  profileName: string,
  font: CardFont = 'arial',
) {
  const m = await import('../cards/docx.ts')
  const name = template.nameZh ?? template.name
  return m.cardDocx(template, card, {
    font,
    title: `${name} · ${profileName}`,
    notesTitle: t.notesTitle[template.language],
  })
}

/** Where a card version can be read; the share link */
export const snapshotPath = (s: Pick<CardSnapshotMeta, 'profileId' | 'templateId' | 'n'>) =>
  `/cards/${encodeURIComponent(s.profileId)}/${encodeURIComponent(s.templateId)}/v/${s.n}`
