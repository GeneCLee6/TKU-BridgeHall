import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import type { CardFont } from '../cards/docx.ts'
import type { FilledCard } from '../cards/fill.ts'
import { blobBase64 } from '../cards/load.ts'
import { profileTemplates } from '../cards/templates/index.ts'
import type { CardTemplate } from '../cards/types.ts'
import { Button, ErrorText, Field, Input, Muted, Row, Select } from '../components/ui.tsx'
import { type CardSnapshotMeta, errorText, type SystemProfile } from '../lib/api.ts'
import { cardApi } from '../lib/cardApi.ts'
import { formatDateTime } from '../lib/format.ts'
import { makeDocx, snapshotPath } from './cardOutput.ts'
import { cardStrings as t } from './cardStrings.ts'

/** 下載 Word (e3-t08, AC-3.5): the WBF card also in Gill Sans, as on the CTCBA download page */
export function WordDownload({
  template,
  card,
  profileName,
  version,
}: {
  template: CardTemplate
  card: FilledCard
  profileName: string
  version?: number
}) {
  const [font, setFont] = useState<CardFont>('arial')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const download = async () => {
    setBusy(true)
    setError('')
    try {
      const blob = await makeDocx(template, card, profileName, font)
      const m = await import('../cards/docx.ts')
      m.downloadBlob(blob, m.cardFileName(template, profileName, font, version))
    } catch (e) {
      setError(`${t.word.failed}${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      {template.id === 'wbf' && (
        <Field>
          {t.word.font}
          <Select value={font} onChange={(e) => setFont(e.target.value as CardFont)}>
            {(Object.keys(t.word.fonts) as CardFont[]).map((f) => (
              <option key={f} value={f}>
                {t.word.fonts[f]}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Button
        type="button"
        onClick={() => void download()}
        disabled={busy}
        aria-describedby="card-word-hint"
      >
        {busy ? t.word.making : t.word.download}
      </Button>
      <span id="card-word-hint" className="visually-hidden">
        {t.word.hint}
      </span>
      {error && <ErrorText role="alert">{error}</ErrorText>}
    </>
  )
}

/**
 * The template tabs of a card page: `to` gives each tab's address from its key, a template id or,
 * for a Brown Sticker form, `<template id>/<convention slug>` (`forms`, after the cards)
 */
export function CardTabs({
  current,
  to,
  forms = [],
}: {
  current: string
  to: (key: string) => string
  forms?: { key: string; label: string }[]
}) {
  const tabs = [...profileTemplates.map((x) => ({ key: x.id as string, label: x.nameZh ?? x.name })), ...forms]
  return (
    <nav aria-label={t.templates}>
      <Tabs>
        {tabs.map((x) => (
          <li key={x.key}>
            <Tab to={to(x.key)} aria-current={x.key === current ? 'page' : undefined}>
              {x.label}
            </Tab>
          </li>
        ))}
      </Tabs>
    </nav>
  )
}

/**
 * 版本與分享 (e3-t09, AC-3.7): this card's published versions, newest first, each with a link to
 * read it, the share switch and delete; and, for whoever may save the profile, publishing the card
 * as it is now (with its Word file). Unsaved hand edits are saved first.
 */
export function CardVersions({
  template,
  profile,
  card,
  signedIn,
  canPublish,
  canShare,
  dirty,
}: {
  template: CardTemplate
  profile: SystemProfile
  card: FilledCard
  signedIn: boolean
  canPublish: boolean
  canShare: boolean
  dirty: boolean
}) {
  const [list, setList] = useState<CardSnapshotMeta[] | null>(null)
  const [loadError, setLoadError] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<number | null>(null)

  const load = useCallback(
    () =>
      cardApi.list(profile.id).then(
        (snapshots) => {
          setList(snapshots)
          setLoadError('')
        },
        (e) => setLoadError(errorText(e)),
      ),
    [profile.id],
  )
  useEffect(() => {
    if (!signedIn) return
    let current = true
    cardApi.list(profile.id).then(
      (snapshots) => current && setList(snapshots),
      (e) => current && setLoadError(errorText(e)),
    )
    return () => {
      current = false
    }
  }, [signedIn, profile.id])

  const mine = (list ?? []).filter((s) => s.templateId === template.id)

  const publish = async () => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const docx = await blobBase64(await makeDocx(template, card, profile.name))
      const snapshot = await cardApi.publish(profile.id, {
        templateId: template.id,
        profileVersion: profile.version,
        ...(note.trim() && { note: note.trim() }),
        card: card as unknown as Record<string, unknown>,
        docx,
      })
      setNote('')
      setNotice(t.versions.published(snapshot.n))
      await load()
    } catch (e) {
      setError(errorText(e))
    } finally {
      setBusy(false)
    }
  }

  const act = async (fn: () => Promise<unknown>) => {
    setError('')
    try {
      await fn()
      await load()
    } catch (e) {
      setError(errorText(e))
    }
  }

  const copy = async (s: CardSnapshotMeta) => {
    try {
      await navigator.clipboard.writeText(
        new URL(snapshotPath(s), window.location.origin).toString(),
      )
      setCopied(s.n)
      window.setTimeout(() => setCopied(null), 2000)
    } catch {
      // The link is on screen to copy by hand
    }
  }

  return (
    <Box data-print="hide">
      <summary>
        {t.versions.title}
        {mine.length > 0 && `（${mine.length}）`}
      </summary>
      <Muted>{t.versions.intro}</Muted>
      {!signedIn ? (
        <Muted>{t.versions.signIn}</Muted>
      ) : (
        <>
          {canPublish ? (
            dirty ? (
              <Muted>{t.versions.dirty}</Muted>
            ) : (
              <Row>
                <Field>
                  {t.versions.note}
                  <Input value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} />
                </Field>
                <Button
                  type="button"
                  $variant="primary"
                  disabled={busy}
                  onClick={() => void publish()}
                >
                  {busy ? t.versions.publishing : t.versions.publish}
                </Button>
              </Row>
            )
          ) : (
            <Muted>{t.versions.readOnly}</Muted>
          )}
          <Muted role="status">{notice}</Muted>
          {error && <ErrorText role="alert">{error}</ErrorText>}
          {loadError ? (
            <ErrorText role="alert">
              {t.versions.failed}
              {loadError}
            </ErrorText>
          ) : !list ? (
            <Muted role="status">{t.versions.loading}</Muted>
          ) : mine.length === 0 ? (
            <Muted>{t.versions.none}</Muted>
          ) : (
            <Versions aria-label={t.versions.title}>
              {mine.map((s) => (
                <li key={s.n}>
                  <Row>
                    <Link to={snapshotPath(s)}>{t.versions.version(s.n)}</Link>
                    <Muted>
                      {t.versions.meta(formatDateTime(s.at), s.byName ?? s.by, s.profileVersion)}
                      {s.note && ` · ${s.note}`}
                    </Muted>
                    {s.shared && <SharedMark>{t.versions.shared}</SharedMark>}
                  </Row>
                  <Row>
                    {canShare && (
                      <label>
                        <input
                          type="checkbox"
                          checked={s.shared}
                          aria-label={t.versions.shareOf(s.n)}
                          onChange={(e) =>
                            void act(() =>
                              cardApi.share(s.profileId, s.templateId, s.n, e.target.checked),
                            )
                          }
                        />{' '}
                        {t.versions.share}
                      </label>
                    )}
                    {s.shared && (
                      <>
                        <LinkText>
                          {new URL(snapshotPath(s), window.location.origin).toString()}
                        </LinkText>
                        <Button type="button" $small onClick={() => void copy(s)}>
                          {copied === s.n ? t.versions.copied : t.versions.copy}
                        </Button>
                      </>
                    )}
                    {canPublish && (
                      <Button
                        type="button"
                        $small
                        $variant="ghost"
                        aria-label={t.versions.deleteOf(s.n)}
                        onClick={() => {
                          if (window.confirm(t.versions.confirmDelete(s.n)))
                            void act(() => cardApi.remove(s.profileId, s.templateId, s.n))
                        }}
                      >
                        {t.versions.delete}
                      </Button>
                    )}
                  </Row>
                </li>
              ))}
            </Versions>
          )}
        </>
      )}
    </Box>
  )
}

const Box = styled.details`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  max-width: 80rem;
  padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)};
  border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.panel};
  background: ${({ theme }) => theme.colors.surface};

  summary {
    cursor: pointer;
    font-weight: 600;
  }
  &[open] > * + * {
    margin-top: ${({ theme }) => theme.space(2)};
  }
`

const Versions = styled.ul`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: grid;
    gap: ${({ theme }) => theme.space(1)};
    padding-top: ${({ theme }) => theme.space(2)};
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }
`

const SharedMark = styled.span`
  color: ${({ theme }) => theme.colors.primaryStrong};
  font-size: 0.8125rem;
  font-weight: 600;
`

const LinkText = styled.code`
  font-size: 0.75rem;
  overflow-wrap: anywhere;
`

const Tabs = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(1)};
  margin: 0;
  padding: 0;
  list-style: none;
`

const Tab = styled(Link)`
  display: inline-block;
  padding: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(3)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.control};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.9375rem;
  text-decoration: none;

  &[aria-current='page'] {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.onPrimary};
    font-weight: 600;
  }
`
