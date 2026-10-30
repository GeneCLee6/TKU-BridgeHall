import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { CardSheet } from '../cards/CardSheet.tsx'
import { describeSlots, PAPER_WIDTH } from '../cards/describe.ts'
import type { FilledCard } from '../cards/fill.ts'
import { PrintStyle } from '../cards/PrintStyle.tsx'
import { slotSpaces } from '../cards/fill.ts'
import { cardTemplates } from '../cards/templates/index.ts'
import { Button, ErrorText, Muted, Row } from '../components/ui.tsx'
import { ApiError, type CardSnapshot, errorText } from '../lib/api.ts'
import { cardApi, cardSnapshotPath } from '../lib/cardApi.ts'
import { formatDateTime } from '../lib/format.ts'
import { conventionPath, sectionPath } from '../lib/sections.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { useContent } from '../state/ContentContext.tsx'
import { mobile } from '../styles/tokens.ts'
import { PdfDownload, WordDownload } from './CardOutputs.tsx'
import { cardStrings as t } from './cardStrings.ts'
import { Frame } from './Frame.tsx'

/**
 * A published convention card version (/cards/:profileId/:templateId/v/:n, E3 e3-t09, AC-3.7):
 * the card as it was filled when it was published, read-only, with the Word file kept then. Read
 * by whoever may read the profile, or by anyone while the version is shared (the Worker answers
 * a shared version before asking who is signed in).
 */
export function CardSnapshotPage() {
  const { profileId = '', templateId = '', n = '' } = useParams()
  return (
    <Frame wide>
      <Main id="main">
        <Snapshot
          key={`${profileId}/${templateId}/${n}`}
          profileId={profileId}
          templateId={templateId}
          n={Number(n)}
        />
      </Main>
    </Frame>
  )
}

function Snapshot({
  profileId,
  templateId,
  n,
}: {
  profileId: string
  templateId: string
  n: number
}) {
  const { user } = useAuth()
  const { bySlug } = useContent()
  const [loaded, setLoaded] = useState<CardSnapshot | { error: string; status?: number } | null>(
    null,
  )
  const template = cardTemplates.find((x) => x.id === templateId)

  useEffect(() => {
    let current = true
    cardApi.get(profileId, templateId, n).then(
      (snapshot) => current && setLoaded(snapshot),
      (e) =>
        current &&
        setLoaded({ error: errorText(e), ...(e instanceof ApiError && { status: e.status }) }),
    )
    return () => {
      current = false
    }
  }, [profileId, templateId, n])

  const snapshot = loaded && 'card' in loaded ? loaded : undefined
  const card = snapshot?.card as unknown as FilledCard | undefined
  const slots = useMemo(() => (template ? describeSlots(template) : undefined), [template])
  // A template changed since: some of the version's cells are not on the form any more
  const changed = useMemo(() => {
    if (!template || !card?.cells) return false
    const spaces = slotSpaces(template)
    return Object.keys(card.cells).some((slot) => !spaces.has(slot))
  }, [template, card])
  const name = template ? (template.nameZh ?? template.name) : t.title
  usePageTitle(
    snapshot ? t.snapshot.pageTitle(name, snapshot.profileName, snapshot.n) : t.snapshot.title(n),
  )

  const sourceLink = useCallback(
    (source: { slug: string; sectionId?: string }) => ({
      to: source.sectionId
        ? sectionPath(source.slug, source.sectionId)
        : conventionPath(source.slug),
      name: bySlug(source.slug)?.nameZh ?? source.slug,
    }),
    [bySlug],
  )

  if (!loaded) return <Muted role="status">{t.snapshot.loading}</Muted>
  if (!snapshot || !template || !card || !slots) {
    const status = loaded && 'status' in loaded ? loaded.status : undefined
    return (
      <Head>
        <h1>{t.snapshot.title(n)}</h1>
        <ErrorText role="alert">
          {!template
            ? t.notFound
            : status === 404
              ? t.snapshot.gone
              : status === 401 || status === 403
                ? t.snapshot.signIn
                : 'error' in loaded
                  ? loaded.error
                  : ''}
        </ErrorText>
        {!user && (status === 401 || status === 403) && <Link to="/login">{t.edit.signIn}</Link>}
      </Head>
    )
  }

  return (
    <>
      <PrintStyle template={template} />
      <Head data-print="hide">
        <h1>
          {name} · {snapshot.profileName} · {t.versions.version(snapshot.n)}
        </h1>
        <Muted>
          {t.versions.meta(
            formatDateTime(snapshot.at),
            snapshot.byName ?? snapshot.by,
            snapshot.profileVersion,
          )}
          {snapshot.note && ` · ${snapshot.note}`}
        </Muted>
        <Muted>{t.snapshot.readOnly}</Muted>
        <Muted>{snapshot.shared ? t.snapshot.shared : t.snapshot.private}</Muted>
        {changed && <ErrorText>{t.snapshot.templateChanged}</ErrorText>}
        <Row>
          <Button type="button" onClick={() => window.print()}>
            {t.print}
          </Button>
          <PdfDownload template={template} profileName={snapshot.profileName} version={snapshot.n} />
          {snapshot.docx && (
            <a
              href={`${cardSnapshotPath(snapshot.profileId, snapshot.templateId, snapshot.n)}/docx`}
              download
            >
              {t.snapshot.storedWord}
            </a>
          )}
          <WordDownload
            template={template}
            card={card}
            profileName={snapshot.profileName}
            version={snapshot.n}
          />
          {user && (
            <Link to={`/cards/${encodeURIComponent(snapshot.profileId)}/${template.id}`}>
              {t.snapshot.current}
            </Link>
          )}
        </Row>
        <Muted id="card-pdf-hint">{t.pdfHint(template.paper)}</Muted>
      </Head>
      <SheetScroll aria-label={name} role="region" tabIndex={0} data-card-scroll>
        <div style={{ width: `${PAPER_WIDTH[template.paper]}pt`, margin: '0 auto' }}>
          <CardSheet
            template={template}
            card={card}
            slots={slots}
            sourceLink={sourceLink}
            labels={{
              toSection: t.toSection,
              notes: t.notesTitle[template.language],
              pending: t.pending,
            }}
          />
        </div>
      </SheetScroll>
    </>
  )
}

export const Main = styled.main`
  display: grid;
  gap: ${({ theme }) => theme.space(4)};
  padding: ${({ theme }) => theme.space(5)} ${({ theme }) => theme.space(5)}
    ${({ theme }) => theme.space(12)};

  ${mobile} {
    padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)}
      ${({ theme }) => theme.space(12)};
  }
`

export const Head = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  max-width: 80rem;

  h1 {
    margin: 0;
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: 1.5rem;
  }
`

/** Scrolls sideways on a narrow screen; positioned for the .visually-hidden inside (CLAUDE.md) */
export const SheetScroll = styled.div`
  position: relative;
  overflow-x: auto;
  padding: ${({ theme }) => theme.space(4)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.panel};
  background: ${({ theme }) => theme.colors.surfaceAlt};

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.structure};
  }

  [data-card-paper] {
    box-shadow: ${({ theme }) => theme.shadows.panel};
  }
`
