import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import { warmPages } from './warmPages.ts'

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

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

const trigger = (name: RegExp) => screen.getByRole('button', { name })
/** The convention and book pages load lazily, so the first look waits for them */
const findTrigger = (name: RegExp) => screen.findByRole('button', { name }, { timeout: 5000 })
/** Text queries rather than role ones: role queries over a whole expanded book take seconds */
const openSettings = async () => {
  await userEvent.click(screen.getByText('閱讀設定', { selector: 'button' }))
  const title = await screen.findByText('閱讀設定', { selector: 'h2' }, { timeout: 5000 })
  return within(title.closest<HTMLElement>('[role="dialog"]')!)
}

describe('home page', () => {
  it('links every convention to its own page and the whole book, with no cards', async () => {
    renderAt('/')
    const main = within(screen.getByRole('main'))
    expect(main.getByRole('heading', { level: 1 })).toHaveTextContent('淡江橋館')
    expect(main.getByRole('link', { name: /^雷本索特約/ })).toHaveAttribute('href', '/c/lebensohl')
    expect(main.getByRole('link', { name: '看全書目錄（整本一頁）' })).toHaveAttribute('href', '/book')
    expect(main.queryByRole('button', { name: /^雷本索特約/ })).toBeNull()
  })

  it('shows the home page with a note for an unknown address or convention', async () => {
    renderAt('/c/no-such-thing')
    expect(await screen.findByRole('alert')).toHaveTextContent('找不到這個特約或段落')
    expect(within(screen.getByRole('main')).getByRole('link', { name: /^雷本索特約/ })).toBeInTheDocument()
  })
})

describe('header v2 and 閱讀設定', () => {
  it('keeps the header to the logo, the profile, search and the account', async () => {
    renderAt('/')
    const header = within(screen.getByRole('banner'))
    expect(header.getByRole('link', { name: /首頁$/ })).toHaveAttribute('href', '/')
    expect(header.getByText('社團預設')).toBeInTheDocument()
    expect(header.getByRole('searchbox')).toBeInTheDocument()
    expect(await header.findByRole('link', { name: /登入/ })).toBeInTheDocument()
    for (const name of ['全部展開', '全部收合', '列印', '安裝 App', '閱讀設定'])
      expect(header.queryByRole('button', { name })).toBeNull()
    expect(header.queryByRole('group', { name: '字級' })).toBeNull()
  })

  it('opens from the keyboard, sets the theme and 字級 on this device, and closes with Esc', async () => {
    renderAt('/')
    const button = screen.getByRole('button', { name: '閱讀設定' })
    button.focus()
    await userEvent.keyboard('{Enter}')
    const panel = within(await screen.findByRole('dialog', { name: '閱讀設定' }, { timeout: 5000 }))
    expect(button).toHaveAttribute('aria-expanded', 'true')
    // Focus moves to the chosen theme; nothing to expand or print on the home page
    expect(panel.getByRole('button', { name: '跟隨系統' })).toHaveFocus()
    expect(panel.queryByRole('button', { name: '全部展開' })).toBeNull()
    expect(panel.queryByRole('button', { name: /列印/ })).toBeNull()

    await userEvent.click(panel.getByRole('button', { name: '深色' }))
    expect(panel.getByRole('button', { name: '深色' })).toHaveAttribute('aria-pressed', 'true')
    expect(panel.getByRole('button', { name: '跟隨系統' })).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(panel.getByRole('button', { name: '字級：大' }))
    expect(panel.getByRole('button', { name: '字級：大' })).toHaveAttribute('aria-pressed', 'true')
    expect(JSON.parse(window.localStorage.getItem('tku-bridgebook:prefs') ?? '{}')).toMatchObject({
      theme: 'dark',
      textSize: 'large',
    })

    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: '閱讀設定' })).toBeNull()
    expect(button).toHaveFocus()
    expect(button).toHaveAttribute('aria-expanded', 'false')

    // Back to the defaults for the tests that follow
    const again = await openSettings()
    await userEvent.click(again.getByRole('button', { name: '跟隨系統' }))
    await userEvent.click(again.getByRole('button', { name: '字級：中' }))
    await userEvent.click(again.getByRole('button', { name: '關閉閱讀設定' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('reads a light or dark choice stored before 跟隨系統 existed', async () => {
    window.localStorage.setItem('tku-bridgebook:prefs', JSON.stringify({ mode: 'dark' }))
    renderAt('/')
    const panel = await openSettings()
    expect(panel.getByRole('button', { name: '深色' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(panel.getByRole('button', { name: '跟隨系統' }))
    expect(JSON.parse(window.localStorage.getItem('tku-bridgebook:prefs') ?? '{}')).toMatchObject({ theme: 'system' })
  })

  it('explains how to install the app when the browser makes no offer', async () => {
    renderAt('/')
    const panel = await openSettings()
    await userEvent.click(panel.getByRole('button', { name: '安裝 App' }))
    expect(screen.getByRole('heading', { name: '安裝成手機 App', hidden: true })).toBeInTheDocument()
    expect(screen.getAllByText(/加入主畫面/, { selector: 'li' }).length).toBeGreaterThan(0)
  })

  it('keeps the phone header to menu, logo and search, and 閱讀設定 on the page', async () => {
    const original = window.matchMedia
    window.matchMedia = ((query: string) => ({
      matches: true,
      media: query,
      addEventListener() {},
      removeEventListener() {},
    })) as unknown as typeof window.matchMedia
    try {
      renderAt('/book')
      await findTrigger(/^雷本索特約/)
      const header = screen.getByRole('banner')
      expect(within(header).queryByText('社團預設')).toBeNull()
      expect(screen.queryByText('♦♣')).toBeNull()
      const panel = await openSettings()
      await userEvent.click(panel.getByRole('button', { name: '全部展開' }))
      expect(trigger(/^雷本索特約/)).toHaveAttribute('aria-expanded', 'true')
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(within(header).getByLabelText('開啟目錄')).toHaveAttribute('aria-expanded', 'false')
    } finally {
      window.matchMedia = original
    }
  })
})

describe('convention page', () => {
  it('shows only the linked convention, open, under the way back to the book', async () => {
    renderAt('/c/lebensohl')
    expect(await findTrigger(/^雷本索特約/)).toHaveAttribute('aria-expanded', 'true')
    const main = within(screen.getByRole('main'))
    expect(main.queryByRole('button', { name: /^對抗不尋常2NT/ })).toBeNull()
    expect(within(main.getByRole('navigation', { name: '目前位置' })).getByRole('link', { name: '全書目錄' })).toHaveAttribute(
      'href',
      '/book',
    )
    expect(document.title).toMatch(/^雷本索特約/)
  })

  it('opens the whole path down to a deep-linked section', async () => {
    renderAt('/c/defense-vs-unusual-2nt/vs-1s-after-3c-3d')
    expect(await findTrigger(/^對抗不尋常2NT/)).toHaveAttribute('aria-expanded', 'true')
    // The sections appear once the convention's content has loaded
    expect(await screen.findByRole('button', { name: /^[原文已移除]/ }, { timeout: 5000 })).toHaveAttribute('aria-expanded', 'true')
    expect(within(screen.getByRole('main')).getAllByRole('button', { expanded: true }).length).toBe(4)
  })

  it('expands and collapses this convention from 閱讀設定', async () => {
    renderAt('/c/lebensohl')
    await findTrigger(/^雷本索特約/)
    let panel = await openSettings()
    expect(panel.getByRole('button', { name: '列印本頁' })).toBeInTheDocument()
    await userEvent.click(panel.getByRole('button', { name: '全部展開' }))
    expect(await screen.findByRole('button', { name: /^遭非自然牌組插叫/ }, { timeout: 5000 })).toHaveAttribute('aria-expanded', 'true')
    panel = await openSettings()
    await userEvent.click(panel.getByRole('button', { name: '全部收合' }))
    // The convention stays open on its own page; its sections fold
    expect(trigger(/^雷本索特約/)).toHaveAttribute('aria-expanded', 'true')
    expect(trigger(/^遭非自然牌組插叫/)).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows 待確認 notes in the page', async () => {
    renderAt('/c/defense-vs-unusual-2nt')
    await findTrigger(/^對抗不尋常2NT/)
    expect((await screen.findAllByText('待確認')).length).toBeGreaterThan(0)
  })

  it('says so when the section in the address does not exist', async () => {
    renderAt('/c/lebensohl/no-such-section')
    expect(await screen.findByRole('alert')).toHaveTextContent('找不到這個特約或段落')
    expect(trigger(/^雷本索特約/)).toBeInTheDocument()
  })
})

describe('the whole book', () => {
  it('lists every convention collapsed, and expands one on click', async () => {
    renderAt('/book')
    expect(await findTrigger(/^雷本索特約/)).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(trigger(/^雷本索特約/))
    expect(trigger(/^雷本索特約/)).toHaveAttribute('aria-expanded', 'true')
    expect(trigger(/^對抗不尋常2NT/)).toHaveAttribute('aria-expanded', 'false')
  })

  it('expands and collapses everything, and offers to print the whole book', async () => {
    renderAt('/book')
    await findTrigger(/^雷本索特約/)
    let panel = await openSettings()
    expect(panel.getByRole('button', { name: '印整本' })).toBeInTheDocument()
    await userEvent.click(panel.getByRole('button', { name: '全部展開' }))
    expect(trigger(/^雷本索特約/)).toHaveAttribute('aria-expanded', 'true')
    // Sections appear once their convention's content has loaded (a text query: role queries
    // over the whole open book are slow)
    const section = await screen.findByText('遭非自然牌組插叫', {}, { timeout: 5000 })
    expect(section.closest('button')).toHaveAttribute('aria-expanded', 'true')
    panel = await openSettings()
    await userEvent.click(panel.getByRole('button', { name: '全部收合' }))
    expect(document.querySelectorAll('main [aria-expanded="true"]')).toHaveLength(0)
  }, 40_000)

  it('shows each convention’s kind and level on the card and in the catalogue', async () => {
    renderAt('/book')
    // The card's title row: the words read with their meaning, the icons are decoration
    expect(await findTrigger(/^雷本索特約/)).toHaveTextContent('種類：特約')
    expect(trigger(/^雷本索特約/)).toHaveTextContent('程度：進階')
    expect(trigger(/^橋牌防守信號/)).toHaveTextContent('種類：信號')
    expect(trigger(/^淡江自然制總覽/)).toHaveTextContent('種類：制度章節')
    expect(trigger(/^淡江自然制總覽/)).toHaveTextContent('程度：入門')
    const menu = within(screen.getByRole('navigation', { name: '特約目錄' }))
    expect(menu.getByRole('link', { name: /^開叫高花之滿貫詢問叫s*Jacoby 2NT/ })).toHaveTextContent('種類：特約程度：高階')
  })

  it('links each card’s 待確認 count to its first note', async () => {
    renderAt('/book')
    await findTrigger(/^雷本索特約/)
    const main = within(screen.getByRole('main'))
    expect(main.getAllByRole('link', { name: '1 項待確認' })[0]).toHaveAttribute(
      'href',
      '/c/notrump-responses/slam-try?pending=0',
    )
  })
})

describe('catalogue', () => {
  it('folds the catalogue: clicking a convention title opens and closes its sections', async () => {
    renderAt('/c/lebensohl')
    const menu = screen.getByRole('navigation', { name: '特約目錄' })
    expect(within(menu).getByRole('button', { name: /^無王開叫後續/ })).toHaveAttribute('aria-expanded', 'true')
    // The convention in the URL shows its sections; the others stay folded
    expect(within(menu).getByRole('link', { name: '遭自然牌組插叫' })).toBeInTheDocument()
    expect(within(menu).queryByRole('link', { name: '合約選擇方式' })).toBeNull()

    // The chevrons are only indicators, not separate controls
    expect(within(menu).queryByRole('button', { name: /小節/ })).toBeNull()

    const title = () => within(menu).getByRole('link', { name: /^1NT的答叫/ })
    await userEvent.click(title())
    expect(title()).toHaveAttribute('aria-expanded', 'true')
    expect(within(menu).getByRole('link', { name: '合約選擇方式' })).toBeInTheDocument()
    // The link also opened that convention's own page
    expect(await findTrigger(/^1NT的答叫/)).toHaveAttribute('aria-expanded', 'true')

    await userEvent.click(title())
    expect(title()).toHaveAttribute('aria-expanded', 'false')
    expect(within(menu).queryByRole('link', { name: '合約選擇方式' })).toBeNull()

    await userEvent.click(within(menu).getByRole('button', { name: /^無王開叫後續/ }))
    expect(within(menu).queryByRole('link', { name: /^1NT的答叫/ })).toBeNull()
  })

  it('lists every 待確認 note in the catalogue and jumps straight to it', async () => {
    renderAt('/')
    const menu = screen.getByRole('navigation', { name: '特約目錄' })
    const group = within(menu).getByRole('button', { name: /^待確認/ })
    expect(group).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(group)

    // The Lebensohl…: no notes; the 1NT doc has one, under 嘗試滿貫
    const link = within(menu).getByRole('link', { name: /^嘗試滿貫/ })
    expect(link).toHaveAttribute('href', '/c/notrump-responses/slam-try?pending=0')
    await userEvent.click(link)
    expect(await findTrigger(/^1NT的答叫/)).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByRole('button', { name: /^合約選擇方式/ }, { timeout: 5000 })).toHaveAttribute('aria-expanded', 'true')
    expect(trigger(/^嘗試滿貫/)).toHaveAttribute('aria-expanded', 'true')
  })
})
