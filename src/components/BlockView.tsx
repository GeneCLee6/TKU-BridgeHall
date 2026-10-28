import { memo } from 'react'
import styled from 'styled-components'
import type { Block, RuleItem } from '../types/convention.ts'
import { AuctionTable } from './AuctionTable.tsx'
import { Hand } from './Hand.tsx'
import { PendingNote } from './PendingNote.tsx'
import { ResponseTable } from './ResponseTable.tsx'
import { RichText } from './Suit.tsx'

/**
 * Renders one content block. A new block kind means a new case here and in the type.
 * Memoised: content is static, so expanding or collapsing accordions never re-renders blocks.
 */
export const BlockView = memo(function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'paragraph':
      return (
        <>
          <Paragraph>
            <RichText text={block.text} />
          </Paragraph>
          {block.pending && <PendingNote text={block.pending} />}
        </>
      )
    case 'rules':
      return <RuleList items={block.items} ordered={block.ordered} />
    case 'responses':
      return (
        <div>
          {block.caption && <Paragraph>{block.caption}</Paragraph>}
          {block.auction && <AuctionTable auction={block.auction} />}
          <ResponseTable rows={block.rows} />
        </div>
      )
    case 'note':
      return (
        <Callout role="note" $tone={block.tone}>
          <RichText text={block.text} />
        </Callout>
      )
    case 'hand':
      return <Hand hand={block.hand} label={block.label} />
  }
})

function RuleList({ items, ordered }: { items: RuleItem[]; ordered?: boolean }) {
  const List = ordered ? Ordered : Unordered
  return (
    <List>
      {items.map((item, i) => (
        <li key={i}>
          <RichText text={item.text} />
          {item.pending && <PendingNote text={item.pending} />}
          {item.children && <RuleList items={item.children} />}
        </li>
      ))}
    </List>
  )
}

const Paragraph = styled.p`
  margin: ${({ theme }) => theme.space(3)} 0;
  line-height: 1.75;
`

const listStyle = `
  margin: 12px 0;
  line-height: 1.75;
  padding-left: 1.75em;
  li { margin: 4px 0; }
  li > ul { margin: 4px 0; }
`

const Ordered = styled.ol`
  ${listStyle}
`

const Unordered = styled.ul`
  ${listStyle}
`

const Callout = styled.div<{ $tone: 'info' | 'warning' }>`
  margin: ${({ theme }) => theme.space(3)} 0;
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border-left: 2px solid
    ${({ theme, $tone }) => ($tone === 'warning' ? theme.colors.warningBorder : theme.colors.structure)};
  border-radius: ${({ theme }) => theme.shape.note};
  background: ${({ theme, $tone }) =>
    $tone === 'warning' ? theme.colors.warningBg : theme.colors.primarySoft};
  font-size: 0.9375rem;
`
