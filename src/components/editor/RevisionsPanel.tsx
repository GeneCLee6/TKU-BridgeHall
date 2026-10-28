import { useEffect, useState } from 'react'
import styled from 'styled-components'
import type { BookRevision } from '../../lib/api.ts'
import { formatDateTime } from '../../lib/format.ts'
import { strings } from '../../strings.ts'
import { Button, ErrorText, Muted, Row } from '../ui.tsx'

const t = strings.editor

/**
 * The saved versions of a convention, newest first. Loading one puts it in the editor; saving
 * then restores it. Also offers going back to the bundled version and hiding (reviewers', e8-t01).
 * `highlight` marks one version (the audit log links to it, e8-t09).
 */
export function RevisionsPanel({
  load,
  onLoad,
  highlight,
  onReset,
  onHide,
  onClose,
}: {
  load: () => Promise<BookRevision[]>
  onLoad: (revision: BookRevision) => Promise<void>
  highlight?: string
  /** Absent when there is no online version to drop */
  onReset?: () => Promise<void>
  /** Reviewers only */
  onHide?: () => Promise<void>
  onClose: () => void
}) {
  const [revisions, setRevisions] = useState<BookRevision[] | null>(null)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState<'reset' | 'hide' | null>(null)

  useEffect(() => {
    load()
      .then(setRevisions)
      .catch((e: Error) => setError(e.message))
  }, [load])

  const act = async (work: () => Promise<void>) => {
    setError('')
    try {
      await work()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <Panel role="dialog" aria-label={t.historyTitle}>
      <Head>
        <h2>{t.historyTitle}</h2>
        <Button type="button" $small onClick={onClose}>
          {t.close}
        </Button>
      </Head>
      {error && <ErrorText role="alert">{error}</ErrorText>}
      {!revisions ? (
        !error && <Muted role="status">{strings.loading}</Muted>
      ) : !revisions.length ? (
        <Muted>{t.historyEmpty}</Muted>
      ) : (
        <List>
          {revisions.map((r) => (
            <li key={r.id} aria-current={r.id === highlight ? 'true' : undefined}>
              <div>
                <strong>{formatDateTime(r.at)}</strong> {r.by}・{t.historyActions[r.action]}
                {r.version > 0 && `（第 ${r.version} 版）`}
                {r.note && <Note>{r.note}</Note>}
              </div>
              {r.action === 'save' && (
                <Button type="button" $small onClick={() => void act(() => onLoad(r))}>
                  {t.loadRevision}
                </Button>
              )}
            </li>
          ))}
        </List>
      )}
      {(onReset || onHide) && (
        <Danger>
          {confirm ? (
            <>
              <span>{confirm === 'reset' ? t.confirmReset : t.confirmHide}</span>
              <Row>
                <Button
                  type="button"
                  $small
                  $variant="danger"
                  onClick={() => void act(async () => (confirm === 'reset' ? onReset : onHide)?.())}
                >
                  {strings.confirm}
                </Button>
                <Button type="button" $small onClick={() => setConfirm(null)}>
                  {strings.cancel}
                </Button>
              </Row>
            </>
          ) : (
            <Row>
              {onReset && (
                <Button type="button" $small $variant="danger" onClick={() => setConfirm('reset')}>
                  {t.resetToBundled}
                </Button>
              )}
              {onHide && (
                <Button type="button" $small $variant="danger" onClick={() => setConfirm('hide')}>
                  {t.hide}
                </Button>
              )}
            </Row>
          )}
        </Danger>
      )}
    </Panel>
  )
}

const Panel = styled.aside`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  align-content: start;
  padding: ${({ theme }) => theme.space(4)};
  border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.panel};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.panel};
`

const Head = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  h2 {
    margin: 0;
    font-size: 1.125rem;
  }
`

const List = styled.ol`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: ${({ theme }) => theme.space(2)};
    padding: ${({ theme }) => theme.space(2)} 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    font-size: 0.9375rem;
  }
  li[aria-current] {
    border-left: 3px solid ${({ theme }) => theme.colors.primary};
    padding-left: ${({ theme }) => theme.space(2)};
  }
`

const Note = styled.span`
  display: block;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.875rem;
`

const Danger = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  padding-top: ${({ theme }) => theme.space(3)};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 0.9375rem;
`
