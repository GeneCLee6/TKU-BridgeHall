import { ArrowDown, ArrowUp, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import styled from 'styled-components'
import { Avatar } from '../components/Avatar.tsx'
import { AuctionInput } from '../components/board/AuctionInput.tsx'
import { DealInput } from '../components/board/DealInput.tsx'
import { HandInput } from '../components/board/HandInput.tsx'
import { Button, ErrorText, Field, Input, Muted, Row, Select } from '../components/ui.tsx'
import { errorText, type ClubMember } from '../lib/api.ts'
import type { Seat } from '../lib/board.ts'
import { splitTags, type Board, type Post, type PostBlock } from '../lib/forum.ts'
import { forumApi } from '../lib/forumApi.ts'
import {
  clearDraft,
  loadDraft,
  newBlock,
  postProblems,
  recordIdFrom,
  saveDraft,
  textLength,
  tidyBlocks,
} from '../lib/forumPosts.ts'
import { FILE_TYPES } from '../lib/account.ts'
import { filesOff, isUploadType, uploadImage } from '../lib/imageUpload.ts'
import { FORUM_LIMITS } from '../lib/forum.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { forumStrings as t } from './forumStrings.ts'
import { isOfficer, postableBoards, problemText } from './forumText.ts'
import { MentionTextArea } from './MentionTextArea.tsx'
import { PostBlockView, RefBlock, usePostFiles, type PostFiles } from './PostBlocks.tsx'
import { RefPicker } from './RefPicker.tsx'

interface Item {
  id: number
  block: PostBlock
}

let nextId = 1
const item = (block: PostBlock): Item => ({ id: nextId++, block })

/**
 * 發文框 (e11-t13, AC-11.3), like Facebook's: the member's avatar and 「想分享什麼牌？」; opened,
 * a title, the post's blocks in order and a toolbar to add text, a picture, four hands, an auction,
 * one hand or a quote from the handbook; then 「發布到」 a board. A new post's draft is kept on this
 * device as it is written (`tku-bridgebook:forumDraft`) and cleared once it is posted. With `post`
 * it edits that post instead (its board stays).
 */
export function PostComposer({
  boards,
  members,
  post,
  boardId: preferredBoard,
  startOpen = false,
  onDone,
  onCancel,
}: {
  boards: readonly Board[]
  members: readonly ClubMember[]
  post?: Post
  boardId?: string
  startOpen?: boolean
  onDone: (post: Post) => void
  onCancel?: () => void
}) {
  const { user } = useAuth()
  const officer = isOfficer(user)
  const choices = postableBoards(boards, officer)
  const [draft] = useState(() => (post ? null : loadDraft()))
  const [open, setOpen] = useState(startOpen || !!post || !!draft)
  const [boardId, setBoardId] = useState(post?.boardId ?? draft?.boardId ?? preferredBoard ?? '')
  const [title, setTitle] = useState(post?.title ?? draft?.title ?? '')
  const [tags, setTags] = useState<string[]>(post?.tags ?? draft?.tags ?? [])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [items, setItems] = useState<Item[]>(() => (post?.blocks ?? draft?.blocks ?? [newBlock('paragraph')]).map(item))
  const [uploaded, setUploaded] = useState<PostFiles>({})
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const formId = useId()
  const existingFiles = usePostFiles(post?.blocks ?? [])
  const files = { ...existingFiles, ...uploaded }

  // A board the member may post on: the one asked for, else the first
  const board = post ? boardId : choices.some((b) => b.id === boardId) ? boardId : (choices[0]?.id ?? '')
  const blocks = items.map((i) => i.block)

  useEffect(() => {
    if (!post && open) saveDraft({ boardId: board, title, blocks: items.map((i) => i.block), ...(tags.length ? { tags } : {}) })
  }, [post, open, board, title, items, tags])
  // The tags in use, offered under the tag box (the table's AC-13.7); none when they cannot be read
  useEffect(() => {
    if (!open) return
    let current = true
    forumApi.tags().then(
      (found) => current && setSuggestions(found.map((x) => x.tag)),
      () => current && setSuggestions([]),
    )
    return () => {
      current = false
    }
  }, [open])

  if (!user) return null
  const name = user.profile?.displayName || user.username

  if (!open)
    return (
      <Box as="div">
        <Collapsed>
          <Avatar id={user.id} name={name} avatar={user.avatar} size={32} />
          <Prompt type="button" onClick={() => setOpen(true)}>
            {t.prompt}
          </Prompt>
        </Collapsed>
      </Box>
    )

  if (!post && !choices.length) return <Muted>{t.noBoards}</Muted>

  const update = (id: number, block: PostBlock) => setItems((list) => list.map((i) => (i.id === id ? { ...i, block } : i)))
  const remove = (id: number) => setItems((list) => list.filter((i) => i.id !== id))
  const move = (index: number, by: number) =>
    setItems((list) => {
      const next = [...list]
      const [moved] = next.splice(index, 1)
      next.splice(index + by, 0, moved)
      return next
    })
  const add = (block: PostBlock) => setItems((list) => [...list, item(block)])
  const dealer = (): Seat => {
    const deal = blocks.find((b) => b.kind === 'deal')
    return deal?.kind === 'deal' ? deal.deal.dealer : 'N'
  }

  const addImage = async (file: File) => {
    setError('')
    if (!isUploadType(file.type)) return setError(t.uploadType)
    setUploading(true)
    try {
      const done = await uploadImage(file, 'post')
      setUploaded((u) => ({ ...u, [done.key]: { url: done.url, thumbUrl: done.thumbUrl } }))
      add({ kind: 'image', assetId: done.key, alt: '' })
    } catch (e) {
      setError(filesOff(e) ? t.filesOff : e instanceof TypeError ? t.uploadType : `${t.uploadFailed}\n${errorText(e)}`)
    } finally {
      setUploading(false)
    }
  }

  const problems = postProblems(title, blocks)
  const submit = async () => {
    setError('')
    if (uploading) return setError(t.problems.uploading)
    if (problems.length) return setError(problems.map((p) => problemText(p)).join('\n'))
    setBusy(true)
    try {
      // An edit always sends its tags ([] takes them off); a new post only when it has some
      const input = { ...(title.trim() && { title: title.trim() }), blocks: tidyBlocks(blocks), ...((post || tags.length) && { tags }) }
      const saved = post ? await forumApi.updatePost(post.id, input) : await forumApi.createPost(board, input)
      if (!post) clearDraft()
      onDone(saved)
    } catch (e) {
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  const discard = () => {
    if (!window.confirm(t.discardConfirm)) return
    clearDraft()
    setTitle('')
    setTags([])
    setItems([item(newBlock('paragraph'))])
    if (onCancel) onCancel()
    else if (!startOpen) setOpen(false)
  }

  const length = textLength(blocks)

  return (
    <Box aria-labelledby={`${formId}-title`}>
      <h2 id={`${formId}-title`} className="visually-hidden">
        {post ? t.editPost : t.newPostTitle}
      </h2>
      <Head>
        <Avatar id={user.id} name={name} avatar={user.avatar} size={32} />
        <strong>{name}</strong>
      </Head>
      <Field>
        {t.titleLabel}
        <Input value={title} maxLength={FORUM_LIMITS.titleMax} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <TagsField tags={tags} onChange={setTags} suggestions={suggestions} />

      <Blocks>
        {items.map(({ id, block }, index) => (
          <BlockItem key={id} aria-label={t.blockLabel(index + 1, t.blockNames[block.kind])}>
            <BlockBar>
              <BlockName>{t.blockNames[block.kind]}</BlockName>
              <Row>
                <IconButton type="button" aria-label={t.moveUp} title={t.moveUp} disabled={index === 0} onClick={() => move(index, -1)}>
                  <ArrowUp size={16} aria-hidden />
                </IconButton>
                <IconButton
                  type="button"
                  aria-label={t.moveDown}
                  title={t.moveDown}
                  disabled={index === items.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown size={16} aria-hidden />
                </IconButton>
                <IconButton type="button" aria-label={t.remove} title={t.remove} onClick={() => remove(id)}>
                  <X size={16} aria-hidden />
                </IconButton>
              </Row>
            </BlockBar>
            <BlockEditor block={block} members={members} files={files} onChange={(b) => update(id, b)} />
          </BlockItem>
        ))}
      </Blocks>

      <Toolbar role="toolbar" aria-label={t.toolbar}>
        <Button type="button" $small $variant="ghost" onClick={() => add(newBlock('paragraph'))}>
          {t.add.paragraph}
        </Button>
        <Button type="button" $small $variant="ghost" disabled={uploading} onClick={() => fileInput.current?.click()}>
          {uploading ? t.uploading : t.add.image}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept={FILE_TYPES.join(',')}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void addImage(file)
          }}
        />
        <Button type="button" $small $variant="ghost" onClick={() => add(newBlock('deal'))}>
          {t.add.deal}
        </Button>
        <Button type="button" $small $variant="ghost" onClick={() => add(newBlock('auction', dealer()))}>
          {t.add.auction}
        </Button>
        <Button type="button" $small $variant="ghost" onClick={() => add(newBlock('hand'))}>
          {t.add.hand}
        </Button>
        <Button type="button" $small $variant="ghost" onClick={() => add({ kind: 'ref', slug: '' })}>
          {t.add.ref}
        </Button>
        <Button type="button" $small $variant="ghost" onClick={() => add({ kind: 'record', tableRecordId: '' })}>
          {t.add.record}
        </Button>
      </Toolbar>

      {error && <ErrorText role="alert">{error}</ErrorText>}

      <Footer>
        <Muted>
          {t.counter(length, FORUM_LIMITS.postTextMax)}
          {!post && ` · ${t.draftSaved}`}
        </Muted>
        <Row>
          {!post && (
            <Field>
              {t.board}
              <Select value={board} onChange={(e) => setBoardId(e.target.value)}>
                {choices.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                    {b.postPolicy === 'officers' ? t.officersOnly : ''}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          {post ? (
            <Button type="button" $variant="ghost" onClick={onCancel}>
              {t.cancel}
            </Button>
          ) : (
            <Button type="button" $variant="ghost" onClick={discard}>
              {t.discard}
            </Button>
          )}
          <Button type="button" $variant="primary" disabled={busy || uploading} onClick={() => void submit()}>
            {post ? (busy ? t.saving : t.save) : busy ? t.publishing : t.publish}
          </Button>
        </Row>
      </Footer>
    </Box>
  )
}

/** The editor for one block of a post */
function BlockEditor({
  block,
  members,
  files,
  onChange,
}: {
  block: PostBlock
  members: readonly ClubMember[]
  files: PostFiles
  onChange: (block: PostBlock) => void
}) {
  switch (block.kind) {
    case 'paragraph':
      return (
        <MentionTextArea
          value={block.text}
          onChange={(text) => onChange({ ...block, text })}
          members={members}
          label={t.add.paragraph}
          placeholder={t.textPlaceholder}
          rows={4}
        />
      )
    case 'deal':
      return (
        <>
          <DealInput value={block.deal} onChange={(deal) => onChange({ ...block, deal })} />
          <Field>
            {t.caption}
            <Input value={block.caption ?? ''} onChange={(e) => onChange({ ...block, caption: e.target.value })} />
          </Field>
        </>
      )
    case 'auction':
      return (
        <>
          <AuctionInput value={block.auction} onChange={(auction) => onChange({ ...block, auction })} />
          <Field>
            {t.caption}
            <Input value={block.caption ?? ''} onChange={(e) => onChange({ ...block, caption: e.target.value })} />
          </Field>
        </>
      )
    case 'hand':
      return (
        <>
          <HandInput value={block.cards} onChange={(cards) => onChange({ ...block, cards })} />
          <Field>
            {t.handLabel}
            <Input value={block.label ?? ''} onChange={(e) => onChange({ ...block, label: e.target.value })} />
          </Field>
        </>
      )
    case 'image':
      return (
        <>
          <PostBlockView block={block} members={members} files={files} />
          <Field>
            {t.alt}
            <Input value={block.alt} onChange={(e) => onChange({ ...block, alt: e.target.value })} />
          </Field>
          <Field>
            {t.caption}
            <Input value={block.caption ?? ''} onChange={(e) => onChange({ ...block, caption: e.target.value })} />
          </Field>
        </>
      )
    case 'ref':
      return block.slug ? (
        <>
          <RefBlock slug={block.slug} sectionId={block.sectionId} />
          <Row>
            <Button type="button" $small $variant="ghost" onClick={() => onChange({ kind: 'ref', slug: '' })}>
              {t.refChange}
            </Button>
          </Row>
        </>
      ) : (
        <RefPicker onPick={(slug, sectionId) => onChange(sectionId ? { kind: 'ref', slug, sectionId } : { kind: 'ref', slug })} />
      )
    case 'record':
      return <RecordEditor id={block.tableRecordId} onChange={(tableRecordId) => onChange({ kind: 'record', tableRecordId })} />
    default:
      // Kinds the compose box does not make (lists, notes) are kept as they are
      return <PostBlockView block={block} members={members} files={files} />
  }
}

/**
 * 牌桌紀錄 (e11-t20): the member pastes a record page's address from TKU-BridgeTable (or its id);
 * the post keeps the id and links to the record. The deal itself shows once the table can share it (e13-t07)
 */
function RecordEditor({ id, onChange }: { id: string; onChange: (id: string) => void }) {
  const [text, setText] = useState(id)
  const hintId = useId()
  const bad = text.trim() !== '' && !recordIdFrom(text)
  return (
    <>
      <Field>
        {t.recordInput}
        <Input
          value={text}
          inputMode="url"
          aria-describedby={hintId}
          aria-invalid={bad || undefined}
          onChange={(e) => {
            setText(e.target.value)
            onChange(recordIdFrom(e.target.value) ?? '')
          }}
        />
      </Field>
      {bad ? (
        <ErrorText id={hintId}>{t.recordBad}</ErrorText>
      ) : (
        <Muted id={hintId}>{t.recordHint}</Muted>
      )}
      {id && <PostBlockView block={{ kind: 'record', tableRecordId: id }} members={[]} files={{}} />}
    </>
  )
}

/**
 * A post's tags (the table's AC-13.7): typed and added with Enter, a comma or leaving the box,
 * normalized as the Worker keeps them, at most FORUM_LIMITS.tagsMax of FORUM_LIMITS.tagMax
 * characters; the tags in use are offered underneath
 */
function TagsField({ tags, onChange, suggestions }: { tags: string[]; onChange: (tags: string[]) => void; suggestions: readonly string[] }) {
  const [text, setText] = useState('')
  const hintId = useId()
  const full = tags.length >= FORUM_LIMITS.tagsMax
  const add = (value: string) => {
    const next = [...tags]
    for (const tag of splitTags(value))
      if (!next.includes(tag) && next.length < FORUM_LIMITS.tagsMax && [...tag].length <= FORUM_LIMITS.tagMax) next.push(tag)
    if (next.length !== tags.length) onChange(next)
    setText('')
  }
  const offered = suggestions.filter((tag) => !tags.includes(tag)).slice(0, 12)
  return (
    <TagBox>
      <Field>
        {t.tagsLabel}
        <Input
          aria-describedby={hintId}
          placeholder={full ? '' : t.tagsPlaceholder}
          disabled={full}
          maxLength={FORUM_LIMITS.tagMax}
          value={text}
          onChange={(e) => (/[,，、;；]/.test(e.target.value) ? add(e.target.value) : setText(e.target.value))}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' || e.nativeEvent.isComposing) return
            e.preventDefault()
            add(text)
          }}
          onBlur={() => text.trim() && add(text)}
        />
        <small id={hintId}>{t.tagsHint(FORUM_LIMITS.tagsMax, FORUM_LIMITS.tagMax)}</small>
      </Field>
      {tags.length > 0 && (
        <ul aria-label={t.tags}>
          {tags.map((tag) => (
            <li key={tag}>
              <Button type="button" $small onClick={() => onChange(tags.filter((x) => x !== tag))} aria-label={t.removeTag(tag)} title={t.removeTag(tag)}>
                #{tag}
                <X size={14} aria-hidden />
              </Button>
            </li>
          ))}
        </ul>
      )}
      {!full && offered.length > 0 && (
        <ul aria-label={t.suggestedTags}>
          {offered.map((tag) => (
            <li key={tag}>
              <Button type="button" $small $variant="ghost" onClick={() => add(tag)}>
                #{tag}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </TagBox>
  )
}

const TagBox = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};

  & > ul {
    display: flex;
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.space(1.5)};
    margin: 0;
    padding: 0;
    list-style: none;
  }
`

const Box = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  padding: ${({ theme }) => theme.space(4)};
  border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.panel};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.panel};
  min-width: 0;
`

const Collapsed = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
`

const Prompt = styled.button`
  flex: 1;
  min-height: 2.5rem;
  padding: 0 ${({ theme }) => theme.space(4)};
  border: ${({ theme }) => theme.borders.control} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.tag};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  color: ${({ theme }) => theme.colors.textMuted};
  font: inherit;
  text-align: left;
  cursor: text;
`

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
`

const Blocks = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
`

const BlockItem = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(3)};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.note};
  min-width: 0;
`

const BlockBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(2)};
`

const BlockName = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8125rem;
  font-weight: 600;
`

const IconButton = styled.button`
  display: inline-grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 0;
  border-radius: ${({ theme }) => theme.shape.control};
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.text};
  }

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(1)};
  padding-top: ${({ theme }) => theme.space(2)};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const Footer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(3)};
`
