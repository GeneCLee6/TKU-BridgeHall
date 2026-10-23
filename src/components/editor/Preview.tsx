import { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { allKeys, sectionDomId } from '../../lib/sections.ts'
import { ExpansionProvider, useExpansion } from '../../state/ExpansionContext.tsx'
import { mobile } from '../../styles/tokens.ts'
import type { Convention } from '../../types/convention.ts'
import { ConventionCard } from '../ConventionCard.tsx'

/**
 * The convention as the handbook will show it, fully opened, with its own expansion state so it
 * never touches the handbook's. Picking a section in the editor scrolls the preview to it.
 */
export function Preview({ convention, focusId }: { convention: Convention; focusId: string }) {
  return (
    <ExpansionProvider>
      <Opened convention={convention} focusId={focusId} />
    </ExpansionProvider>
  )
}

function Opened({ convention, focusId }: { convention: Convention; focusId: string }) {
  const { open } = useExpansion()
  const box = useRef<HTMLDivElement>(null)
  const keys = allKeys(convention).join('|')

  useEffect(() => {
    open(keys.split('|'))
  }, [keys, open])

  useEffect(() => {
    const container = box.current
    const target = focusId === 'info' ? null : document.getElementById(sectionDomId(convention.slug, focusId))
    if (!container) return
    const top = target ? target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - 8 : 0
    container.scrollTo?.({ top, behavior: 'smooth' })
  }, [focusId, convention.slug])

  return (
    <Box ref={box} data-preview>
      <ConventionCard convention={convention} />
    </Box>
  )
}

/**
 * Fills its column and scrolls inside it (on phones it grows with the page instead). Positioned,
 * so the visually-hidden labels inside stay in the scroll box: unpositioned, they escaped it and
 * stretched the page far below the editor.
 */
const Box = styled.div`
  position: relative;
  overflow: auto;
  min-height: 0;

  ${mobile} {
    overflow: visible;
  }

  /*
   * The preview shows everything at once; cards elsewhere skip work while off screen. The column
   * around it is the frame, so the card drops its own.
   */
  & [data-print='card'] {
    content-visibility: visible;
    border: 0;
    border-radius: 0;
    box-shadow: none;
  }
`
