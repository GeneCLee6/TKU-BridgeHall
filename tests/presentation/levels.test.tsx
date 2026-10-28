import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { ThemeProvider } from 'styled-components'
import { BlockView } from '../../src/components/BlockView.tsx'
import { BlockEditor } from '../../src/components/editor/BlockEditor.tsx'
import { blankBlock } from '../../src/lib/editing.ts'
import { createTheme } from '../../src/styles/tokens.ts'
import type { Block } from '../../src/types/convention.ts'

const themed = (node: React.ReactNode) => render(<ThemeProvider theme={createTheme('light')}>{node}</ThemeProvider>)

describe('導讀 block (e4-t04)', () => {
  it('shows the parts that are filled in, under their headings', () => {
    themed(<BlockView block={{ kind: 'intro', why: '為了♠', pitfalls: ['甲', ' '] }} />)
    const box = within(screen.getByRole('region', { name: '導讀' }))
    expect(box.getByText('為什麼用它')).toBeInTheDocument()
    expect(box.queryByText('什麼時候用')).toBeNull()
    expect(box.getByText('常見錯誤')).toBeInTheDocument()
    // Blank pitfalls are not shown
    expect(box.getAllByRole('listitem')).toHaveLength(1)
  })

  it('is edited as three fields, 常見錯誤 one per line', async () => {
    let latest: Block = blankBlock('intro')
    function Harness() {
      const [block, setBlock] = useState<Block>(latest)
      const change = (next: Block) => {
        latest = next
        setBlock(next)
      }
      return <BlockEditor block={block} index={0} count={1} onChange={change} onMove={() => {}} onRemove={() => {}} />
    }
    themed(<Harness />)
    const box = within(screen.getByRole('region', { name: '導讀 1' }))
    await userEvent.type(box.getByLabelText('為什麼用它'), '理由')
    await userEvent.type(box.getByLabelText(/^常見錯誤/), '一{Enter}二')
    expect(latest).toEqual({ kind: 'intro', why: '理由', when: '', pitfalls: ['一', '二'] })
  })
})
