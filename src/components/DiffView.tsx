import styled from 'styled-components'
import { formatCall } from '../lib/calls.ts'
import { countDiff, inlineDiff, isEmptyDiff, type ConventionDiff, type DiffLine, type DiffPlace } from '../lib/diff.ts'
import { diffText as t } from '../pages/reviewStrings.ts'
import { Muted } from './ui.tsx'

/** What a line is, in words */
function placeLabel(place: DiffPlace): string {
  switch (place.at) {
    case 'meta':
      return t.fields[place.field]
    case 'section':
      return t.section[place.field]
    case 'note':
      return place.tone === 'warning' ? t.noteWarning : t.noteInfo
    case 'intro':
      return t.intro[place.part]
    case 'rule':
      return t.rule(place.depth)
    case 'row':
      return t.row(formatCall(place.call) || '—', place.part)
    default:
      return t[place.at]
  }
}

/** A line's words as shown: a section's place among its siblings reads 「第 n 個」 */
function shown(place: DiffPlace, text: string | undefined) {
  if (place.at === 'section' && place.field === 'order' && text) return t.order(text)
  if (place.at === 'section' && place.field === 'place') return text ?? t.topLevel
  return text
}

/** One side of a changed line, the characters that differ marked */
function Marked({ before, after, side }: { before: string; after: string; side: 'before' | 'after' }) {
  const drop = side === 'before' ? 'added' : 'removed'
  return (
    <>
      {inlineDiff(before, after)
        .filter((p) => p.op !== drop)
        .map((p, i) => (p.op === 'same' ? <span key={i}>{p.text}</span> : side === 'before' ? <del key={i}>{p.text}</del> : <ins key={i}>{p.text}</ins>))}
    </>
  )
}

function Line({ line }: { line: DiffLine }) {
  const before = shown(line.place, line.before)
  const after = shown(line.place, line.after)
  const indent = line.place.at === 'rule' ? line.place.depth : 0
  return (
    <Item $op={line.op} style={indent ? { marginLeft: `${indent * 1.25}rem` } : undefined}>
      <Label>
        {placeLabel(line.place)}
        <span className="visually-hidden">（{line.op === 'added' ? t.opAdded : line.op === 'removed' ? t.opRemoved : t.opChanged}）</span>
      </Label>
      {line.op !== 'added' && (
        <Text>
          <Side aria-hidden>－</Side>
          <span>
            <span className="visually-hidden">{t.before}：</span>
            {line.op === 'changed' && before && after && line.place.at !== 'section' ? (
              <Marked before={before} after={after} side="before" />
            ) : (
              <del>{before || t.empty}</del>
            )}
          </span>
        </Text>
      )}
      {line.op !== 'removed' && (
        <Text>
          <Side aria-hidden>＋</Side>
          <span>
            <span className="visually-hidden">{t.after}：</span>
            {line.op === 'changed' && before && after && line.place.at !== 'section' ? (
              <Marked before={before} after={after} side="after" />
            ) : (
              <ins>{after || t.empty}</ins>
            )}
          </span>
        </Text>
      )}
    </Item>
  )
}

/**
 * The differences between two versions of a convention (e8-t03, AC-8.3), one line under another
 * so it reads on a phone: what was there struck out, what is there now marked, the characters that
 * differ inside a changed line marked again. The words are the versions' own, untouched.
 */
export function DiffView({ diff, before, after }: { diff: ConventionDiff; before: string; after: string }) {
  if (isEmptyDiff(diff)) return <Muted role="status">{t.same}</Muted>
  return (
    <Wrap>
      <Muted>
        {t.legend(before, after)} {t.counts(countDiff(diff))}
      </Muted>
      {diff.meta.length > 0 && (
        <Group aria-label={t.meta}>
          <h3>{t.meta}</h3>
          <Lines>
            {diff.meta.map((line, i) => (
              <Line key={i} line={line} />
            ))}
          </Lines>
        </Group>
      )}
      {diff.sections.map((s) => (
        <Group key={`${s.op}-${s.id}`} aria-label={s.trail.join(' › ')}>
          <h3>
            {s.trail.join(' › ') || s.id}
            <Badge $op={s.op}>{s.op === 'added' ? t.sectionAdded : s.op === 'removed' ? t.sectionRemoved : t.sectionChanged}</Badge>
          </h3>
          {s.lines.length > 0 && (
            <Lines>
              {s.lines.map((line, i) => (
                <Line key={i} line={line} />
              ))}
            </Lines>
          )}
        </Group>
      ))}
    </Wrap>
  )
}

const Wrap = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space(3)};
  min-width: 0;
`

const Group = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  min-width: 0;

  h3 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${({ theme }) => theme.space(2)};
    margin: 0;
    font-size: 1rem;
  }
`

const Badge = styled.span<{ $op: DiffLine['op'] }>`
  padding: 0 ${({ theme }) => theme.space(2)};
  border: 1px solid ${({ theme, $op }) => ($op === 'removed' ? theme.colors.warningBorder : $op === 'added' ? theme.colors.structure : theme.colors.border)};
  border-radius: ${({ theme }) => theme.shape.tag};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8125rem;
  font-weight: 400;
`

const Lines = styled.ol`
  display: grid;
  gap: ${({ theme }) => theme.space(2)};
  margin: 0;
  padding: 0;
  list-style: none;
`

const Item = styled.li<{ $op: DiffLine['op'] }>`
  display: grid;
  gap: ${({ theme }) => theme.space(1)};
  padding: ${({ theme }) => theme.space(2)};
  border-left: 3px solid
    ${({ theme, $op }) => ($op === 'removed' ? theme.colors.warningBorder : $op === 'added' ? theme.colors.structure : theme.colors.accent)};
  border-radius: ${({ theme }) => theme.shape.note};
  background: ${({ theme }) => theme.colors.surfaceAlt};
  overflow-wrap: anywhere;
  position: relative;
`

const Label = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.8125rem;
`

const Text = styled.span`
  display: flex;
  gap: ${({ theme }) => theme.space(1)};
  white-space: pre-wrap;

  del {
    background: ${({ theme }) => theme.colors.warningBg};
    color: ${({ theme }) => theme.colors.text};
    text-decoration: line-through;
    text-decoration-color: ${({ theme }) => theme.colors.seal};
  }
  ins {
    background: ${({ theme }) => theme.colors.primarySoft};
    color: ${({ theme }) => theme.colors.text};
    text-decoration: underline;
    text-decoration-color: ${({ theme }) => theme.colors.structure};
  }
`

const Side = styled.span`
  flex: none;
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fonts.mono};
`
