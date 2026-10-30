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

  it('shows the club profile, 第一次來 and 最近更新 (e9-t08)', async () => {
    renderAt('/')
    const card = within(await screen.findByRole('region', { name: '社團預設制度' }, { timeout: 5000 }))
    expect(card.getByText('目前的制度集 · 社團')).toBeInTheDocument()
    expect(card.getByRole('link', { name: '讀制度' })).toHaveAttribute('href', '/book')
    // 練習 (e6-t09)
    expect(card.getByRole('link', { name: '練習叫牌' })).toHaveAttribute('href', '/practice')

    // The first lessons of 「從零開始」 (e4-t09), and the way to the whole path
    const lessons = within(screen.getByRole('region', { name: '第一次來？從這裡開始' })).getAllByRole('link')
    expect(lessons).toHaveLength(4)
    expect(lessons[0]).toHaveAttribute('href', '/learn/from-zero/lesson-1')
    expect(lessons[0]).toHaveTextContent(/^第 1 課淡江自然制總覽/)
    expect(lessons[3]).toHaveAttribute('href', '/learn/from-zero')
    expect(lessons[3]).toHaveTextContent('看「從零開始」全部 8 課')

    // Newest first; nothing was edited online, so all show their bundled date
    const recent = within(await screen.findByRole('region', { name: '最近更新' })).getAllByRole('listitem')
    expect(recent).toHaveLength(5)
    expect(recent[0]).toHaveTextContent('內建版本')

    // Each category is a card with its conventions and how many
    expect(within(screen.getByRole('region', { name: '無王開叫後續' })).getByText('3 個特約')).toBeInTheDocument()
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
    // The account menu, with the member's avatar
    expect(await header.findByRole('button', { name: 'reader 的帳號選單' })).toBeInTheDocument()
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

  describe('on a phone (e9-t09)', () => {
    let original: typeof window.matchMedia
    beforeEach(() => {
      original = window.matchMedia
      window.matchMedia = ((query: string) => ({
        matches: true,
        media: query,
        addEventListener() {},
        removeEventListener() {},
      })) as unknown as typeof window.matchMedia
    })
    afterEach(() => {
      window.matchMedia = original
    })
    const toolbar = async () => within(await screen.findByRole('navigation', { name: '工具列' }, { timeout: 5000 }))

    it('keeps the header to logo and search, and puts 閱讀設定 in the bottom toolbar', async () => {
      renderAt('/book')
      await findTrigger(/^雷本索特約/)
      const header = within(screen.getByRole('banner'))
      expect(header.queryByText('社團預設')).toBeNull()
      // Only the account menu (the member's avatar; the name is hidden on a phone)
      expect(header.getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['reader 的帳號選單'])
      // The page's own 閱讀設定 button gives way to the toolbar's
      expect(within(screen.getByRole('main')).queryByRole('button', { name: '閱讀設定' })).toBeNull()

      const bar = await toolbar()
      const reading = bar.getByRole('button', { name: '閱讀設定' })
      await userEvent.click(reading)
      const panel = within(await screen.findByRole('dialog', { name: '閱讀設定' }, { timeout: 5000 }))
      await userEvent.click(panel.getByRole('button', { name: '全部展開' }))
      expect(trigger(/^雷本索特約/)).toHaveAttribute('aria-expanded', 'true')
      expect(screen.queryByRole('dialog')).toBeNull()

      // Esc closes it and gives the focus back to the toolbar
      await userEvent.click(reading)
      await screen.findByRole('dialog', { name: '閱讀設定' })
      await userEvent.keyboard('{Escape}')
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(reading).toHaveFocus()
      // Off a convention page the second place is 我的
      expect(bar.getByRole('link', { name: '我的' })).toHaveAttribute('href', '/account')
    })

    it('opens the catalogue drawer and focuses search from the toolbar', async () => {
      renderAt('/')
      const bar = await toolbar()
      const catalogue = bar.getByRole('button', { name: '目錄' })
      expect(catalogue).toHaveAttribute('aria-expanded', 'false')
      expect(catalogue).toHaveAttribute('aria-controls', 'catalogue')
      await userEvent.click(catalogue)
      expect(catalogue).toHaveAttribute('aria-expanded', 'true')
      await userEvent.click(bar.getByRole('button', { name: '搜尋' }))
      expect(catalogue).toHaveAttribute('aria-expanded', 'false')
      expect(screen.getByRole('searchbox')).toHaveFocus()
    })

    it('lists the sections under 本頁 in a pop-up on a convention page', async () => {
      renderAt('/c/lebensohl')
      await screen.findByRole('heading', { level: 1, name: '雷本索特約' }, { timeout: 5000 })
      const button = (await toolbar()).getByRole('button', { name: '本頁' })
      await userEvent.click(button)
      const popup = within(screen.getByRole('dialog', { name: '本頁' }))
      expect(popup.getAllByRole('link')[0].getAttribute('href')).toMatch(/^\/c\/lebensohl\//)
      await userEvent.click(popup.getByRole('button', { name: '關閉本頁清單' }))
      expect(screen.queryByRole('dialog', { name: '本頁' })).toBeNull()
      expect(button).toHaveFocus()
    })
  })
})

describe('convention page', () => {
  /** The convention page's title, once the lazy page has loaded */
  const findTitle = (name: string) => screen.findByRole('heading', { level: 1, name }, { timeout: 5000 })

  it('shows only the linked convention as the page, under the way back to the book', async () => {
    renderAt('/c/lebensohl')
    expect(await findTitle('雷本索特約')).toBeInTheDocument()
    const main = within(screen.getByRole('main'))
    expect(main.queryByRole('button', { name: /^對抗不尋常2NT/ })).toBeNull()
    const trail = main.getByRole('navigation', { name: '目前位置' })
    expect(within(trail).getByRole('link', { name: '全書目錄' })).toHaveAttribute('href', '/book')
    // Where it sits: 全書目錄 › category › kind
    expect(trail).toHaveTextContent('全書目錄 › 無王開叫後續 › 特約')
    expect(document.title).toMatch(/^雷本索特約/)
  })

  it('numbers the top-level sections, opens them, and leaves the deeper ones closed', async () => {
    renderAt('/c/lebensohl')
    const first = await screen.findByRole('button', { name: /^遭自然牌組插叫/ }, { timeout: 5000 })
    expect(first).toHaveAttribute('aria-expanded', 'true')
    // The number is shown but not read: the heading's name stays the title
    expect(first).toHaveTextContent(/^§1/)
    expect(trigger(/^其他運用/)).toHaveTextContent(/^§3/)
    expect(screen.getAllByRole('button', { name: /^答叫原則/ })[0]).toHaveAttribute('aria-expanded', 'false')
  })

  it('lists the sections under 本頁 and links the conventions before and after', async () => {
    renderAt('/c/lebensohl')
    await findTitle('雷本索特約')
    const main = within(screen.getByRole('main'))
    expect(main.getByText('本頁', { selector: 'summary' })).toBeInTheDocument()
    expect(main.getByRole('link', { name: /遭非自然牌組插叫/ })).toHaveAttribute('href', '/c/lebensohl/artificial')
    const neighbours = within(main.getByRole('navigation', { name: '上一個與下一個特約' }))
    expect(neighbours.getByRole('link', { name: /^上一個/ })).toHaveAttribute('href', expect.stringMatching(/^\/c\//))
    const next = neighbours.getByRole('link', { name: /^下一個/ })
    const nextName = next.textContent!.replace(/^下一個\s*→\s*/, '')
    await userEvent.click(next)
    expect(await findTitle(nextName)).toBeInTheDocument()
  })

  it('opens the whole path down to a deep-linked section', async () => {
    renderAt('/c/defense-vs-unusual-2nt/vs-1s-after-3c-3d')
    await findTitle('對抗不尋常2NT')
    // The sections appear once the convention's content has loaded
    expect(await screen.findByRole('button', { name: /^[原文已移除]/ }, { timeout: 5000 })).toHaveAttribute('aria-expanded', 'true')
    // Both top-level sections, and the path under the second down to the linked one
    expect(within(screen.getByRole('main')).getAllByRole('button', { expanded: true }).length).toBe(4)
  })

  it('expands and collapses this convention from 閱讀設定', async () => {
    renderAt('/c/lebensohl')
    await findTitle('雷本索特約')
    let panel = await openSettings()
    expect(panel.getByRole('button', { name: '列印本頁' })).toBeInTheDocument()
    await userEvent.click(panel.getByRole('button', { name: '全部展開' }))
    expect(await screen.findByRole('button', { name: /^例外原則/ }, { timeout: 5000 })).toHaveAttribute('aria-expanded', 'true')
    panel = await openSettings()
    await userEvent.click(panel.getByRole('button', { name: '全部收合' }))
    expect(trigger(/^遭非自然牌組插叫/)).toHaveAttribute('aria-expanded', 'false')
    expect(trigger(/^例外原則/)).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows 待確認 notes in the page', async () => {
    renderAt('/c/defense-vs-unusual-2nt')
    await findTitle('對抗不尋常2NT')
    expect((await screen.findAllByText('待確認')).length).toBeGreaterThan(0)
  })

  it('prints as a book page headed with the convention’s name (e9-t10)', async () => {
    renderAt('/c/lebensohl')
    await findTitle('雷本索特約')
    const print = document.querySelector('style[media="print"]')
    expect(print?.textContent).toContain('@top-left { content: "淡江橋館 · 雷本索特約"')
    expect(print?.textContent).toContain('counter(page)')
  })

  it('says so when the section in the address does not exist', async () => {
    renderAt('/c/lebensohl/no-such-section')
    expect(await screen.findByRole('alert', {}, { timeout: 5000 })).toHaveTextContent('找不到這個特約或段落')
    expect(screen.getByRole('heading', { level: 1, name: '雷本索特約' })).toBeInTheDocument()
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

  it('prints with a cover, a contents page and each convention headed by its name (e9-t10)', async () => {
    renderAt('/book')
    await findTrigger(/^雷本索特約/)
    // The cover and contents are print-only: hidden on screen and from screen readers
    const front = document.querySelector<HTMLElement>('[data-print-only]')!
    expect(front).toHaveAttribute('hidden')
    expect(front).toHaveTextContent('淡江橋藝社')
    expect(front).toHaveTextContent('制度集：社團預設')
    expect(within(front).getByText('雷本索特約', { selector: 'li', exact: false })).toBeInTheDocument()
    const print = document.querySelector('style[media="print"]')!.textContent!
    expect(print).toMatch(/@page (c\d+) \{ @top-left \{ content: "淡江橋館 · 雷本索特約"/)
    const page = print.match(/@page (c\d+) \{ @top-left \{ content: "淡江橋館 · 雷本索特約"/)![1]
    expect(print).toContain(`[id="c-lebensohl"] { page: ${page}; }`)
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
  it('lists categories and conventions, marks the one on screen, and lists no sections', async () => {
    renderAt('/c/lebensohl')
    const menu = within(screen.getByRole('navigation', { name: '特約目錄' }))
    expect(menu.getByRole('link', { name: '全書目錄' })).toHaveAttribute('href', '/book')
    expect(menu.getByRole('button', { name: /^無王開叫後續/ })).toHaveAttribute('aria-expanded', 'true')
    expect(menu.getByRole('link', { name: /^雷本索特約/ })).toHaveAttribute('aria-current', 'page')
    // Sections are in the page's 本頁 now, not in the catalogue
    expect(menu.queryByRole('link', { name: '遭自然牌組插叫' })).toBeNull()

    await userEvent.click(menu.getByRole('link', { name: /^1NT的答叫/ }))
    expect(await screen.findByRole('heading', { level: 1, name: '1NT的答叫' }, { timeout: 5000 })).toBeInTheDocument()
    expect(menu.getByRole('link', { name: /^1NT的答叫/ })).toHaveAttribute('aria-current', 'page')
    expect(menu.getByRole('link', { name: /^雷本索特約/ })).not.toHaveAttribute('aria-current')

    await userEvent.click(menu.getByRole('button', { name: /^無王開叫後續/ }))
    expect(menu.queryByRole('link', { name: /^1NT的答叫/ })).toBeNull()
  })

  it('filters the conventions by level', async () => {
    renderAt('/')
    const menu = within(screen.getByRole('navigation', { name: '特約目錄' }))
    expect(menu.getByRole('button', { name: '全部' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(menu.getByRole('button', { name: '高階' }))
    expect(menu.getByRole('button', { name: '高階' })).toHaveAttribute('aria-pressed', 'true')
    // Lebensohl is 進階; the Jacoby 2NT slam asks are 高階
    expect(menu.queryByRole('link', { name: /^雷本索特約/ })).toBeNull()
    expect(menu.getAllByRole('link', { name: /^開叫高花之滿貫詢問叫/ }).length).toBeGreaterThan(0)
    await userEvent.click(menu.getByRole('button', { name: '全部' }))
    expect(menu.getByRole('link', { name: /^雷本索特約/ })).toBeInTheDocument()
  })

  it('links the catalogue’s 待確認 count to the panel', () => {
    renderAt('/')
    const menu = screen.getByRole('navigation', { name: '特約目錄' })
    const link = within(menu).getByRole('link', { name: /^待確認/ })
    expect(link).toHaveAttribute('href', '/pending')
    expect(link.textContent).toMatch(/\d+$/)
  })
})
