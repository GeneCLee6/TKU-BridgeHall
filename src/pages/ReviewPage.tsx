import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { DiffView } from '../components/DiffView.tsx'
import { Button, ErrorText, Field, Input, Muted, Notice, PageTitle, Panel, PanelTitle, Row, TextArea } from '../components/ui.tsx'
import { api, ApiError, errorText, type ArticleDraftSummary, type BookDraft, type BookDraftSummary } from '../lib/api.ts'
import { articleEditApi } from '../lib/articleEditApi.ts'
import { conventionProblems } from '../lib/content.ts'
import { changedSectionIds, diffConventions } from '../lib/diff.ts'
import { formatDateTime } from '../lib/format.ts'
import { reviewApi } from '../lib/reviewApi.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { useContent, useConvention } from '../state/ContentContext.tsx'
import { strings } from '../strings.ts'
import type { Convention } from '../types/convention.ts'
import { Frame, Gate } from './Frame.tsx'
import { articleEditStrings as a } from './articleEditStrings.ts'
import { diffText as d, review as r } from './reviewStrings.ts'

/**
 * 審核 (E8 e8-t04, AC-8.1, AC-8.3). /review lists every convention's draft, the ones sent for
 * review first; /review/:slug shows one against what readers see now, paragraph by paragraph,
 * with the editor's note. Editors may look; reviewers (`bookReview`) publish it or send it back
 * with why. One column, so it works on a phone. Reads the club's content, not a reader's profile.
 * Articles' drafts (e5-t07) are listed too, marked 文章; they open in the article editor, where
 * reviewers publish them or send them back.
 */
export function ReviewPage() {
  return (
    <Frame>
      <Gate need="bookEdit">
        <Review />
      </Gate>
    </Frame>
  )
}

function Review() {
  const { slug } = useParams()
  return slug ? <ReviewDraft key={slug} slug={slug} /> : <ReviewList />
}

/** A convention's or an article's draft in the list, with where it opens */
type ListedDraft = (BookDraftSummary | ArticleDraftSummary) & { title: string; to: string; article: boolean }

function ReviewList() {
  usePageTitle(d.reviewTitle)
  const location = useLocation()
  const notice = (location.state as { notice?: string } | null)?.notice
  const [drafts, setDrafts] = useState<ListedDraft[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let current = true
    articleEditApi.reviews().then(
      (list) =>
        current &&
        setDrafts([
          ...list.drafts.map((x) => ({ ...x, title: x.nameZh || x.slug, to: `/review/${x.slug}`, article: false })),
          ...(list.articles ?? []).map((x) => ({ ...x, title: x.title || x.slug, to: `/library/${x.slug}/edit`, article: true })),
        ]),
      (e) => current && setError(errorText(e)),
    )
    return () => {
      current = false
    }
  }, [])
  const inReview = drafts?.filter((x) => x.status === 'in-review') ?? []
  const editing = drafts?.filter((x) => x.status !== 'in-review') ?? []
  return (
    <>
      <PageTitle>{d.reviewTitle}</PageTitle>
      <Muted>{d.reviewIntro}</Muted>
      {notice && <Notice role="status">{notice}</Notice>}
      {error && <ErrorText role="alert">{error}</ErrorText>}
      {!drafts && !error && <Muted role="status">{strings.loading}</Muted>}
      {drafts && !drafts.length && <Muted>{d.reviewEmpty}</Muted>}
      {[
        { id: 'review-in', title: d.inReviewList, list: inReview },
        { id: 'review-draft', title: d.draftList, list: editing },
      ].map(
        (group) =>
          group.list.length > 0 && (
            <Panel key={group.id} aria-labelledby={group.id}>
              <PanelTitle id={group.id}>
                {group.title}（{group.list.length}）
              </PanelTitle>
              <Cards>
                {group.list.map((x) => (
                  <li key={x.to}>
                    <span>
                      {x.article && <Muted as="span">{a.reviewArticles}・</Muted>}
                      <Link to={x.to}>{x.title}</Link>
                    </span>
                    <Muted>
                      {x.status === 'in-review'
                        ? d.submittedBy(x.reviewRequestedBy ?? x.updatedBy, formatDateTime(x.reviewRequestedAt ?? x.updatedAt))
                        : d.savedBy(x.updatedBy, formatDateTime(x.updatedAt))}
                    </Muted>
                    {x.note && <Muted>{x.note}</Muted>}
                    {x.reviewedBy && x.reviewedAt && (
                      <Muted>
                        {r.sentBack(x.reviewedBy, formatDateTime(x.reviewedAt))}：{x.reviewNote || r.sentBackNoReason}
                      </Muted>
                    )}
                  </li>
                ))}
              </Cards>
            </Panel>
          ),
      )}
    </>
  )
}

function ReviewDraft({ slug }: { slug: string }) {
  const content = useContent()
  const { can } = useAuth()
  const reviewer = can('bookReview')
  const navigate = useNavigate()
  const [draft, setDraft] = useState<BookDraft | null | undefined>(undefined)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')
  const [notice, setNotice] = useState('')

  const fetchDraft = useCallback(() => {
    let current = true
    reviewApi.draftOf(slug).then(
      (x) => current && setDraft(x),
      (e) => {
        if (!current) return
        setError(errorText(e))
        setDraft(null)
      },
    )
    return () => {
      current = false
    }
  }, [slug])
  useEffect(fetchDraft, [fetchDraft])

  // What readers see now: the online version, or the bundled one; nothing for a new convention
  const info = content.online.get(slug)
  const published = Boolean(content.bySlug(slug) ?? content.bundledBySlug(slug))
  const fetched = useConvention(slug, content.status !== 'loading' && published)
  const problems = useMemo(
    () => (draft ? conventionProblems(draft.convention, content.categories.map((c) => c.id)) : []),
    [draft, content.categories],
  )
  const after = draft && !problems.length ? (draft.convention as Convention) : null
  const before = published && !fetched.missing ? fetched.convention : null
  const diff = useMemo(() => (after && before !== undefined ? diffConventions(before, after) : null), [after, before])
  const name = after?.nameZh || content.bySlug(slug)?.nameZh || slug
  usePageTitle(`${d.reviewTitle}：${name}`)

  const run = async (work: () => Promise<void>) => {
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await work()
    } catch (e) {
      setError(errorText(e))
      // Someone saved the draft or published in between: show the newer state
      if (e instanceof ApiError && e.status === 409) fetchDraft()
    } finally {
      setBusy(false)
    }
  }
  const publish = () =>
    run(async () => {
      if (!draft) return
      const { entry } = await api.book.save(slug, {
        convention: draft.convention,
        baseVersion: info?.version ?? 0,
        bundledUpdated: content.bundledBySlug(slug)?.updated,
        note: note.trim() || undefined,
        draftRevision: draft.revision,
        // Who to notify (e8-t10, e8-t11): what changed from what readers see now
        changedSections: changedSectionIds(before ?? null, draft.convention as Convention),
      })
      await content.reload()
      navigate('/review', { state: { notice: `${name}：${r.published(entry.version)}` } })
    })
  const reject = () =>
    run(async () => {
      if (!draft) return
      setDraft(await reviewApi.reject(slug, draft.revision, reason.trim()))
      setReason('')
      setNotice(r.rejected)
    })

  const back = <Link to="/review">← {d.backToList}</Link>
  if (draft === undefined || (published && !fetched.convention && !fetched.failed && !fetched.missing))
    return (
      <>
        {back}
        <Muted role="status">{strings.loading}</Muted>
      </>
    )
  if (!draft)
    return (
      <>
        {back}
        {error ? <ErrorText role="alert">{error}</ErrorText> : <Muted>{d.noDraft}</Muted>}
      </>
    )

  const stale = info && draft.baseVersion < info.version
  return (
    <>
      {back}
      <PageTitle>
        {d.reviewTitle}：{name}
      </PageTitle>
      <Panel aria-labelledby="review-about">
        <PanelTitle id="review-about">{draft.status === 'in-review' ? r.stateInReview : r.stateDraft}</PanelTitle>
        <About>
          <Muted>
            {draft.status === 'in-review'
              ? d.submittedBy(draft.reviewRequestedBy ?? draft.updatedBy, formatDateTime(draft.reviewRequestedAt ?? draft.updatedAt))
              : d.savedBy(draft.updatedBy, formatDateTime(draft.updatedAt))}
          </Muted>
          {draft.note && (
            <Muted>
              {d.draftNote}：{draft.note}
            </Muted>
          )}
          {draft.reviewedBy && draft.reviewedAt && (
            <Muted>
              {r.sentBack(draft.reviewedBy, formatDateTime(draft.reviewedAt))}：{draft.reviewNote || r.sentBackNoReason}
            </Muted>
          )}
          {stale && <ErrorText>{r.stale(draft.baseVersion, info.version)}</ErrorText>}
          <Row>
            <Link to={`/edit/${slug}`}>{d.openEditor}</Link>
          </Row>
        </About>
      </Panel>

      {notice && <Notice role="status">{notice}</Notice>}
      {error && <ErrorText role="alert">{error}</ErrorText>}

      <Panel aria-labelledby="review-diff">
        <PanelTitle id="review-diff">{published ? d.compareBase(info && !info.hidden ? info.version : 0) : d.newConvention}</PanelTitle>
        {problems.length > 0 ? (
          <ErrorText role="alert">
            {d.invalid}
            {'\n'}
            {problems.slice(0, 5).join('\n')}
          </ErrorText>
        ) : fetched.failed ? (
          <ErrorText role="alert">{strings.online.loadFailed}</ErrorText>
        ) : (
          diff && <DiffView diff={diff} before={info && !info.hidden ? r.versionN(info.version) : d.bundled} after={r.stateDraft} />
        )}
      </Panel>

      {reviewer ? (
        <Panel aria-labelledby="review-act">
          <PanelTitle id="review-act">
            {r.publishDraft}／{r.reject}
          </PanelTitle>
          <Actions>
            <Field>
              {d.publishNote}
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={draft.note} />
            </Field>
            <Muted>{d.publishConfirm}</Muted>
            <Row>
              <Button type="button" $variant="primary" disabled={busy || problems.length > 0} onClick={() => void publish()}>
                {busy ? r.saving : r.publishDraft}
              </Button>
            </Row>
            {draft.status === 'in-review' && (
              <>
                <Field>
                  {r.rejectReason}
                  <TextArea value={reason} rows={3} placeholder={r.rejectReasonHint} onChange={(e) => setReason(e.target.value)} />
                </Field>
                <Row>
                  <Button type="button" $variant="danger" disabled={busy} onClick={() => void reject()}>
                    {r.reject}
                  </Button>
                </Row>
              </>
            )}
          </Actions>
        </Panel>
      ) : (
        <Muted>{d.reviewerOnly}</Muted>
      )}
    </>
  )
}

const Cards = styled.ul`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: grid;
    gap: ${({ theme }) => theme.space(1)};
    padding-bottom: ${({ theme }) => theme.space(3)};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
  li:last-child {
    padding-bottom: 0;
    border-bottom: 0;
  }
  a {
    font-weight: 700;
  }
`

const About = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
`

const Actions = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
`
