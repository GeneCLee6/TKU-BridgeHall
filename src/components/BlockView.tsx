import { lazy, memo, Suspense } from 'react'
import styled from 'styled-components'
import { pageStrings } from '../pageStrings.ts'
import { useArticleFile } from '../state/ArticleFilesContext.tsx'
import type { ArticleBlock, ImageBlock, QuoteBlock } from '../types/article.ts'
import type { IntroBlock, RuleItem } from '../types/convention.ts'
import { AuctionTable } from './AuctionTable.tsx'
import { Hand } from './Hand.tsx'
import { PendingNote } from './PendingNote.tsx'
import { ResponseTable } from './ResponseTable.tsx'
import { RichText } from './Suit.tsx'

// An article's deal and card play (e5-t02, e5-t03): only articles have them, so they load on use
const DealBlockView = lazy(() =>
  import('./board/ArticleBoards.tsx').then((m) => ({ default: m.DealBlockView })),
)
const PlayBlockView = lazy(() =>
  import('./board/ArticleBoards.tsx').then((m) => ({ default: m.PlayBlockView })),
)

/**
 * Renders one content block, a convention's or an article's (heading, quote, image, deal and play
 * are only in articles, types/article.ts). A new block kind means a new case here and in the type.
 * Memoised: content is static, so expanding or collapsing accordions never re-renders blocks.
 */
export const BlockView = memo(function BlockView({ block }: { block: ArticleBlock }) {
  switch (block.kind) {
    case 'paragraph':
      return (
        <>
          <Paragraph>
            <RichText text={block.text} glossary />
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
          <RichText text={block.text} glossary />
        </Callout>
      )
    case 'hand':
      return <Hand hand={block.hand} label={block.label} />
    case 'intro':
      return <Intro block={block} />
    case 'heading':
      return block.level === 2 ? (
        <Heading2 data-block="heading">
          <RichText text={block.text} />
        </Heading2>
      ) : (
        <Heading3 data-block="heading">
          <RichText text={block.text} />
        </Heading3>
      )
    case 'quote':
      return <Quote block={block} />
    case 'image':
      return <Picture block={block} />
    case 'deal':
      return (
        <Suspense fallback={null}>
          <DealBlockView block={block} />
        </Suspense>
      )
    case 'play':
      return (
        <Suspense fallback={null}>
          <PlayBlockView block={block} />
        </Suspense>
      )
  }
})

/** 引文 (e5-t01): the words, then where they are from */
function Quote({ block }: { block: QuoteBlock }) {
  return (
    <QuoteBox data-block="quote">
      <blockquote>
        <RichText text={block.text} />
      </blockquote>
      {block.cite?.trim() && <figcaption>— {block.cite}</figcaption>}
    </QuoteBox>
  )
}

/**
 * 圖片 (e5-t01, e5-t12): the uploaded picture by the address the Worker signed for it; without one
 * (no R2 bucket yet, or the article came without addresses), its description in a box instead
 */
function Picture({ block }: { block: ImageBlock }) {
  const file = useArticleFile(block.src)
  return (
    <Figure data-block="image">
      {file ? (
        <img src={file.url} alt={block.alt} loading="lazy" decoding="async" />
      ) : (
        <Missing role="img" aria-label={block.alt}>
          {pageStrings.article.pictureMissing(block.alt)}
        </Missing>
      )}
      {block.caption?.trim() && (
        <figcaption>
          <RichText text={block.caption} />
        </figcaption>
      )}
    </Figure>
  )
}

/** 導讀 (e4-t04): a labelled box with whichever of its three parts are filled in */
function Intro({ block }: { block: IntroBlock }) {
  const s = pageStrings.intro
  const pitfalls = block.pitfalls?.filter((p) => p.trim()) ?? []
  return (
    <IntroBox aria-label={s.name} data-block="intro">
      <IntroTitle>{s.name}</IntroTitle>
      <dl>
        {block.why?.trim() && (
          <>
            <dt>{s.why}</dt>
            <dd>
              <RichText text={block.why} glossary />
            </dd>
          </>
        )}
        {block.when?.trim() && (
          <>
            <dt>{s.when}</dt>
            <dd>
              <RichText text={block.when} glossary />
            </dd>
          </>
        )}
        {pitfalls.length > 0 && (
          <>
            <dt>{s.pitfalls}</dt>
            <dd>
              <Unordered>
                {pitfalls.map((p, i) => (
                  <li key={i}>
                    <RichText text={p} glossary />
                  </li>
                ))}
              </Unordered>
            </dd>
          </>
        )}
      </dl>
    </IntroBox>
  )
}

function RuleList({ items, ordered }: { items: RuleItem[]; ordered?: boolean }) {
  const List = ordered ? Ordered : Unordered
  return (
    <List>
      {items.map((item, i) => (
        <li key={i}>
          <RichText text={item.text} glossary />
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

const IntroBox = styled.section`
  margin: ${({ theme }) => theme.space(3)} 0;
  padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 3px solid ${({ theme }) => theme.colors.structure};
  border-radius: ${({ theme }) => theme.shape.note};
  background: ${({ theme }) => theme.colors.surfaceAlt};

  dl {
    margin: 0;
  }
  dt {
    margin-top: ${({ theme }) => theme.space(2)};
    font-weight: ${({ theme }) => theme.headingWeight};
    color: ${({ theme }) => theme.colors.primaryStrong};
  }
  dd {
    margin: ${({ theme }) => theme.space(1)} 0 0;
    line-height: 1.75;
  }
  dd ul {
    margin: 0;
  }
`

const headingStyle = `
  margin: 1.75em 0 0.5em;
  line-height: 1.4;
`

const Heading2 = styled.h2`
  ${headingStyle}
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.headingWeight};
  font-size: 1.375rem;
`

const Heading3 = styled.h3`
  ${headingStyle}
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.headingWeight};
  font-size: 1.125rem;
`

const QuoteBox = styled.figure`
  margin: ${({ theme }) => theme.space(4)} 0;
  padding: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(4)};
  border-left: 3px solid ${({ theme }) => theme.colors.border};

  blockquote {
    margin: 0;
    line-height: 1.8;
  }
  figcaption {
    margin-top: ${({ theme }) => theme.space(2)};
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

const Figure = styled.figure`
  margin: ${({ theme }) => theme.space(4)} 0;
  text-align: center;

  img {
    max-width: 100%;
    height: auto;
    border-radius: ${({ theme }) => theme.shape.note};
  }
  figcaption {
    margin-top: ${({ theme }) => theme.space(2)};
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

const Missing = styled.div`
  padding: ${({ theme }) => theme.space(6)} ${({ theme }) => theme.space(4)};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.note};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
`

const IntroTitle = styled.p`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 0.8125rem;
  letter-spacing: 0.08em;
  color: ${({ theme }) => theme.colors.structure};
`
