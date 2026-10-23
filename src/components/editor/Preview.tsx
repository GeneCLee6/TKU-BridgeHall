import { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { allKeys, sectionDomId } from '../../lib/sections.ts'
import { ExpansionProvider, useExpansion } from '../../state/ExpansionContext.tsx'
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

const Box = styled.div`
  overflow: auto;
  max-height: calc(100vh - ${({ theme }) => theme.layout.headerHeight} - 120px);
  padding: 2px;

  /* The preview shows everything at once; cards elsewhere skip work while off screen */
  & [data-print='card'] {
    content-visibility: visible;
  }
`
