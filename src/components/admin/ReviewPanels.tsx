import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { errorText, type AuditEntry, type BookDraftSummary } from '../../lib/api.ts'
import { reviewApi } from '../../lib/reviewApi.ts'
import { formatDateTime } from '../../lib/format.ts'
import { diffText, review as t } from '../../pages/reviewStrings.ts'
import { DataTable, TableScroll } from '../DataTable.tsx'
import { ErrorText, Muted, Panel, PanelTitle } from '../ui.tsx'

/** Loads once; `error` is the message when it cannot */
function useLoaded<T>(load: () => Promise<T>) {
  const [value, setValue] = useState<T | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    let current = true
    load().then(
      (v) => current && setValue(v),
      (e) => current && setError(errorText(e)),
    )
    return () => {
      current = false
    }
  }, [load])
  return { value, error }
}

const loadDrafts = () => reviewApi.drafts()
const loadAudit = () => reviewApi.audit()

/**
 * 草稿與送審 on the admin page (e8-t02): every convention's draft, the ones in review first, each
 * linked to its review page (/review/:slug, e8-t04), where it is compared with what is published
 * and a reviewer publishes it or sends it back.
 */
export function DraftsPanel() {
  const { value: drafts, error } = useLoaded<BookDraftSummary[]>(loadDrafts)
  return (
    <Panel aria-labelledby="admin-drafts">
      <PanelTitle id="admin-drafts">{t.draftsTitle}</PanelTitle>
      <Muted>
        {t.draftsIntro} <Link to="/review">{diffText.openReview}</Link>
      </Muted>
      {error && <ErrorText role="alert">{error}</ErrorText>}
      {drafts &&
        (drafts.length ? (
          <TableScroll>
            <DataTable>
              <thead>
                <tr>
                  <th>{t.convention}</th>
                  <th>{t.status}</th>
                  <th>{t.updated}</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((d) => (
                  <tr key={d.slug}>
                    <td>
                      <Link to={`/review/${d.slug}`} aria-label={`${t.open}：${d.nameZh}`}>
                        {d.nameZh}
                      </Link>
                    </td>
                    <td>{d.status === 'in-review' ? `${t.stateInReview}（${d.reviewRequestedBy ?? d.updatedBy}）` : t.stateDraft}</td>
                    <td>
                      {d.updatedBy}・{formatDateTime(d.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </TableScroll>
        ) : (
          <Muted>{t.draftsEmpty}</Muted>
        ))}
    </Panel>
  )
}

/** Where a record's link goes: a convention's history at that version, a profile's editor */
function targetLink(entry: AuditEntry) {
  if (entry.action.startsWith('profile:'))
    return entry.action === 'profile:delete' ? null : `/profiles/${encodeURIComponent(entry.target)}/edit`
  if (entry.action === 'book:categories') return null
  if (entry.action === 'book:glossary') return '/glossary'
  // A 待確認 note (e8-t06): `<slug>/<sectionId>/<n>`
  if (entry.action === 'book:pending') return '/pending'
  if (entry.action === 'article:series') return '/library'
  // An article's draft opens in its editor (e5-t07)
  if (['article:draft', 'article:submit', 'article:reject'].includes(entry.action)) return `/library/${entry.target}/edit`
  if (entry.action.startsWith('article:')) return `/library/${entry.target}`
  // A convention card version (e3-t09): `<profile>/<template>`, the version's number
  if (entry.action === 'card:publish' && entry.version) return `/cards/${entry.target}/v/${entry.version}`
  if (entry.action === 'card:delete') return null
  return entry.revisionId ? `/edit/${entry.target}?rev=${encodeURIComponent(entry.revisionId)}` : `/edit/${entry.target}`
}

/** 審計紀錄 (e8-t09, AC-8.6): the newest 200 changes, each linked to the version it made */
export function AuditPanel() {
  const { value: entries, error } = useLoaded<AuditEntry[]>(loadAudit)
  return (
    <Panel aria-labelledby="admin-audit">
      <PanelTitle id="admin-audit">{t.auditTitle}</PanelTitle>
      <Muted>{t.auditIntro}</Muted>
      {error && <ErrorText role="alert">{error}</ErrorText>}
      {entries &&
        (entries.length ? (
          <TableScroll>
            <DataTable>
              <thead>
                <tr>
                  <th>{t.when}</th>
                  <th>{t.who}</th>
                  <th>{t.what}</th>
                  <th>{t.target}</th>
                  <th>{t.version}</th>
                  <th>{t.note}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const link = targetLink(e)
                  const name =
                    e.action === 'book:categories'
                      ? t.categories
                      : e.action === 'article:series'
                        ? t.series
                        : e.action === 'book:glossary'
                          ? t.glossary
                          : e.target
                  return (
                    <tr key={e.id}>
                      <td>{formatDateTime(e.at)}</td>
                      <td>{e.by}</td>
                      <td>{t.actions[e.action] ?? e.action}</td>
                      <td>{link ? <Link to={link}>{name}</Link> : name}</td>
                      <td>{e.version ? t.versionN(e.version) : ''}</td>
                      <td>{e.note ?? ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </DataTable>
          </TableScroll>
        ) : (
          <Muted>{t.auditEmpty}</Muted>
        ))}
    </Panel>
  )
}
