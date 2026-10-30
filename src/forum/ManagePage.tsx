import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import styled from 'styled-components'
import { Tag, TagList } from '../components/Tag.tsx'
import { Button, ErrorText, Field, Input, Muted, Notice, Panel, PanelTitle, Row, Select } from '../components/ui.tsx'
import { errorText, type ClubMember } from '../lib/api.ts'
import { BOARD_POST_POLICIES, BUILTIN_BOARDS, FORUM_LIMITS, type Board, type BoardPostPolicy, type ReportItem } from '../lib/forum.ts'
import { forumApi } from '../lib/forumApi.ts'
import { memberLabel } from '../lib/forumPosts.ts'
import { formatDateTime } from '../lib/format.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { forumStrings as t } from './forumStrings.ts'
import { commentAnchor, isOfficer, postPath } from './forumText.ts'

/** What this page needs of the forum frame's Outlet context (ForumPages.tsx `Forum`) */
interface ManageContext {
  club: { boards: Board[]; members: ClubMember[] }
  /** The front page and 社團新聞 again, after a post was removed */
  refresh: () => void
  /** The boards again, after they were changed */
  reloadClub: () => void
}

/**
 * 討論區管理 `/forum/manage` (e11-t17, AC-11.6, AC-11.2): the officers' list of reports, and the
 * admins' boards. The officers (`isOfficer`) open a report's post, dismiss it or remove what it
 * reported; what they do is in the audit log on the admin page. The Worker checks every call again.
 */
export function ManagePage() {
  const { user } = useAuth()
  const forum = useOutletContext<ManageContext>()
  if (!isOfficer(user)) return <Muted>{t.officersOnlyPage}</Muted>
  return (
    <Page>
      <h1>{t.manage}</h1>
      <Muted>{t.manageIntro}</Muted>
      <ReportsPanel members={forum.club.members} onRemoved={forum.refresh} />
      {user?.admin ? <BoardsPanel boards={forum.club.boards} onSaved={forum.reloadClub} /> : <Muted>{t.boardsAdminOnly}</Muted>}
    </Page>
  )
}

function ReportsPanel({ members, onRemoved }: { members: readonly ClubMember[]; onRemoved: () => void }) {
  const [all, setAll] = useState(false)
  const [items, setItems] = useState<ReportItem[]>()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')

  const load = useCallback(() => {
    forumApi.reports(all ? 'all' : 'open').then(setItems, (e) => setError(errorText(e)))
  }, [all])
  useEffect(load, [load])

  const name = (id: string) => memberLabel(members, id) ?? t.someone
  const decide = async (item: ReportItem, action: 'dismiss' | 'remove') => {
    const what = t.reportOn[item.report.target]
    if (action === 'remove' && !window.confirm(t.removeReportedConfirm(what))) return
    setBusy(item.report.id)
    setError('')
    try {
      await forumApi.decide(item.report.id, action)
      if (action === 'remove') onRemoved()
    } catch (e) {
      setError(errorText(e))
    }
    setBusy('')
    load()
  }

  return (
    <Panel aria-labelledby="forum-reports">
      <PanelTitle id="forum-reports">
        {t.reportsTitle}
        {items && !all && items.length > 0 && `（${items.length}）`}
      </PanelTitle>
      <Check>
        <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} />
        {t.reportsAll}
      </Check>
      {error && <ErrorText role="alert">{error}</ErrorText>}
      {!items ? (
        <Muted role="status">{t.loading}</Muted>
      ) : items.length === 0 ? (
        <Muted>{t.reportsEmpty}</Muted>
      ) : (
        <List>
          {items.map((item) => {
            const { report } = item
            const link = item.postId && postPath(item.postId) + (report.target === 'comment' ? `#${commentAnchor(report.targetId)}` : '')
            return (
              <li key={report.id} aria-label={`${t.reportOn[report.target]}：${item.excerpt ?? t.reportGone}`}>
                <TagList>
                  <Tag label={t.reportStatus[report.status]} />
                  <Tag label={t.reportOn[report.target]} />
                </TagList>
                <Excerpt>{item.excerpt ?? t.reportGone}</Excerpt>
                {item.authorId && <Small>{t.reportAuthor(name(item.authorId))}</Small>}
                <Reason>{report.reason}</Reason>
                <Small>{t.reportBy(name(report.reporterId), formatDateTime(report.createdAt))}</Small>
                {report.handledBy && report.handledAt && <Small>{t.reportHandled(name(report.handledBy), formatDateTime(report.handledAt))}</Small>}
                <Row>
                  {link && <Link to={link}>{t.openPost}</Link>}
                  {report.status === 'open' && (
                    <>
                      <Button type="button" $small disabled={busy === report.id} onClick={() => void decide(item, 'dismiss')}>
                        {t.dismiss}
                      </Button>
                      {item.postId && (
                        <Button type="button" $small $variant="danger" disabled={busy === report.id} onClick={() => void decide(item, 'remove')}>
                          {t.removeReported}
                        </Button>
                      )}
                    </>
                  )}
                </Row>
              </li>
            )
          })}
        </List>
      )}
    </Panel>
  )
}

type BoardDraft = { id?: string; key: string; name: string; description: string; postPolicy: BoardPostPolicy }

const toDrafts = (boards: readonly Board[]): BoardDraft[] =>
  [...boards]
    .sort((a, b) => a.order - b.order)
    .map((b) => ({ id: b.id, key: b.id, name: b.name, description: b.description, postPolicy: b.postPolicy }))

const isBuiltIn = (id?: string) => !!id && BUILTIN_BOARDS.some((b) => b.id === id)

/**
 * 板面 (AC-11.2, admins): rename, describe, choose who posts, reorder and add boards, saved together
 * (each changed board is one PATCH, each new one a POST, its place its `order`); deleting asks first
 * and is at once. The Worker keeps the built-in boards and any board with posts.
 */
function BoardsPanel({ boards, onSaved }: { boards: readonly Board[]; onSaved: () => void }) {
  const [drafts, setDrafts] = useState(() => toDrafts(boards))
  const [newIds, setNewIds] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  // New boards from the frame (after saving or deleting): start again from them
  const [seen, setSeen] = useState(boards)
  if (seen !== boards) {
    setSeen(boards)
    setDrafts(toDrafts(boards))
  }

  const set = (key: string, change: Partial<BoardDraft>) => setDrafts((list) => list.map((d) => (d.key === key ? { ...d, ...change } : d)))
  const move = (i: number, by: number) =>
    setDrafts((list) => {
      const next = [...list]
      ;[next[i], next[i + by]] = [next[i + by], next[i]]
      return next
    })
  const add = () => setDrafts((list) => [...list, { key: `new-${Date.now()}`, name: t.newBoard, description: '', postPolicy: 'all' }])

  const save = async () => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      for (const [order, d] of drafts.entries()) {
        const fields = { name: d.name, description: d.description, postPolicy: d.postPolicy, order }
        if (!d.id) {
          const id = newIds[d.key]?.trim()
          await forumApi.createBoard(id ? { id, ...fields } : fields)
          continue
        }
        const was = boards.find((b) => b.id === d.id)
        if (was && (was.name !== d.name || was.description !== d.description || was.postPolicy !== d.postPolicy || was.order !== order))
          await forumApi.updateBoard(d.id, fields)
      }
      setNewIds({})
      setNotice(t.boardsSaved)
    } catch (e) {
      setError(errorText(e))
    }
    setBusy(false)
    onSaved()
  }

  const remove = async (d: BoardDraft) => {
    if (!d.id) return setDrafts((list) => list.filter((x) => x.key !== d.key))
    if (!window.confirm(t.deleteBoardConfirm(d.name))) return
    setError('')
    try {
      await forumApi.deleteBoard(d.id)
      onSaved()
    } catch (e) {
      setError(errorText(e))
    }
  }

  return (
    <Panel aria-labelledby="forum-boards">
      <PanelTitle id="forum-boards">{t.boardsTitle}</PanelTitle>
      <Muted>{t.boardsIntro}</Muted>
      {error && <ErrorText role="alert">{error}</ErrorText>}
      {notice && <Notice role="status">{notice}</Notice>}
      <List>
        {drafts.map((d, i) => (
          <li key={d.key} aria-label={t.boardRow(d.name)}>
            <Fields>
              <Field>
                {t.boardName}
                <Input value={d.name} maxLength={FORUM_LIMITS.boardNameMax} onChange={(e) => set(d.key, { name: e.target.value })} />
              </Field>
              <Field>
                {t.boardDescription}
                <Input
                  value={d.description}
                  maxLength={FORUM_LIMITS.boardDescriptionMax}
                  onChange={(e) => set(d.key, { description: e.target.value })}
                />
              </Field>
              <Field>
                {t.boardPolicy}
                <Select value={d.postPolicy} onChange={(e) => set(d.key, { postPolicy: e.target.value as BoardPostPolicy })}>
                  {BOARD_POST_POLICIES.map((p) => (
                    <option key={p} value={p}>
                      {t.boardPolicies[p]}
                    </option>
                  ))}
                </Select>
              </Field>
              {!d.id && (
                <Field>
                  {t.boardId}
                  <Input value={newIds[d.key] ?? ''} maxLength={20} onChange={(e) => setNewIds({ ...newIds, [d.key]: e.target.value })} />
                </Field>
              )}
            </Fields>
            <Row>
              {isBuiltIn(d.id) && <Small>{t.builtIn}</Small>}
              <Button type="button" $small $variant="ghost" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`${t.moveUp}：${d.name}`}>
                <ArrowUp size={16} aria-hidden />
              </Button>
              <Button
                type="button"
                $small
                $variant="ghost"
                disabled={i === drafts.length - 1}
                onClick={() => move(i, 1)}
                aria-label={`${t.moveDown}：${d.name}`}
              >
                <ArrowDown size={16} aria-hidden />
              </Button>
              {!isBuiltIn(d.id) && (
                <Button type="button" $small $variant="ghost" onClick={() => void remove(d)} aria-label={`${t.deleteBoard}：${d.name}`}>
                  <Trash2 size={16} aria-hidden />
                </Button>
              )}
            </Row>
          </li>
        ))}
      </List>
      <Row>
        <Button type="button" $small onClick={add} disabled={drafts.length >= FORUM_LIMITS.boardsMax}>
          <Plus size={16} aria-hidden />
          {t.addBoard}
        </Button>
        <Button type="button" $variant="primary" disabled={busy} onClick={() => void save()}>
          {busy ? t.saving : t.saveBoards}
        </Button>
      </Row>
    </Panel>
  )
}

const Page = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(4)};

  h1 {
    margin: 0;
    font-size: 1.375rem;
    color: ${({ theme }) => theme.colors.primaryStrong};
  }
`

const List = styled.ul`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  margin: 0;
  padding: 0;
  list-style: none;

  > li {
    display: grid;
    gap: ${({ theme }) => theme.space(1)};
    padding: ${({ theme }) => theme.space(3)};
    border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.shape.control};
  }
`

const Fields = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: ${({ theme }) => theme.space(2)};
`

const Excerpt = styled.p`
  margin: 0;
  font-weight: 600;
`

const Reason = styled.p`
  margin: 0;
  white-space: pre-wrap;
`

const Small = styled.small`
  color: ${({ theme }) => theme.colors.textMuted};
`

const Check = styled.label`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
`
