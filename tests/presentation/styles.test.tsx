import { render, screen, waitFor } from '@testing-library/react'
import { ThemeProvider } from 'styled-components'
import { PendingNote } from '../../src/components/PendingNote.tsx'
import { Tag, TagList } from '../../src/components/Tag.tsx'
import { Button, Panel } from '../../src/components/ui.tsx'
import { PreferencesProvider } from '../../src/state/PreferencesContext.tsx'
import { strings } from '../../src/strings.ts'
import { createTheme, isStyleLoaded, loadStyle, type StyleName } from '../../src/styles/tokens.ts'

await loadStyle('chinese')

function renderIn(style: StyleName) {
  return render(
    <ThemeProvider theme={createTheme('light', 'medium', style)}>
      <Panel data-testid="panel">
        <Button>OK</Button>
        <TagList>
          <Tag label="1♠" />
        </TagList>
        <PendingNote text="…" />
      </Panel>
    </ThemeProvider>,
  )
}

describe('base components read the style tokens', () => {
  it('look as before in 「一般」', () => {
    renderIn('general')
    expect(screen.getByTestId('panel')).toHaveStyle({ borderRadius: '14px' })
    expect(screen.getByRole('button', { name: 'OK' })).toHaveStyle({ borderRadius: '6px' })
    expect(screen.getByText(strings.pending)).toHaveStyle({ borderRadius: '999px' })
    expect(screen.getByText(strings.pending)).not.toHaveStyle({ transform: 'rotate(-3deg)' })
    expect(screen.getByRole('listitem')).toHaveStyle({ borderRadius: '999px' })
  })

  it('change with 中國風', () => {
    renderIn('chinese')
    expect(screen.getByTestId('panel')).toHaveStyle({ borderRadius: '2px', borderStyle: 'double' })
    expect(screen.getByRole('button', { name: 'OK' })).toHaveStyle({ borderRadius: '2px' })
    expect(screen.getByText(strings.pending)).toHaveStyle({ transform: 'rotate(-3deg)' })
    expect(screen.getByRole('listitem')).toHaveStyle({ borderRadius: '2px' })
  })

  it('keeps a stored style choice, loading its tokens on demand', async () => {
    window.localStorage.setItem('tku-bridgebook:prefs', JSON.stringify({ style: 'plain' }))
    expect(isStyleLoaded('plain')).toBe(false)
    render(
      <PreferencesProvider>
        <Panel data-testid="panel" />
      </PreferencesProvider>,
    )
    // 「一般」 until the style's chunk is here
    await waitFor(() => expect(screen.getByTestId('panel')).toHaveStyle({ borderRadius: '0px' }))
  })

  it('ignores an unknown stored style', () => {
    window.localStorage.setItem('tku-bridgebook:prefs', JSON.stringify({ style: 'neon' }))
    render(
      <PreferencesProvider>
        <Panel data-testid="panel" />
      </PreferencesProvider>,
    )
    expect(screen.getByTestId('panel')).toHaveStyle({ borderRadius: '14px' })
  })
})
