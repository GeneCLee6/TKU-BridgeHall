import {
  conventionKinds,
  levels,
  type Block,
  type Convention,
  type ConventionKind,
  type ConventionMeta,
  type Level,
  type RuleItem,
  type Section,
} from '../types/convention.ts'
import type { BookEntry, BookEntrySummary } from './api.ts'
import { splitCall } from './calls.ts'
import { walkSections } from './sections.ts'

/**
 * The handbook's content at run time: the conventions bundled with the site, with what members
 * changed online laid over them. An online entry replaces the bundled convention with the same
 * slug, adds a new one, or hides one. The catalogue is merged from manifest entries (no content);
 * each convention's content is checked when it is loaded. Anything that does not have the right
 * shape is left out (and reported), so a bad save can never break the page.
 */

/** What the handbook knows about a convention that was changed online */
export interface OnlineInfo {
  version: number
  updatedAt: number
  updatedBy: string
  /** True when the convention exists only online */
  added: boolean
  hidden: boolean
  /** The bundled convention's `updated` date when the first online edit was made */
  bundledUpdated?: string
}

export interface Skipped {
  slug: string
  problem: string
}

export interface MergedManifest {
  conventions: ConventionMeta[]
  online: Map<string, OnlineInfo>
  /** Online entries left out because they are broken, with the first problem */
  skipped: Skipped[]
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/
export const SECTION_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
const isString = (value: unknown): value is string => typeof value === 'string'
const optionalString = (value: unknown) => value === undefined || isString(value)
const isStrings = (value: unknown) => Array.isArray(value) && value.every(isString)
const isLevel = (value: unknown): value is Level => levels.includes(value as Level)
const optionalLevel = (value: unknown) => value === undefined || isLevel(value)

/** A card's kind, level, prerequisites and card slots, the fields set only in the editor or files */
export function classification(c: Partial<Pick<Convention, 'kind' | 'level' | 'prerequisites' | 'cardSlots'>> = {}) {
  return {
    ...(c.kind && { kind: c.kind }),
    ...(c.level && { level: c.level }),
    ...(c.prerequisites?.length && { prerequisites: [...c.prerequisites] }),
    ...(c.cardSlots?.length && { cardSlots: [...c.cardSlots] }),
  }
}

/** What a card is; a card that does not say is a convention */
export const conventionKind = (c: Pick<Convention, 'kind'>): ConventionKind => c.kind ?? 'convention'

/**
 * Why a value cannot be shown as a convention, worded for editors; empty when it can.
 * `categories` are the ids the sidebar knows.
 */
export function conventionProblems(value: unknown, categories: string[]): string[] {
  const problems: string[] = []
  const add = (problem: string) => {
    problems.push(problem)
  }
  if (!isObject(value)) return ['不是一個特約']
  if (!isString(value.slug) || !SLUG_PATTERN.test(value.slug))
    add('網址代稱只能用小寫英文、數字與連字號，例如 jacoby-transfer')
  if (!isString(value.nameZh) || !value.nameZh.trim()) add('缺少中文名稱')
  if (!isString(value.nameEn)) add('缺少英文名稱')
  if (!isString(value.category) || !categories.includes(value.category)) add('分類不存在')
  if (value.kind !== undefined && !conventionKinds.includes(value.kind as ConventionKind)) add('種類不存在')
  if (!optionalLevel(value.level)) add('程度不存在')
  if (value.prerequisites !== undefined && !isStrings(value.prerequisites)) add('前置特約要是網址代稱清單')
  else if ((value.prerequisites as string[] | undefined)?.includes(value.slug as string)) add('前置特約不能是自己')
  if (value.cardSlots !== undefined && !isStrings(value.cardSlots)) add('制度卡位置要是文字清單')
  if (!isStrings(value.tags)) add('標籤要是文字清單')
  if (value.aliases !== undefined && !isStrings(value.aliases)) add('別名要是文字清單')
  if (!isString(value.summary)) add('缺少摘要')
  if (!isString(value.updated)) add('缺少最後校對日期')
  if (!isObject(value.source) || !isString(value.source.title) || !optionalString(value.source.note))
    add('缺少來源文件')
  if (!Array.isArray(value.sections)) return [...problems, '缺少段落']

  const ids = new Set<string>()
  const rules = (items: unknown, where: string): void => {
    if (!Array.isArray(items)) return add(`${where}：條列要是清單`)
    for (const item of items) {
      if (!isObject(item) || !isString(item.text) || !optionalString(item.pending)) add(`${where}：條列項目缺少文字`)
      else if (item.children !== undefined) rules(item.children, where)
    }
  }
  const block = (b: unknown, where: string) => {
    if (!isObject(b)) return add(`${where}：內容區塊格式不正確`)
    switch (b.kind) {
      case 'paragraph':
        if (!isString(b.text) || !optionalString(b.pending)) add(`${where}：段落缺少文字`)
        return
      case 'note':
        if (!isString(b.text) || (b.tone !== 'info' && b.tone !== 'warning')) add(`${where}：注意事項格式不正確`)
        return
      case 'rules':
        return rules(b.items, where)
      case 'hand': {
        const hand = b.hand
        if (!isObject(hand) || !['spades', 'hearts', 'diamonds', 'clubs'].every((s) => isString(hand[s])))
          add(`${where}：牌例要有四門花色`)
        return
      }
      case 'responses': {
        if (!Array.isArray(b.rows)) return add(`${where}：叫品表缺少列`)
        for (const row of b.rows)
          if (!isObject(row) || !isString(row.call) || !isString(row.meaning) || !optionalString(row.note) || !optionalString(row.pending))
            add(`${where}：叫品表的每一列要有叫品與意義`)
          // The table's Worker checks hand conditions in full (lib/systemSpec.ts conditionsProblem)
          else if (row.conditions !== undefined && !isObject(row.conditions)) add(`${where}：叫品表的手牌條件格式不正確`)
        const auction = b.auction
        if (auction === undefined) return
        if (!isObject(auction) || !isStrings(auction.seats) || (auction.seats as string[]).length !== 4 || !Array.isArray(auction.calls))
          return add(`${where}：叫牌過程要有四個座位`)
        for (const call of auction.calls as unknown[])
          if (!isString(call) && !(isObject(call) && isString(call.call) && optionalString(call.note)))
            add(`${where}：叫牌過程的叫品格式不正確`)
        return
      }
      default:
        add(`${where}：不明的內容區塊`)
    }
  }
  const section = (s: unknown, depth: number) => {
    if (!isObject(s) || !isString(s.id) || !isString(s.title)) return add('每個段落都要有 id 與標題')
    const where = s.title || s.id
    if (!SECTION_ID_PATTERN.test(s.id)) add(`${where}：段落 id 只能用小寫英文、數字與連字號`)
    if (ids.has(s.id)) add(`段落 id 重複：${s.id}`)
    ids.add(s.id)
    if (depth > 8) add(`${where}：段落層數太多`)
    if (!optionalString(s.originalTitle) || !optionalString(s.summary) || !optionalString(s.pending))
      add(`${where}：原文標題、摘要與待確認要是文字`)
    if (!optionalLevel(s.level)) add(`${where}：程度不存在`)
    if (s.blocks !== undefined) {
      if (!Array.isArray(s.blocks)) add(`${where}：內容要是清單`)
      else for (const b of s.blocks) block(b, where)
    }
    if (s.children !== undefined) {
      if (!Array.isArray(s.children)) add(`${where}：子段落要是清單`)
      else for (const child of s.children) section(child, depth + 1)
    }
  }
  for (const s of value.sections) section(s, 1)
  return problems
}

/** Calls the renderer draws: bids, Pass, X, XX, ? and the source's ---; '' is an empty cell */
export function isKnownCall(call: string) {
  return splitCall(call).every((p) => Boolean(p.suit) || /^(\dNT|NT|Pass|X|XX|\?|—)$/.test(p.text))
}

/** A bid like "3H", or a lone suit letter before Chinese text: a suit letter not turned into ♥ */
export const MISSED_SUIT = /\d[CDHS](?![a-z])|(?<![A-Za-z])[CDHS](?=[一-鿿])/

/**
 * What an editor should look at before saving: the same checks the content tests run on the
 * bundled conventions. Unlike conventionProblems these do not stop a save.
 */
export function conventionWarnings(convention: Convention): string[] {
  const warnings: string[] = []
  if (!convention.summary.trim()) warnings.push('還沒有摘要（顯示在收合的卡片上）')
  if (!convention.tags.length) warnings.push('還沒有標籤（方便搜尋）')
  if (!convention.source.title.trim()) warnings.push('還沒有來源文件')
  if (!convention.sections.length) warnings.push('還沒有段落')
  walkSections(convention.sections, (s, ancestors) => {
    const where = [...ancestors, s].map((x) => x.title || '（無標題）').join(' › ')
    if (!s.title.trim()) warnings.push(`${where}：段落沒有標題`)
    if (!s.blocks?.length && !s.children?.length) warnings.push(`${where}：段落是空的`)
    for (const b of s.blocks ?? []) {
      if (b.kind !== 'responses') continue
      for (const row of b.rows) {
        if (!isKnownCall(row.call)) warnings.push(`${where}：看不懂的叫品「${row.call}」`)
        if (!row.meaning.trim()) warnings.push(`${where}：${row.call} 沒有意義`)
        if (MISSED_SUIT.test(row.meaning)) warnings.push(`${where}：${row.call} 的意義裡有花色字母沒換成符號`)
      }
      for (const entry of b.auction?.calls ?? []) {
        const call = typeof entry === 'string' ? entry : entry.call
        if (call && !isKnownCall(call)) warnings.push(`${where}：叫牌過程裡看不懂的叫品「${call}」`)
      }
    }
  })
  return warnings
}

/** Why a manifest entry cannot be shown in the catalogue; empty when it can */
function metaProblems(value: unknown, categories: string[]): string[] {
  if (!isObject(value)) return ['不是一個特約']
  const problems: string[] = []
  if (!isString(value.slug) || !SLUG_PATTERN.test(value.slug)) problems.push('網址代稱不正確')
  if (!isString(value.nameZh) || !isString(value.nameEn)) problems.push('缺少名稱')
  if (!isString(value.category) || !categories.includes(value.category)) problems.push('分類不存在')
  if (!isStrings(value.tags) || !isString(value.summary)) problems.push('缺少標籤或摘要')
  if (!Array.isArray(value.outline) || !Array.isArray(value.pending)) problems.push('缺少段落')
  if ((value.kind !== undefined && !conventionKinds.includes(value.kind as ConventionKind)) || !optionalLevel(value.level))
    problems.push('種類或程度不存在')
  if (value.prerequisites !== undefined && !isStrings(value.prerequisites)) problems.push('前置特約格式不正確')
  return problems
}

/** Lays the online entries over the bundled manifest */
export function mergeManifest(
  bundled: ConventionMeta[],
  entries: BookEntrySummary[],
  categories: string[],
): MergedManifest {
  const online = new Map<string, OnlineInfo>()
  const skipped: Skipped[] = []
  const replaced = new Map<string, ConventionMeta | null>()
  const bundledSlugs = new Set(bundled.map((c) => c.slug))
  const added: { createdAt: number; meta: ConventionMeta }[] = []

  for (const entry of entries) {
    if (entry.meta !== null) {
      const problems = metaProblems(entry.meta, categories)
      if (problems.length || entry.meta.slug !== entry.slug) {
        skipped.push({ slug: entry.slug, problem: problems[0] ?? '網址代稱不符' })
        continue
      }
      if (bundledSlugs.has(entry.slug)) replaced.set(entry.slug, entry.meta)
      else added.push({ createdAt: entry.createdAt, meta: entry.meta })
    } else if (bundledSlugs.has(entry.slug)) replaced.set(entry.slug, null)
    online.set(entry.slug, {
      version: entry.version,
      updatedAt: entry.updatedAt,
      updatedBy: entry.updatedBy,
      added: !bundledSlugs.has(entry.slug),
      hidden: entry.meta === null,
      bundledUpdated: entry.bundledUpdated,
    })
  }

  const conventions = bundled.flatMap((c) => {
    const replacement = replaced.get(c.slug)
    if (replacement === undefined) return [c]
    return replacement ? [replacement] : []
  })
  added.sort((a, b) => a.createdAt - b.createdAt)
  return { conventions: [...conventions, ...added.map((a) => a.meta)], online, skipped }
}

/** An online entry's content, checked: the convention, or why it cannot be shown */
export function onlineConvention(
  entry: BookEntry,
  categories: string[],
): { convention: Convention } | { problem: string } {
  const problems = conventionProblems(entry.convention, categories)
  if (problems.length) return { problem: problems[0] }
  const convention = entry.convention as Convention
  return convention.slug === entry.slug ? { convention } : { problem: '網址代稱不符' }
}

/** A block with nothing in it, as the editor leaves behind: dropped on save */
function emptyBlock(b: Block) {
  switch (b.kind) {
    case 'paragraph':
    case 'note':
      return !b.text.trim()
    case 'rules':
      return !b.items.some((i) => i.text.trim() || i.children?.length)
    case 'hand':
      return !Object.values(b.hand).some((cards) => cards.trim())
    case 'responses':
      return !b.rows.some((r) => r.call.trim() || r.meaning.trim()) && !b.auction?.calls.some((c) => c !== '' && c !== '?')
  }
}

/**
 * A deep copy that drops empty optional fields, empty blocks and empty response rows, so saved
 * content stays as tidy as the files
 */
export function tidyConvention(convention: Convention): Convention {
  const text = (value: string | undefined) => (value && value.trim() ? value : undefined)
  const rule = (item: RuleItem): RuleItem => {
    const children = item.children?.map(rule)
    return {
      text: item.text,
      ...(text(item.pending) && { pending: item.pending }),
      ...(children?.length && { children }),
    }
  }
  const block = (b: Block): Block => {
    switch (b.kind) {
      case 'paragraph':
        return { kind: 'paragraph', text: b.text, ...(text(b.pending) && { pending: b.pending }) }
      case 'rules':
        return { kind: 'rules', items: b.items.map(rule), ...(b.ordered && { ordered: true }) }
      case 'note':
        return { kind: 'note', tone: b.tone, text: b.text }
      case 'hand':
        return { kind: 'hand', ...(text(b.label) && { label: b.label }), hand: { ...b.hand } }
      case 'responses':
        return {
          kind: 'responses',
          ...(b.auction && { auction: { seats: [...b.auction.seats], calls: [...b.auction.calls] } }),
          ...(text(b.caption) && { caption: b.caption }),
          rows: b.rows.filter((r) => r.call.trim() || r.meaning.trim()).map((r) => ({
            call: r.call.trim(),
            meaning: r.meaning,
            ...(text(r.note) && { note: r.note }),
            ...(text(r.pending) && { pending: r.pending }),
            ...(r.conditions && { conditions: structuredClone(r.conditions) }),
          })),
        }
    }
  }
  const section = (s: Section): Section => {
    const children = s.children?.map(section)
    return {
      id: s.id,
      title: s.title,
      ...(text(s.originalTitle) && { originalTitle: s.originalTitle }),
      ...(text(s.summary) && { summary: s.summary }),
      ...(text(s.pending) && { pending: s.pending }),
      ...(s.level && { level: s.level }),
      ...(s.blocks?.some((b) => !emptyBlock(b)) && { blocks: s.blocks.filter((b) => !emptyBlock(b)).map(block) }),
      ...(children?.length && { children }),
    }
  }
  const aliases = convention.aliases?.filter((a) => a.trim())
  const prerequisites = convention.prerequisites?.filter((p) => p.trim())
  const cardSlots = convention.cardSlots?.filter((p) => p.trim())
  return {
    slug: convention.slug,
    nameZh: convention.nameZh,
    nameEn: convention.nameEn,
    ...(aliases?.length && { aliases }),
    category: convention.category,
    ...(convention.kind && { kind: convention.kind }),
    ...(convention.level && { level: convention.level }),
    ...(prerequisites?.length && { prerequisites }),
    ...(cardSlots?.length && { cardSlots }),
    tags: convention.tags.filter((t) => t.trim()),
    summary: convention.summary,
    source: { title: convention.source.title, ...(text(convention.source.note) && { note: convention.source.note }) },
    updated: convention.updated,
    sections: convention.sections.map(section),
  }
}
