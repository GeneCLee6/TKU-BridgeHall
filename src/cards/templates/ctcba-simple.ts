import type { CardBlock, CardTemplate } from '../types.ts'

// 中華民國橋藝協會「2021 簡易制度卡（非橋士組用）」單面版. Labels are copied from
// docs/design/ctcba-simple-card-reference.png: bold italic on the card = `default`,
// asterisk = `alert`, underlined space = `blank`. The two-sided version reuses these blocks
// (ctcba-simple-2p.ts), so block ids are shared between the two templates.

export const ctcbaSimpleHeader: CardBlock[] = [
  { kind: 'banner', id: 'header.title', title: '中華民國橋藝協會 簡易制度卡', lines: 3 },
  { kind: 'text', id: 'header.user', label: '使用人', lines: 2 },
  {
    kind: 'choice',
    id: 'header.natural',
    label: '自然制',
    options: [
      { id: '5533', label: '5533' },
      { id: '5542', label: '5542' },
    ],
  },
  {
    kind: 'choice',
    id: 'header.2over1',
    label: '二蓋一',
    options: [
      { id: 'gf', label: '迫叫成局' },
      { id: 'inv', label: '邀請以上' },
    ],
  },
]

export const ctcbaSimpleOpening: CardBlock[] = [
  { kind: 'heading', id: 'opening.title', title: '開叫約定' },
  { kind: 'note', id: 'opening.note', text: '以下約定如未勾選或填寫者，均視為使用自然叫（粗體）' },
  {
    kind: 'group',
    id: 'nt',
    label: '無王',
    columns: 2,
    blocks: [
      { kind: 'check', id: 'nt.strong', label: '強無王(15-17)', default: true },
      { kind: 'check', id: 'nt.weak', label: '弱無王', alert: true, blank: { label: '點力' } },
      { kind: 'check', id: 'nt.stayman', label: 'Stayman', default: true },
      { kind: 'check', id: 'nt.puppet-stayman', label: 'Puppet Stayman', alert: true },
      { kind: 'check', id: 'nt.transfer-2', label: '2 線轉換', alert: true },
      { kind: 'check', id: 'nt.transfer-4', label: '4 線轉換', alert: true },
      { kind: 'check', id: 'nt.minor-ask', label: '低花詢問', alert: true },
      { kind: 'check', id: 'nt.minor-transfer', label: '低花轉換', alert: true, blank: { label: '叫品' } },
    ],
  },
  {
    kind: 'group',
    id: 'major',
    label: '高花',
    columns: 2,
    blocks: [
      { kind: 'check', id: 'major.five', label: '保證 5 張高花', default: true },
      { kind: 'check', id: 'major.four', label: '保證 4 張高花', alert: true },
      { kind: 'check', id: 'major.raise-inv', label: '加二支持：邀請', default: true },
      { kind: 'check', id: 'major.raise-pre', label: '加二支持：阻塞叫', alert: true },
      { kind: 'check', id: 'major.jacoby-2nt', label: 'Jacoby 2N', alert: true },
      { kind: 'check', id: 'major.forcing-1nt', label: '迫叫 1NT', alert: true },
    ],
  },
  {
    kind: 'group',
    id: 'minor',
    label: '低花',
    columns: 2,
    blocks: [
      { kind: 'check', id: 'minor.standard', label: '正序低花', default: true },
      { kind: 'check', id: 'minor.inverted', label: '反序低花', alert: true },
      { kind: 'check', id: 'minor.nmf', label: '新低花迫叫', alert: true },
      { kind: 'check', id: 'minor.2way-puppet', label: '2-way puppet', alert: true },
    ],
  },
  {
    kind: 'group',
    id: 'other',
    label: '其他約定',
    columns: 2,
    blocks: [
      { kind: 'check', id: 'other.weak-two', label: '弱二開叫', default: true },
      { kind: 'check', id: 'other.strong-two', label: '強二開叫', alert: true },
      { kind: 'check', id: 'other.gambling-3nt', label: '賭博性 3NT', alert: true },
      { kind: 'check', id: 'other.fourth-suit', label: '第四門新花迫叫成局', alert: true },
      // Left half: one fill-in spanning four rows; right half: the four checks beside it
      { kind: 'text', id: 'other.more', label: '其他特約', lines: 4 },
      { kind: 'check', id: 'other.splinter', label: 'Splinter', alert: true },
      { kind: 'check', id: 'other.blackwood', label: '黑木問 A', alert: true },
      { kind: 'check', id: 'other.rkcb', label: 'RKCB', alert: true, blank: { label: '回答' } },
      { kind: 'check', id: 'other.grand-slam-force', label: '大滿貫迫叫', alert: true },
    ],
  },
]

export const ctcbaSimpleCompetitive: CardBlock[] = [
  {
    kind: 'group',
    id: 'comp',
    label: '競叫約定',
    columns: 2,
    blocks: [
      { kind: 'check', id: 'comp.takeout-double', label: '迫伴賭倍', default: true },
      { kind: 'check', id: 'comp.negative-double', label: '負性賭倍', alert: true, blank: { label: '最高線位' } },
      { kind: 'check', id: 'comp.responsive-double', label: '回答性賭倍', alert: true },
      { kind: 'check', id: 'comp.support-double', label: '支持性賭倍', alert: true },
      { kind: 'check', id: 'comp.lightner-double', label: '萊納賭倍', alert: true },
      { kind: 'check', id: 'comp.unusual-2nt', label: '不尋常 2NT', alert: true },
      // Left half: one fill-in spanning three rows; right half: the three items beside it
      { kind: 'text', id: 'comp.more', label: '其他特約', lines: 3 },
      { kind: 'check', id: 'comp.michaels', label: 'Michaels', alert: true },
      { kind: 'check', id: 'comp.jump-cue-ask', label: '跳示叫詢問擋張', alert: true },
      {
        kind: 'choice',
        id: 'comp.jump-overcall',
        label: '跳蓋叫',
        options: [
          { id: 'weak', label: '弱跳', default: true },
          { id: 'intermediate', label: '中性', alert: true },
          { id: 'strong', label: '強牌', alert: true },
        ],
      },
    ],
  },
  {
    kind: 'group',
    id: 'vs-nt',
    label: '對抗無王開叫',
    columns: 1,
    blocks: [
      { kind: 'note', id: 'vs-nt.note', text: '（未填寫視同自然）' },
      { kind: 'check', id: 'vs-nt.weak-same', label: '同左' },
      {
        kind: 'table',
        id: 'vs-nt.table',
        rowHeader: { label: 'VS', width: 24 },
        columns: [
          { id: 'strong', label: '強無王', width: 38 },
          { id: 'weak', label: '弱無王', width: 38 },
        ],
        rows: [
          { id: 'double', label: '賭倍' },
          { id: '2C', label: '2♣' },
          { id: '2D', label: '2♦' },
          { id: '2H', label: '2♥' },
          { id: '2S', label: '2♠' },
        ],
      },
    ],
  },
]

export const ctcbaSimpleDefence: CardBlock[] = [
  { kind: 'heading', id: 'defence.title', title: '防禦約定' },
  {
    kind: 'group',
    id: 'leads',
    label: '首攻',
    columns: 1,
    blocks: [
      { kind: 'check', id: 'leads.4th', label: '01 & 4th', default: true },
      { kind: 'check', id: 'leads.3rd-5th', label: '01 & 3rd/5th' },
      { kind: 'check', id: 'leads.other', label: '其他', blank: { label: '其他' } },
    ],
  },
  { kind: 'text', id: 'defence.special', label: '特殊約定', alert: true, lines: 4 },
  {
    kind: 'group',
    id: 'signals',
    label: '防禦訊號',
    columns: 1,
    blocks: [
      {
        kind: 'table',
        id: 'signals.table',
        rowHeader: { label: '合約／訊號', width: 20 },
        columns: [
          { id: 'suit-standard', label: '正序', group: '王牌合約', width: 20, default: true },
          { id: 'suit-reverse', label: '反序', group: '王牌合約', width: 20, alert: true },
          { id: 'nt-standard', label: '正序', group: '無王合約', width: 20, default: true },
          { id: 'nt-reverse', label: '反序', group: '無王合約', width: 20, alert: true },
        ],
        rows: [
          { id: 'attitude', label: '態度' },
          { id: 'count', label: '張數' },
        ],
      },
      {
        kind: 'choice',
        id: 'signals.discard-suit',
        label: '墊牌',
        scope: '王牌合約',
        options: [
          { id: 'attitude', label: '表態', default: true },
          { id: 'suit-preference', label: '花選', alert: true },
          { id: 'odd-even', label: 'OE', alert: true },
        ],
      },
      {
        kind: 'choice',
        id: 'signals.discard-nt',
        label: '墊牌',
        scope: '無王合約',
        options: [
          { id: 'attitude', label: '表態', default: true },
          { id: 'suit-preference', label: '花選', alert: true },
          { id: 'odd-even', label: 'OE', alert: true },
        ],
      },
    ],
  },
]

export const ctcbaSimple: CardTemplate = {
  id: 'ctcba-simple',
  name: '簡易制度卡（非橋士組用）單面',
  year: 2021,
  publisher: '中華民國橋藝協會',
  paper: 'A4-landscape',
  pending:
    '「01 & 4th」的「01」照截圖辨識，待對照 PDF；「其他特約」與旁邊勾選格的列對應、欄寬為依截圖估計',
  pages: [
    {
      id: 'p1',
      columns: [
        { id: 'left', width: 49, blocks: [...ctcbaSimpleHeader, ...ctcbaSimpleOpening] },
        { id: 'right', width: 51, blocks: [...ctcbaSimpleCompetitive, ...ctcbaSimpleDefence] },
      ],
    },
  ],
}
