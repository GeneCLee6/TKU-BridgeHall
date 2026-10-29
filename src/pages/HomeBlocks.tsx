import { BookOpen, Dumbbell, Library, LogIn } from 'lucide-react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Button } from '../components/ui.tsx'
import { today } from '../lib/format.ts'
import { conventionPath } from '../lib/sections.ts'
import { pageStrings } from '../pageStrings.ts'
import { useAuth } from '../state/AuthContext.tsx'
import { useContent } from '../state/ContentContext.tsx'
import { useProfiles } from '../state/ProfileContext.tsx'
import { strings } from '../strings.ts'

/**
 * The home page's blocks that are not the categories (e9-t08, DESIGN-V2 §5.3): the reader's
 * system profile, 第一次來 and 最近更新. Loaded after the home page itself, which has a JS budget
 * (scripts/check-budget.mjs); HomePage keeps room for them so the page does not jump.
 */

const s = pageStrings.home

/** 第一次來: the conventions a newcomer reads first, in order (only those the profile plays show) */
const FIRST_STEPS = ['system-overview', 'notrump-responses', 'defensive-signals']

/** How many changes 最近更新 lists */
const RECENT = 5

const date = (ms: number) => today(new Date(ms))

/** 我的制度集: the profile the handbook shows; signed out, the club's and a way to sign in */
export function ProfileCard() {
  const { user } = useAuth()
  const { list, activeId } = useProfiles()
  const profile = list.find((p) => p.id === activeId)
  const parent = profile?.parentId ? list.find((p) => p.id === profile.parentId) : undefined

  return (
    <Card aria-labelledby="home-profile">
      <div>
        <Eyebrow>{s.profileEyebrow(strings.profiles.scopes[profile?.scope ?? 'club'])}</Eyebrow>
        <Name id="home-profile">{profile?.name ?? s.clubName}</Name>
        {profile ? (
          <Facts>
            {parent && (
              <li>
                {s.inherits} <b>{parent.name}</b>
              </li>
            )}
            <li>{s.adopted(profile.counts.adopted)}</li>
            <li>{s.overrides(profile.counts.overrides)}</li>
            <li>{s.notes(profile.counts.notes)}</li>
            <li>{s.lastUpdated(date(profile.updatedAt), profile.updatedBy)}</li>
          </Facts>
        ) : (
          user === null && <Note>{s.signedOutNote}</Note>
        )}
      </div>
      <Actions>
        <Button as={Link} to="/book" $small $variant="primary">
          <BookOpen size={16} aria-hidden />
          {s.read}
        </Button>
        <Button as={Link} to="/practice" $small>
          <Dumbbell size={16} aria-hidden />
          {s.practice}
        </Button>
        <Button as={Link} to="/library" $small>
          <Library size={16} aria-hidden />
          {s.library}
        </Button>
        {user === null && (
          <Button as={Link} to="/login?next=%2F" $small>
            <LogIn size={16} aria-hidden />
            {s.signIn}
          </Button>
        )}
      </Actions>
    </Card>
  )
}

/** 第一次來: three lessons, each a convention with its own summary */
export function FirstSteps() {
  const { bySlug } = useContent()
  const steps = FIRST_STEPS.map((slug) => bySlug(slug)).filter((c) => c !== undefined)
  if (!steps.length) return null
  return (
    <section aria-labelledby="home-first">
      <BlockTitle id="home-first">{s.firstTime}</BlockTitle>
      <Steps>
        {steps.map((c, i) => (
          <li key={c.slug}>
            <Link to={conventionPath(c.slug)}>
              <small>{s.lesson(i + 1)}</small>
              <strong>{c.nameZh}</strong>
              <span>{c.summary}</span>
            </Link>
          </li>
        ))}
      </Steps>
    </section>
  )
}

/**
 * 最近更新: the conventions changed last, online edits by who and when, the rest by their bundled
 * date. Until the club news board (E11) it is the right column's only block.
 */
export function RecentChanges() {
  const { conventions, online } = useContent()
  const rows = conventions
    .map((c) => {
      const info = online.get(c.slug)
      return info && !info.hidden
        ? {
            c,
            at: info.updatedAt,
            note: info.added ? s.recentAdded : s.recentEdited,
            by: info.updatedBy,
          }
        : { c, at: Date.parse(c.updated), note: s.recentBundled, by: '' }
    })
    .filter((r) => !Number.isNaN(r.at))
    .sort((a, b) => b.at - a.at)
    .slice(0, RECENT)

  return (
    <section aria-labelledby="home-recent">
      <BlockTitle id="home-recent">{s.recent}</BlockTitle>
      {rows.length ? (
        <Recent>
          {rows.map(({ c, at, note, by }) => (
            <li key={c.slug}>
              <Link to={conventionPath(c.slug)}>{c.nameZh}</Link>
              <small>
                {note}
                {by && ` · ${by}`} · <time dateTime={date(at)}>{date(at)}</time>
              </small>
            </li>
          ))}
        </Recent>
      ) : (
        <Note>{s.recentEmpty}</Note>
      )}
    </section>
  )
}

export const BlockTitle = styled.h2`
  margin: 0 0 ${({ theme }) => theme.space(3)};
  padding-bottom: ${({ theme }) => theme.space(2)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.accent};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.125rem;
`

const Card = styled.section`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space(4)};
  padding: ${({ theme }) => theme.space(5)};
  border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
  border-left: 3px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.shape.panel};
  background: ${({ theme }) => theme.colors.surface};
`

const Eyebrow = styled.p`
  margin: 0;
  font-size: 0.8125rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Name = styled.h2`
  margin: ${({ theme }) => theme.space(1)} 0 ${({ theme }) => theme.space(2)};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: 1.375rem;
  color: ${({ theme }) => theme.colors.primaryStrong};
`

const Facts = styled.ul`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(4)};
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};
  b {
    color: ${({ theme }) => theme.colors.text};
  }
`

const Note = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space(2)};
`

const Steps = styled.ol`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: ${({ theme }) => theme.space(3)};
  margin: 0;
  padding: 0;
  list-style: none;

  a {
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.space(1)};
    height: 100%;
    padding: ${({ theme }) => theme.space(3)} ${({ theme }) => theme.space(4)};
    border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.shape.panel};
    background: ${({ theme }) => theme.colors.surfaceAlt};
    color: ${({ theme }) => theme.colors.text};
    text-decoration: none;
  }
  a:hover {
    border-color: ${({ theme }) => theme.colors.primary};
  }
  small {
    color: ${({ theme }) => theme.colors.structure};
    font-weight: 600;
  }
  span {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

const Recent = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  li {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: ${({ theme }) => theme.space(2)} 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  }
  a {
    display: inline-flex;
    align-items: center;
    min-height: 32px;
    color: ${({ theme }) => theme.colors.text};
    font-weight: 500;
  }
  small {
    font-size: 0.8125rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`
