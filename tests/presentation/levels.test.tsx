import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { App } from '../../src/App.tsx'
import { BlockView } from '../../src/components/BlockView.tsx'
import { BlockEditor } from '../../src/components/editor/BlockEditor.tsx'
import { SectionAccordion } from '../../src/components/SectionAccordion.tsx'
import { ExpansionProvider } from '../../src/state/ExpansionContext.tsx'
import { blankBlock } from '../../src/lib/editing.ts'
import { basicHiddenIds } from '../../src/lib/levels.ts'
import { createTheme } from '../../src/styles/tokens.ts'
import type { Block, Section } from '../../src/types/convention.ts'
import { warmPages } from './warmPages.ts'

const KEY = 'tku-bridgebook:prefs'
const stored = () => JSON.parse(window.localStorage.getItem(KEY) ?? '{}')
const store = (prefs: object) => window.localStorage.setItem(KEY, JSON.stringify(prefs))
const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
const findHeading = (name: RegExp) => screen.findByRole('heading', { level: 1, name }, { timeout: 5000 })

beforeAll(() => {
  // jsdom has no matchMedia
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
})
beforeAll(warmPages, 60_000)

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

describe('入門版／完整版 (e4-t02)', () => {
  it('hides 進階 and 高階 sections, inheriting the level down the tree', () => {
    const tree: Section[] = [
      { id: 'a', title: 'A', children: [{ id: 'a1', title: 'A1', level: 'advanced', children: [{ id: 'a1x', title: 'x', level: 'basic' }] }] },
      { id: 'b', title: 'B', level: 'basic' },
      { id: 'c', title: 'C', level: 'odd' as never },
    ]
    expect([...basicHiddenIds(tree, 'basic')]).toEqual(['a1', 'a1x'])
    // An 進階 convention: only what is marked 入門 stays
    expect([...basicHiddenIds(tree, 'intermediate')]).toEqual(['a', 'a1', 'a1x', 'c'])
    expect([...basicHiddenIds(tree)]).toEqual(['a1', 'a1x'])
  })

  it('is switched in 閱讀設定 and remembered', async () => {
    store({ newcomerAsked: true })
    renderAt('/c/fixture-beta')
    await findHeading(/測試特約乙/)
    await userEvent.click(screen.getByText('閱讀設定', { selector: 'button' }))
    const title = await screen.findByText('閱讀設定', { selector: 'h2' }, { timeout: 5000 })
    const panel = within(title.closest<HTMLElement>('[role="dialog"]')!)
    expect(panel.getByRole('button', { name: '完整版' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(panel.getByRole('button', { name: '入門版' }))
    expect(stored().reading).toBe('basic')
    expect(await screen.findByText(/^入門版：還有 2 段/)).toBeInTheDocument()
  })

  it('shows 「還有 n 段」 for what it hides, and the whole page on request', async () => {
    store({ reading: 'basic' })
    renderAt('/c/fixture-beta')
    await findHeading(/測試特約乙/)
    // The made-up fixture-beta is 進階 and its sections inherit it
    expect(await screen.findByText(/^入門版：還有 2 段進階或高階內容/, {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^佔位概要（測試）/ })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: '這頁顯示全部' }))
    expect(screen.getByRole('button', { name: /^佔位概要（測試）/ })).toBeInTheDocument()
    expect(screen.queryByText(/^入門版：還有/)).toBeNull()
    // The setting itself stays 入門版
    expect(stored().reading).toBe('basic')
  })

  it('leaves 入門 conventions whole', async () => {
    store({ reading: 'basic' })
    renderAt('/c/fixture-system')
    await findHeading(/測試制度/)
    await waitFor(() => expect(screen.getAllByRole('button', { name: /^佔位牌例（測試）/ }).length).toBeGreaterThan(0), { timeout: 5000 })
    expect(screen.queryByText(/^入門版：還有/)).toBeNull()
  })

  it('hides a 進階 section of an 入門 convention', async () => {
    store({ reading: 'basic' })
    renderAt('/c/fixture-alpha')
    await findHeading(/測試特約甲/)
    expect(await screen.findByText(/^入門版：還有 1 段/, {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^佔位答叫表（測試）/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^佔位規則（測試）/ })).toBeNull()
  })

  it('opens the page in full for a link to a section it would hide', async () => {
    store({ reading: 'basic' })
    renderAt('/c/fixture-beta/later')
    await findHeading(/測試特約乙/)
    expect(await screen.findByRole('button', { name: /^佔位後續（測試）/ }, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.queryByText(/^入門版：還有/)).toBeNull()
  })
})

describe('你是新生嗎？ (e4-t03)', () => {
  it('asks a first visitor once; yes picks 入門版', async () => {
    renderAt('/')
    const prompt = within(await screen.findByRole('region', { name: '你是新生嗎？' }, { timeout: 5000 }))
    await userEvent.click(prompt.getByRole('button', { name: '是，用入門版' }))
    expect(screen.queryByRole('region', { name: '你是新生嗎？' })).toBeNull()
    expect(stored()).toMatchObject({ reading: 'basic', newcomerAsked: true })
  })

  it('can be closed without choosing, and is not asked again', async () => {
    const { unmount } = renderAt('/')
    const prompt = within(await screen.findByRole('region', { name: '你是新生嗎？' }, { timeout: 5000 }))
    await userEvent.click(prompt.getByRole('button', { name: '關閉，不再詢問' }))
    expect(stored()).toMatchObject({ reading: 'full', newcomerAsked: true })
    unmount()
    renderAt('/c/fixture-alpha')
    await findHeading(/測試特約甲/)
    expect(screen.queryByRole('region', { name: '你是新生嗎？' })).toBeNull()
  })

  it('is not asked of someone whose settings are from before it', async () => {
    store({ theme: 'dark' })
    renderAt('/')
    await screen.findByRole('region', { name: '最近更新' }, { timeout: 5000 })
    expect(screen.queryByRole('region', { name: '你是新生嗎？' })).toBeNull()
  })
})

describe('程度標籤 (e4-t01)', () => {
  const sections: Section[] = [
    { id: 'a', title: '甲', children: [{ id: 'a1', title: '甲一', level: 'advanced' }] },
    { id: 'b', title: '乙', level: 'intermediate' },
  ]
  const show = (basic: boolean) =>
    themed(
      <MemoryRouter>
        <ExpansionProvider>
          <SectionAccordion slug="x" sections={sections} level="intermediate" basic={basic} onShowAll={() => {}} />
        </ExpansionProvider>
      </MemoryRouter>,
    )

  it('marks a section whose level differs from what it inherits', () => {
    show(false)
    expect(screen.getByRole('button', { name: /^甲一/ })).toHaveTextContent('程度：高階')
    // Same as the convention: no label
    expect(screen.getByRole('button', { name: /^乙/ })).not.toHaveTextContent('程度')
  })

  it('hides what 入門版 hides, children with their parent', () => {
    show(true)
    expect(screen.queryByRole('button', { name: /^甲/ })).toBeNull()
    expect(screen.getByText(/^入門版：還有 2 段/)).toBeInTheDocument()
  })
})
