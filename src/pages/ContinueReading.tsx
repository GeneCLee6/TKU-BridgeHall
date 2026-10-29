import { useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Button, ErrorText, Muted, Panel, PanelTitle } from '../components/ui.tsx'
import { libraryStrings } from '../libraryStrings.ts'
import { errorText } from '../lib/api.ts'
import { formatDateTime } from '../lib/format.ts'
import { readingPath, readingShare, useReadingPlaces } from '../lib/reading.ts'
import { strings } from '../strings.ts'

const t = libraryStrings.reading
/** The newest few; the rest are kept but not shown */
const SHOWN = 5

/**
 * 「繼續閱讀」 on 我的帳號 (e5-t14, AC-5.8): the articles and e-books this member has been reading,
 * newest first, each a link back to the block or page they had reached.
 */
export function ContinueReading() {
  const { places, forget } = useReadingPlaces(true)
  const [error, setError] = useState('')
  const shown = places?.slice(0, SHOWN) ?? []

  const remove = async (kind: 'article' | 'ebook', id: string) => {
    setError('')
    try {
      await forget(kind, id)
    } catch (e) {
      setError(errorText(e))
    }
  }

  return (
    <Panel aria-labelledby="account-reading">
      <PanelTitle id="account-reading">{t.title}</PanelTitle>
      {!places ? (
        <Muted role="status">{strings.loading}</Muted>
      ) : shown.length ? (
        <List>
          {shown.map((p) => (
            <li key={`${p.kind}:${p.id}`}>
              <Link to={readingPath(p)}>{p.title}</Link>
              <Line>
                <progress value={readingShare(p)} max={100} aria-label={t.share(p.title)} />
                <span>{p.kind === 'article' ? t.article(p.place, p.of) : t.ebook(p.place, p.of)}</span>
                <span>{t.when(formatDateTime(p.at))}</span>
                <Button type="button" $small $variant="ghost" onClick={() => void remove(p.kind, p.id)} aria-label={t.forget(p.title)}>
                  {t.forgetShort}
                </Button>
              </Line>
            </li>
          ))}
        </List>
      ) : (
        <Muted>
          {t.none} <Link to="/library">{t.toLibrary}</Link>
        </Muted>
      )}
      {places && places.length > SHOWN && <Muted>{t.more(places.length - SHOWN)}</Muted>}
      {error && <ErrorText role="alert">{error}</ErrorText>}
    </Panel>
  )
}

const List = styled.ul`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  margin: 0;
  padding: 0;
  list-style: none;

  a {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 500;
  }
`

const Line = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)} ${({ theme }) => theme.space(3)};
  margin-top: ${({ theme }) => theme.space(1)};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};

  progress {
    width: 6rem;
    accent-color: ${({ theme }) => theme.colors.primary};
  }
`
