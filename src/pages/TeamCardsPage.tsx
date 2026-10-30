import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { CardSheet } from '../cards/CardSheet.tsx'
import { describeSlots, PAPER_WIDTH } from '../cards/describe.ts'
import { fillProfileCard } from '../cards/edits.ts'
import type { FilledCard } from '../cards/fill.ts'
import { fetchCard } from '../cards/load.ts'
import { PrintStyle } from '../cards/PrintStyle.tsx'
import { profileTemplates } from '../cards/templates/index.ts'
import type { CardTemplate } from '../cards/types.ts'
import { BackLink, Button, ErrorText, Muted, Row } from '../components/ui.tsx'
import { api, type ClubTeam, errorText } from '../lib/api.ts'
import { resolveProfile } from '../lib/profiles.ts'
import { conventionPath, sectionPath } from '../lib/sections.ts'
import { pairName } from '../lib/teams.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { useContent } from '../state/ContentContext.tsx'
import { CardTabs } from './CardOutputs.tsx'
import { Head, Main, SheetScroll } from './CardSnapshotPage.tsx'
import { cardStrings as t } from './cardStrings.ts'
import { Frame, Gate } from './Frame.tsx'

/**
 * 全隊制度卡 (/teams/:id/cards/:templateId, E3 e3-t11): every partnership's card of a team on one
 * page, one after another, to print in one go. A partnership whose profile the member may not
 * read is counted, not shown. Each card is filled as its own card page fills it (with the hand
 * edits of every layer), read-only here.
 */
export function TeamCardsPage() {
  const { id = '', templateId = profileTemplates[0]!.id } = useParams()
  // The Brown Sticker forms are one per convention: printed from each pair's own card page
  const template = profileTemplates.find((x) => x.id === templateId)
  return (
    <Frame wide>
      <Main id="main">
        <Gate need="member">
          {template ? (
            <TeamCards key={`${id}/${template.id}`} teamId={id} template={template} />
          ) : (
            <ErrorText role="alert">{t.notFound}</ErrorText>
          )}
        </Gate>
      </Main>
    </Frame>
  )
}

interface PairCard {
  pairId: string
  name: string
  profileId: string
  card: FilledCard
}

type Loaded = { team: ClubTeam; cards: PairCard[]; hidden: number } | { error: string }

function TeamCards({ teamId, template }: { teamId: string; template: CardTemplate }) {
  const content = useContent()
  const loadAll = useRef(content.loadAll)
  useEffect(() => {
    loadAll.current = content.loadAll
  })
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    let current = true
    void (async () => {
      try {
        const [{ team, pairs }, members] = await Promise.all([
          api.club.team(teamId),
          api.club.members(),
        ])
        const cards: PairCard[] = []
        let hidden = 0
        for (const pair of pairs) {
          if (!pair.profileId) continue
          const got = await fetchCard(pair.profileId, loadAll.current)
          if ('error' in got) {
            hidden++
            continue
          }
          const profile = got.chain[got.chain.length - 1]!
          const resolution = resolveProfile(got.chain, profile.id, got.content)
          cards.push({
            pairId: pair.id,
            name: pairName(members, pair.userIds),
            profileId: profile.id,
            card: fillProfileCard(template, resolution),
          })
        }
        if (current) setLoaded({ team, cards, hidden })
      } catch (e) {
        if (current) setLoaded({ error: errorText(e) })
      }
    })()
    return () => {
      current = false
    }
  }, [teamId, template])

  const slots = useMemo(() => describeSlots(template), [template])
  const name = template.nameZh ?? template.name
  usePageTitle(loaded && 'team' in loaded ? t.team.title(loaded.team.name) : t.title)
  const sourceLink = useCallback(
    (source: { slug: string; sectionId?: string }) => ({
      to: source.sectionId
        ? sectionPath(source.slug, source.sectionId)
        : conventionPath(source.slug),
      name: content.bySlug(source.slug)?.nameZh ?? source.slug,
    }),
    [content],
  )

  if (!loaded) return <Muted role="status">{t.team.loading}</Muted>
  if ('error' in loaded) return <ErrorText role="alert">{loaded.error}</ErrorText>
  const { team, cards, hidden } = loaded

  return (
    <>
      <PrintStyle template={template} />
      <Head data-print="hide">
        <h1>{t.team.title(team.name)}</h1>
        <BackLink to={`/teams/${encodeURIComponent(team.id)}`}>{t.team.back}</BackLink>
        <CardTabs
          current={template.id}
          to={(x) => `/teams/${encodeURIComponent(team.id)}/cards/${x}`}
        />
        <Muted>{t.team.intro}</Muted>
        {hidden > 0 && <Muted>{t.team.hidden(hidden)}</Muted>}
        <Row>
          <Button
            type="button"
            $variant="primary"
            disabled={!cards.length}
            onClick={() => window.print()}
          >
            {t.team.print}
          </Button>
        </Row>
        <Muted>{t.printHint(template.paper)}</Muted>
      </Head>
      {cards.length === 0 ? (
        <Muted>{t.team.none}</Muted>
      ) : (
        cards.map((c) => (
          <Set key={c.pairId} data-card-set aria-labelledby={`team-card-${c.pairId}`}>
            <Row data-print="hide">
              <h2 id={`team-card-${c.pairId}`}>{t.team.pair(c.name)}</h2>
              <Link to={`/cards/${encodeURIComponent(c.profileId)}/${template.id}`}>
                {t.team.open}
              </Link>
            </Row>
            <SheetScroll
              aria-label={`${name} · ${c.name}`}
              role="region"
              tabIndex={0}
              data-card-scroll
            >
              <div style={{ width: `${PAPER_WIDTH[template.paper]}pt`, margin: '0 auto' }}>
                <CardSheet
                  template={template}
                  card={c.card}
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
          </Set>
        ))
      )}
    </>
  )
}

const Set = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};

  h2 {
    margin: 0;
    font-size: 1.125rem;
  }
`
