import { Dumbbell, Pencil, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import styled, { useTheme } from 'styled-components'
import { CopyLinkButton, IconButton } from '../components/CopyLinkButton.tsx'
import { KindLevel } from '../components/KindLevel.tsx'
import { Badge } from '../components/PendingNote.tsx'
import { OriginMark, ProfileNotes } from '../components/ProfileMarks.tsx'
import { PrintConventionStyle } from '../components/PrintSheet.tsx'
import { ReadingSettingsButton, type ReadingActions } from '../components/ReadingSettingsButton.tsx'
import { SectionAccordion } from '../components/SectionAccordion.tsx'
import { CardPlacesContext, SectionCardPlaces } from '../cards/placesContext.tsx'
import { RichText } from '../components/Suit.tsx'
import { Tag, TagList } from '../components/Tag.tsx'
import { GlossaryProvider } from '../glossary/GlossaryProvider.tsx'
import { basicHiddenIds } from '../lib/levels.ts'
import { practicePath, hasQuestions } from '../lib/quiz.ts'
import { FollowButton } from '../components/FollowButton.tsx'
import { sectionNumber } from '../lib/sectionNumber.ts'
import {
  allKeys,
  conventionDomId,
  conventionKey,
  conventionPath,
  findSectionPath,
  pendingPath,
  sectionDomId,
  sectionKey,
  sectionPath,
} from '../lib/sections.ts'
import { toolbarEvents } from '../lib/toolbar.ts'
import { useMediaQuery } from '../lib/useMediaQuery.ts'
import { usePageTitle } from '../lib/usePageTitle.ts'
import { pageStrings } from '../pageStrings.ts'
import type { ResolvedConvention } from '../lib/profiles.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { useContent, useConvention } from '../state/ContentContext.tsx'
import { useExpansion } from '../state/ExpansionContext.tsx'
import { useProfiles } from '../state/ProfileContext.tsx'
import { strings } from '../strings.ts'
import { layout, mobileQuery } from '../styles/tokens.ts'
import type { ConventionKind, ConventionMeta } from '../types/convention.ts'
import { usePreferences } from '../state/PreferencesContext.tsx'
import { HomePage } from './HomePage.tsx'
import { NotFound, useOnlineNote } from './HandbookShell.tsx'

/** Wide enough for the 本頁 column beside the text (DESIGN-V2.md §4) */
const wideQuery = `(min-width: ${layout.wideBreakpoint})`
/** 三欄閱讀 keeps it there from tablet width (e9-t15) */
const tabletQuery = `(min-width: calc(${layout.mobileBreakpoint} + 1px))`

/**
 * One convention on its own page (e9-t04), laid out like a page of a book (e9-t05, DESIGN-V2.md
 * §5.4): the catalogue on the left (HandbookShell), the text in the middle — where it sits in the
 * book, the title with its kind and level, the summary, the numbered sections, source and last
 * check, the neighbouring conventions — and 本頁 on the right: the sections and 閱讀設定. Below
 * 1100px the right column folds into a 本頁 list above the text.
 *
 * /c/:slug/:sectionId also opens the path down to that section, scrolls to it and focuses its
 * heading; ?pending=k picks the k-th 待確認 note of the section. The top-level sections start
 * open, the deeper ones closed. Loaded lazily, so the home page carries none of this code.
 */
export function ConventionPage() {
  const { bySlug, categories, conventions } = useContent()
  const { can } = useAuth()
  const { activeId } = useProfiles()
  const { slug = '', sectionId } = useParams()
  const [searchParams] = useSearchParams()
  const pendingIndex = searchParams.get('pending')
  const { open, close } = useExpansion()
  const onlineNote = useOnlineNote()
  // 版面 (e9-t15): 專注單欄 and 卡片總覽 fold 本頁 above the text like a narrow screen
  const { layout: shell, reading } = usePreferences()
  const roomy = useMediaQuery(wideQuery)
  const tablet = useMediaQuery(tabletQuery)
  const wide = shell === 'three' ? tablet : shell === 'whole' && roomy
  // Phones open 本頁 from the bottom toolbar instead of the list above the text (e9-t09)
  const phone = useMediaQuery(mobileQuery)
  const heading = useRef<HTMLHeadingElement>(null)

  const convention = bySlug(slug)
  // The convention's content: the scroll waits for it, as the section is not there before
  const target = useConvention(convention ? slug : undefined)
  const loaded = target.convention
  const ready = Boolean(loaded) || target.failed
  // 練這個特約 (e6-t09): only when the convention has a table questions can be made from
  const practice = useMemo(() => Boolean(loaded && hasQuestions(loaded)), [loaded])
  // 在制度卡的位置 (e3-t10): the cells this convention fills on the reader's profile's cards
  const cardPlaces = useMemo(
    () => ({
      cardSlots: loaded?.cardSlots,
      profileId: activeId,
      ...(loaded && { slug: loaded.slug, brownSticker: loaded.brownSticker }),
    }),
    [loaded, activeId],
  )
  const path = convention && sectionId ? findSectionPath(convention, sectionId) : []
  // 入門版 (e4-t02): 「這頁顯示全部」 shows this convention in full until the reader moves on; a link
  // to a section 入門版 hides shows the page in full too, or there would be nothing to scroll to
  const [shownAll, setShownAll] = useState<string | null>(null)
  if (
    reading === 'basic' &&
    loaded &&
    sectionId &&
    shownAll !== slug &&
    basicHiddenIds(loaded.sections, convention?.level).has(sectionId)
  )
    setShownAll(slug)
  const basic = reading === 'basic' && shownAll !== slug
  usePageTitle(convention?.nameZh)

  // Arriving at a convention opens its top-level sections. It depends on the manifest entry,
  // which stays the same object while other conventions load.
  useEffect(() => {
    if (!convention) return
    open([
      conventionKey(convention.slug),
      ...convention.outline.map((s) => sectionKey(convention.slug, s.id)),
    ])
  }, [open, convention])

  // A link to a section opens the path down to it at once; the scroll below waits for the content
  useEffect(() => {
    if (!convention || !sectionId) return
    open(findSectionPath(convention, sectionId).map((s) => sectionKey(convention.slug, s.id)))
  }, [sectionId, open, convention])

  useEffect(() => {
    if (!convention || !ready) return
    const trail = sectionId ? findSectionPath(convention, sectionId) : []
    const toSection = Boolean(sectionId && trail.length)
    // Wait one frame so the newly opened content has its height before scrolling
    const frame = window.requestAnimationFrame(() => {
      if (!toSection) {
        // A new convention starts at the top, like turning to a new page
        document.scrollingElement?.scrollTo?.({ top: 0 })
        heading.current?.focus({ preventScroll: true })
        return
      }
      const el = document.getElementById(sectionDomId(convention.slug, sectionId!))
      // ?pending=k points at the k-th 待確認 note that belongs directly to the section
      // (notes inside its child sections belong to those children)
      const note =
        el && pendingIndex !== null
          ? [...el.querySelectorAll<HTMLElement>('[data-pending]')].filter(
              (n) => n.parentElement?.closest('[data-section]') === el,
            )[Number(pendingIndex)]
          : undefined
      ;(note ?? el)?.scrollIntoView?.({ block: note ? 'center' : 'start', behavior: 'smooth' })
      el?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true })
      note?.animate?.(
        [
          { outline: '3px solid currentColor', outlineOffset: '2px' },
          { outline: '3px solid transparent' },
        ],
        { duration: 1800, easing: 'ease-out' },
      )
    })
    return () => window.cancelAnimationFrame(frame)
  }, [sectionId, pendingIndex, convention, ready])

  if (!convention) return <HomePage notFound />

  const keys = allKeys(convention)
  const category = categories.find((c) => c.id === convention.category)
  const kind = (convention.kind ?? 'convention') as ConventionKind
  const order = categories.flatMap((c) => conventions.filter((x) => x.category === c.id))
  const at = order.findIndex((c) => c.slug === convention.slug)
  const previous = at > 0 ? order[at - 1] : undefined
  const next = at >= 0 ? order[at + 1] : undefined
  const online = onlineNote(convention.slug)
  const canEdit = can('bookEdit')
  const actions: ReadingActions = {
    onExpandAll: () => open(keys),
    onCollapseAll: () => close(keys.slice(1)),
    // Only this convention is on the page, so its content is there to print
    onPrint: () => window.print(),
  }
  const current = path[0]?.id

  return (
    <GlossaryProvider>
    <CardPlacesContext.Provider value={cardPlaces}>
    <Columns $wide={wide}>
      <PrintConventionStyle name={convention.nameZh} />
      <Article aria-labelledby={`${conventionDomId(convention.slug)}-title`}>
        <TopBar>
          <Trail aria-label={strings.pages.trail}>
            <Link to="/book">{strings.pages.book}</Link>
            {category && (
              <>
                <span aria-hidden> › </span>
                {category.label}
              </>
            )}
            <span aria-hidden> › </span>
            {strings.kinds[kind] ?? strings.kinds.convention}
          </Trail>
          {!wide && (
            <TopActions>
              <ReadingSettingsButton toolbar {...actions} />
            </TopActions>
          )}
        </TopBar>
        {sectionId && path.length === 0 && <NotFound role="alert">{strings.notFound}</NotFound>}
        {phone && <OnThisPagePopup convention={convention} current={current} />}
        {!wide && !phone && convention.outline.length > 1 && (
          <Fold data-print="hide">
            <summary>
              {pageStrings.onThisPage}
              <small>{pageStrings.sectionCount(convention.outline.length)}</small>
            </summary>
            <SectionList convention={convention} current={current} />
          </Fold>
        )}

        <TitleBlock id={conventionDomId(convention.slug)}>
          <TitleRow>
            <Title id={`${conventionDomId(convention.slug)}-title`} ref={heading} tabIndex={-1}>
              {convention.nameZh}
            </Title>
            <OriginMark origin={(convention as { origin?: ResolvedConvention['origin'] }).origin} />
            <TitleTools data-print="hide">
              {canEdit && (
                <EditLink
                  as={Link}
                  to={`/edit/${convention.slug}`}
                  aria-label={strings.online.edit(convention.nameZh)}
                  title={strings.online.edit(convention.nameZh)}
                >
                  <Pencil size={16} aria-hidden />
                </EditLink>
              )}
              <CopyLinkButton path={conventionPath(convention.slug)} label={convention.nameZh} />
            </TitleTools>
          </TitleRow>
          <NameEn lang="en">{convention.nameEn}</NameEn>
          <MetaRow>
            <KindLevel kind={convention.kind} level={convention.level} />
            {convention.tags.length > 0 && (
              <TagList aria-label="標籤">
                {convention.tags.map((t) => (
                  <Tag key={t} label={t} />
                ))}
              </TagList>
            )}
            {convention.pending.length > 0 && (
              <PendingLink
                to={pendingPath(
                  convention.slug,
                  convention.pending[0].sectionId,
                  convention.pending[0].index,
                )}
                title={strings.pendingJump}
              >
                {strings.pendingCount(convention.pending.length)}
              </PendingLink>
            )}
          </MetaRow>
        </TitleBlock>

        <Lede>
          <RichText text={convention.summary} />
        </Lede>
        <ProfileNotes slug={convention.slug} />
        <SectionCardPlaces target="*" />

        {loaded ? (
          <SectionAccordion
            slug={convention.slug}
            sections={loaded.sections}
            basic={basic}
            level={convention.level}
            onShowAll={() => setShownAll(convention.slug)}
          />
        ) : target.failed ? (
          <Loading role="alert">
            {strings.online.loadFailed}
            <RetryButton type="button" onClick={target.retry}>
              {strings.online.retry}
            </RetryButton>
          </Loading>
        ) : (
          <Loading role="status">{strings.loading}</Loading>
        )}

        {practice && (
          <Practice data-print="hide">
            <Link to={practicePath(convention.slug)}>
              <Dumbbell size={16} aria-hidden />
              {pageStrings.practice}
            </Link>
          </Practice>
        )}
        <FollowButton key={convention.slug} slug={convention.slug} />

        <Source>
          {strings.source}：{convention.source.title}
          {convention.source.note && `（${convention.source.note}）`}・{strings.updated}：
          {convention.updated}
          {online && `・${online}`}
        </Source>

        {(previous || next) && (
          <Neighbours aria-label={pageStrings.neighbours} data-print="hide">
            {previous ? (
              // The visible words are the link's name (WCAG 2.5.3); the arrows are decoration
              <Link to={conventionPath(previous.slug)}>
                <small>
                  <span aria-hidden>← </span>
                  {pageStrings.previous}
                </small>
                {previous.nameZh}
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link to={conventionPath(next.slug)} data-next>
                <small>
                  {pageStrings.next}
                  <span aria-hidden> →</span>
                </small>
                {next.nameZh}
              </Link>
            )}
          </Neighbours>
        )}
      </Article>

      {wide && (
        <Rail aria-label={pageStrings.onThisPage} data-print="hide">
          <RailHeading>{pageStrings.onThisPage}</RailHeading>
          <RailList>
            <SectionList convention={convention} current={current} />
          </RailList>
          <ReadingSettingsButton toolbar {...actions} />
        </Rail>
      )}
    </Columns>
    </CardPlacesContext.Provider>
    </GlossaryProvider>
  )
}

/** The top-level sections, numbered as in the text, each a deep link */
function SectionList({ convention, current }: { convention: ConventionMeta; current?: string }) {
  const theme = useTheme()
  return (
    <Sections>
      {convention.outline.map((s, i) => (
        <li key={s.id}>
          <Link
            to={sectionPath(convention.slug, s.id)}
            aria-current={s.id === current ? 'location' : undefined}
          >
            <span aria-hidden>{sectionNumber(theme.sectionNumbers, i + 1)}</span>
            {/* One flex item, or the title's text and suit symbols would each be a column */}
            <span>
              <RichText text={s.title} />
            </span>
          </Link>
        </li>
      ))}
    </Sections>
  )
}

/**
 * 本頁 on phones (DESIGN-V2.md §7): a list in the middle of the screen, opened by the bottom
 * toolbar. Esc, ×, the backdrop or choosing a section closes it; the focus goes back to the toolbar.
 */
function OnThisPagePopup({
  convention,
  current,
}: {
  convention: ConventionMeta
  current?: string
}) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const show = () => setOpen(true)
    window.addEventListener(toolbarEvents.onThisPage, show)
    return () => window.removeEventListener(toolbarEvents.onThisPage, show)
  }, [])
  useEffect(() => {
    if (open) box.current?.querySelector<HTMLElement>('a, button')?.focus()
  }, [open])

  if (!open) return null
  const close = () => {
    setOpen(false)
    document.querySelector<HTMLElement>('[data-toolbar="on-this-page"]')?.focus()
  }
  return (
    <>
      <PopupScrim aria-hidden onClick={close} />
      <Popup
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby="on-this-page-title"
        onKeyDown={(e) => e.key === 'Escape' && close()}
        onClick={(e) => (e.target as Element).closest('a') && close()}
      >
        <PopupHead>
          <h2 id="on-this-page-title">{pageStrings.onThisPage}</h2>
          <IconButton
            type="button"
            onClick={close}
            aria-label={pageStrings.toolbar.closeOnThisPage}
          >
            <X size={18} aria-hidden />
          </IconButton>
        </PopupHead>
        <SectionList convention={convention} current={current} />
      </Popup>
    </>
  )
}

const PopupScrim = styled.div`
  position: fixed;
  inset: 0;
  z-index: 60;
  background: ${({ theme }) => theme.colors.overlay};
`

const Popup = styled.div`
  position: fixed;
  z-index: 61;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(calc(100vw - ${({ theme }) => theme.space(8)}), 24rem);
  max-height: 70vh;
  overflow-y: auto;
  padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)}
    ${({ theme }) => theme.space(4)};
  border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.panel};
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: ${({ theme }) => theme.shadows.panel};

  a {
    min-height: 44px;
  }
`

const PopupHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.space(2)};
  h2 {
    margin: 0;
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: 1.0625rem;
  }
`

/** Text and 本頁 side by side; the text keeps a book's measure (about 44rem) */
const Columns = styled.div<{ $wide: boolean }>`
  display: grid;
  grid-template-columns: ${({ $wide }) => ($wide ? 'minmax(0, 44rem) 13rem' : 'minmax(0, 44rem)')};
  gap: ${({ theme }) => theme.space(8)};
  align-items: start;

  @media print {
    grid-template-columns: 1fr;
  }
`

const Article = styled.article`
  min-width: 0;
`

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(3)};
  min-height: 36px;
  margin-bottom: ${({ theme }) => theme.space(3)};
`

const TopActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
`

const Trail = styled.nav`
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textMuted};

  a {
    color: ${({ theme }) => theme.colors.primary};
  }
`

const TitleBlock = styled.header`
  padding-bottom: ${({ theme }) => theme.space(3)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.accent};
  scroll-margin-top: calc(${({ theme }) => theme.layout.headerHeight} + 16px);
`

const TitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
`

const Title = styled.h1`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 2rem;
  font-weight: ${({ theme }) => theme.headingWeight};
  line-height: 1.25;
  color: ${({ theme }) => theme.colors.primaryStrong};
  outline: none;
`

const TitleTools = styled.span`
  display: inline-flex;
  margin-left: auto;
`

const EditLink = styled(IconButton)`
  text-decoration: none;
`

const NameEn = styled.p`
  margin: ${({ theme }) => theme.space(1)} 0 ${({ theme }) => theme.space(2)};
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: ${({ theme }) => theme.colors.textMuted};
`

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
`

const PendingLink = styled(Badge).attrs({ as: Link })`
  text-decoration: none;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    filter: brightness(0.92);
    text-decoration: underline;
  }
`

const Lede = styled.p`
  margin: ${({ theme }) => theme.space(4)} 0 ${({ theme }) => theme.space(6)};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.75;
`

const Loading = styled.p`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  color: ${({ theme }) => theme.colors.textMuted};
`

const RetryButton = styled.button`
  min-height: 36px;
  padding: 0 ${({ theme }) => theme.space(3)};
  border: ${({ theme }) => theme.borders.control} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
`

const Practice = styled.p`
  margin: ${({ theme }) => theme.space(8)} 0 0;

  a {
    display: inline-flex;
    align-items: center;
    gap: ${({ theme }) => theme.space(2)};
    min-height: 44px;
    padding: 0 ${({ theme }) => theme.space(4)};
    border: ${({ theme }) => theme.borders.control} ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.shape.control};
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.primaryStrong};
    font-weight: 600;
    text-decoration: none;
  }
  a:hover {
    border-color: ${({ theme }) => theme.colors.structure};
  }
`

const Source = styled.p`
  margin: ${({ theme }) => theme.space(10)} 0 0;
  padding-top: ${({ theme }) => theme.space(3)};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Neighbours = styled.nav`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(4)};
  margin-top: ${({ theme }) => theme.space(6)};

  a {
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.space(0.5)};
    max-width: 48%;
    min-height: 44px;
    padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.shape.control};
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
    text-decoration: none;
  }
  a[data-next] {
    margin-left: auto;
    text-align: right;
  }
  a:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
  small {
    font-size: 0.75rem;
    font-weight: 400;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

const Rail = styled.aside`
  position: sticky;
  top: calc(${({ theme }) => theme.layout.headerHeight} + ${({ theme }) => theme.space(6)});
  max-height: calc(
    100vh - ${({ theme }) => theme.layout.headerHeight} - ${({ theme }) => theme.space(12)}
  );
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space(4)};
  padding-left: ${({ theme }) => theme.space(4)};
  border-left: 1px solid ${({ theme }) => theme.colors.border};
`

/**
 * Only the list scrolls when it is longer than the screen: a scrolling rail would also clip the
 * 閱讀設定 panel, which is wider than the rail and opens out of it
 */
const RailList = styled.div`
  align-self: stretch;
  min-height: 0;
  overflow-y: auto;
`

const RailHeading = styled.h2`
  margin: 0;
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 0.9375rem;
  font-weight: ${({ theme }) => theme.headingWeight};
`

const Sections = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space(0.5)};
  margin: 0;
  padding: 0;
  list-style: none;

  a {
    display: flex;
    gap: ${({ theme }) => theme.space(1.5)};
    padding: ${({ theme }) => theme.space(1)} 0;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.875rem;
    line-height: 1.5;
    text-decoration: none;
  }
  a > span:first-child {
    flex: none;
    min-width: 1.75em;
    color: ${({ theme }) => theme.colors.structure};
    font-variant-numeric: tabular-nums;
  }
  a:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
  a[aria-current] {
    color: ${({ theme }) => theme.colors.seal};
    font-weight: 600;
  }
`

/** 本頁 above the text when there is no room for the column */
const Fold = styled.details`
  margin-bottom: ${({ theme }) => theme.space(4)};
  padding: ${({ theme }) => theme.space(2)} ${({ theme }) => theme.space(3)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.control};
  background: ${({ theme }) => theme.colors.surface};

  summary {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.space(2)};
    min-height: 32px;
    font-weight: 600;
    cursor: pointer;
  }
  small {
    font-weight: 400;
    color: ${({ theme }) => theme.colors.textMuted};
  }
  ol {
    margin-top: ${({ theme }) => theme.space(2)};
  }
`
