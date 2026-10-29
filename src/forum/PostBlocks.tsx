import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { AuctionTable } from '../components/AuctionTable.tsx'
import { DealDiagram } from '../components/board/DealDiagram.tsx'
import { HandSuits } from '../components/board/parts.tsx'
import { accountApi } from '../lib/account.ts'
import type { ClubMember } from '../lib/api.ts'
import { toBookAuction } from '../lib/board.ts'
import type { ForumRuleItem, PostBlock } from '../lib/forum.ts'
import { mentionParts } from '../lib/forumPosts.ts'
import { blockText, conventionPath, findSectionPath, sectionPath } from '../lib/sections.ts'
import { useContent, useConvention } from '../state/ContentContext.tsx'
import { strings } from '../strings.ts'
import type { Section } from '../types/convention.ts'
import { forumStrings as t } from './forumStrings.ts'

/** Signed addresses of uploaded pictures, by key; they are short-lived, so fetched with each read */
export type PostFiles = Record<string, { url: string; thumbUrl?: string }>

/** The pictures' addresses for these blocks (none when uploads are off or the call fails) */
// oxlint-disable-next-line react/only-export-components -- the compose box uses it too
export function usePostFiles(blocks: readonly PostBlock[]): PostFiles {
  const keys = blocks.flatMap((b) => (b.kind === 'image' ? [b.assetId] : []))
  const keyList = keys.join(' ')
  const [files, setFiles] = useState<{ keys: string; urls: PostFiles }>({ keys: '', urls: {} })
  useEffect(() => {
    if (!keyList) return
    let current = true
    accountApi.files.urls(keyList.split(' ')).then(
      (urls) => current && setFiles({ keys: keyList, urls }),
      () => current && setFiles({ keys: keyList, urls: {} }),
    )
    return () => {
      current = false
    }
  }, [keyList])
  return files.keys === keyList ? files.urls : {}
}

/** Text with `@` mentions linked to the member's page, line breaks kept */
export function MentionText({ text, members }: { text: string; members: readonly ClubMember[] }) {
  return (
    <>
      {mentionParts(text, members).map((part, i) =>
        'member' in part ? (
          <Mention key={i} to={`/u/${encodeURIComponent(part.member.id)}`}>
            {part.text}
          </Mention>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  )
}

function Rules({ items, ordered, members }: { items: ForumRuleItem[]; ordered?: boolean; members: readonly ClubMember[] }) {
  const List = ordered ? 'ol' : 'ul'
  return (
    <List>
      {items.map((item, i) => (
        <li key={i}>
          <MentionText text={item.text} members={members} />
          {item.children && <Rules items={item.children} members={members} />}
        </li>
      ))}
    </List>
  )
}

/**
 * A quoted convention or section (`ref`): its title path and the first lines of its text, linking
 * to it in the handbook. The club's version is quoted, not the reader's profile.
 */
export function RefBlock({ slug, sectionId }: { slug: string; sectionId?: string }) {
  const { bySlug } = useContent()
  const meta = bySlug(slug)
  const { convention, missing } = useConvention(meta ? slug : undefined)
  if (!meta || missing)
    return (
      <Quote as="p">
        {t.ref}：{t.refMissing(slug)}
      </Quote>
    )
  const path = sectionId ? findSectionPath(convention ?? meta, sectionId) : []
  const titles = [meta.nameZh, ...path.map((s) => s.title)]
  // Loaded, the path holds the sections themselves (with their blocks)
  const section = convention ? (path.at(-1) as Section | undefined) : undefined
  const first = section ? (section.summary ?? section.blocks?.map(blockText).find((text) => text.trim())) : !sectionId ? meta.summary : undefined
  const href = sectionId && path.length ? sectionPath(slug, sectionId) : conventionPath(slug)
  return (
    <Quote>
      <Link to={href}>
        {t.ref}：{titles.join(' › ')}
      </Link>
      {first ? <Excerpt>{first}</Excerpt> : !convention && <Excerpt>{t.refLoading}</Excerpt>}
    </Quote>
  )
}

/** One block of a post or a comment */
export function PostBlockView({ block, members, files }: { block: PostBlock; members: readonly ClubMember[]; files: PostFiles }) {
  switch (block.kind) {
    case 'paragraph':
      return (
        <Paragraph>
          <MentionText text={block.text} members={members} />
        </Paragraph>
      )
    case 'rules':
      return (
        <RulesWrap>
          <Rules items={block.items} ordered={block.ordered} members={members} />
        </RulesWrap>
      )
    case 'note':
      return (
        <Note $warning={block.tone === 'warning'}>
          <MentionText text={block.text} members={members} />
        </Note>
      )
    case 'hand':
      return (
        <HandFigure role="group" aria-label={block.label ?? strings.board.hand}>
          {block.label && <Caption as="span">{block.label}</Caption>}
          <HandSuits cards={block.cards} inline />
        </HandFigure>
      )
    case 'deal':
      return (
        <figure>
          <DealDiagram deal={block.deal} label={block.caption} />
          {block.caption && <Caption>{block.caption}</Caption>}
        </figure>
      )
    case 'auction':
      return (
        <figure>
          <AuctionTable auction={toBookAuction(block.auction, strings.board.seatNames)} />
          {block.caption && <Caption>{block.caption}</Caption>}
        </figure>
      )
    case 'image': {
      const file = files[block.assetId]
      return (
        <figure>
          {file ? <Picture src={file.url} alt={block.alt} loading="lazy" /> : <Missing>{block.alt || t.imageMissing}</Missing>}
          {block.caption && <Caption>{block.caption}</Caption>}
        </figure>
      )
    }
    case 'ref':
      return <RefBlock slug={block.slug} sectionId={block.sectionId} />
    case 'record':
      return <Paragraph>{t.record(block.tableRecordId)}</Paragraph>
  }
}

/** A post's or a comment's blocks, in order */
export function PostBody({ blocks, members, files }: { blocks: readonly PostBlock[]; members: readonly ClubMember[]; files: PostFiles }) {
  return (
    <Body>
      {blocks.map((block, i) => (
        <PostBlockView key={i} block={block} members={members} files={files} />
      ))}
    </Body>
  )
}

const Body = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  min-width: 0;

  figure {
    margin: 0;
    min-width: 0;
    overflow-x: auto;
  }
`

const Paragraph = styled.p`
  margin: 0;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`

const RulesWrap = styled.div`
  line-height: 1.7;

  ul,
  ol {
    margin: 0;
    padding-left: 1.5em;
  }
`

const Note = styled.p<{ $warning: boolean }>`
  margin: 0;
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border-left: 4px solid ${({ theme, $warning }) => ($warning ? theme.colors.warningBorder : theme.colors.primary)};
  border-radius: ${({ theme }) => theme.shape.note};
  background: ${({ theme, $warning }) => ($warning ? theme.colors.warningBg : theme.colors.primarySoft)};
  line-height: 1.6;
  white-space: pre-wrap;
`

const Mention = styled(Link)`
  font-weight: 600;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`

const HandFigure = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(1)};
  justify-self: start;
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.note};
  background: ${({ theme }) => theme.colors.surfaceAlt};
`

const Caption = styled.figcaption`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
`

const Picture = styled.img`
  display: block;
  max-width: 100%;
  max-height: 32rem;
  border-radius: ${({ theme }) => theme.shape.note};
`

const Missing = styled.p`
  margin: 0;
  padding: ${({ theme }) => theme.space(4)};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.note};
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
`

const Quote = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(1)};
  margin: 0;
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border-left: 3px solid ${({ theme }) => theme.colors.structure};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  border-radius: ${({ theme }) => theme.shape.note};
`

const Excerpt = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.9375rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`
