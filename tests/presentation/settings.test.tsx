import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import { defaultPrefs, readStoredPrefs } from '../../src/state/PreferencesContext.tsx'
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

beforeAll(() => {
  // jsdom has no matchMedia: a desktop that is narrower than the 本頁 column's breakpoint
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
})
beforeAll(warmPages, 60_000)

describe('stored preferences (e9-t15)', () => {
  it('default to today’s look', () => {
    expect(readStoredPrefs()).toEqual(defaultPrefs)
    expect(defaultPrefs).toEqual({
      theme: 'system',
      style: 'general',
      layout: 'whole',
      font: 'style',
      textSize: 'medium',
      suitColors: 'four',
      density: 'comfortable',
      reading: 'full',
      newcomerAsked: false,
    })
  })

  it('keep what they know and drop what they do not', () => {
    // Settings from before 「你是新生嗎？」 (e4-t03) are someone who has been here: not asked again
    const returning = { ...defaultPrefs, newcomerAsked: true }
    store({ theme: 'blue', style: 'neon', layout: 'grid', font: 1, textSize: 'huge', suitColors: 'six', density: 'x', reading: 'easy' })
    expect(readStoredPrefs()).toEqual(returning)
    store({ newcomerAsked: 'yes' })
    expect(readStoredPrefs()).toEqual(defaultPrefs)
    store({ mode: 'dark', style: 'night', layout: 'cards', font: 'system', textSize: 'xlarge', suitColors: 'two', density: 'compact', reading: 'basic', newcomerAsked: false })
    expect(readStoredPrefs()).toEqual({
      theme: 'dark',
      style: 'night',
      layout: 'cards',
      font: 'system',
      textSize: 'xlarge',
      suitColors: 'two',
      density: 'compact',
      reading: 'basic',
      newcomerAsked: false,
    })
    window.localStorage.setItem(KEY, 'not json')
    expect(readStoredPrefs()).toEqual(defaultPrefs)
    window.localStorage.setItem(KEY, '"text"')
    expect(readStoredPrefs()).toEqual(returning)
  })
})

describe('個人設定 page', () => {
  it('is linked from 閱讀設定', async () => {
    renderAt('/')
    await userEvent.click(screen.getByText('閱讀設定', { selector: 'button' }))
    expect(await screen.findByRole('link', { name: '更多顯示設定' }, { timeout: 5000 })).toHaveAttribute('href', '/settings')
  })

  it('previews each setting, keeps them on 儲存, and goes back to the defaults', async () => {
    renderAt('/settings')
    // 隱私 below has its own 儲存 and 取消變更
    const first = (name: string) => screen.getAllByRole('button', { name })[0]
    const group = async (name: string) => within(await screen.findByRole('group', { name }, { timeout: 5000 }))
    expect((await group('風格')).getByRole('radio', { name: /^一般/ })).toBeChecked()
    expect((await group('版面')).getByRole('radio', { name: /^整本一頁/ })).toBeChecked()

    await userEvent.click((await group('風格')).getByRole('radio', { name: /^圓潤/ }))
    await userEvent.click((await group('版面')).getByRole('radio', { name: /^卡片總覽/ }))
    await userEvent.click((await group('字體')).getByRole('radio', { name: /^系統字型/ }))
    await userEvent.click((await group('字級')).getByRole('radio', { name: '特大' }))
    await userEvent.click((await group('花色顏色')).getByRole('radio', { name: /^雙色/ }))
    await userEvent.click((await group('密度')).getByRole('radio', { name: /^緊湊/ }))
    await userEvent.click((await group('明暗')).getByRole('radio', { name: '深色' }))
    // Nothing is kept before 儲存; 取消變更 puts the choices back
    expect(stored()).toEqual(defaultPrefs)
    expect(screen.getByRole('status')).toHaveTextContent('還沒儲存')
    await userEvent.click(first('取消變更'))
    expect((await group('風格')).getByRole('radio', { name: /^一般/ })).toBeChecked()
    await userEvent.click((await group('風格')).getByRole('radio', { name: /^圓潤/ }))
    await userEvent.click((await group('版面')).getByRole('radio', { name: /^卡片總覽/ }))
    await userEvent.click((await group('字體')).getByRole('radio', { name: /^系統字型/ }))
    await userEvent.click((await group('字級')).getByRole('radio', { name: '特大' }))
    await userEvent.click((await group('花色顏色')).getByRole('radio', { name: /^雙色/ }))
    await userEvent.click((await group('密度')).getByRole('radio', { name: /^緊湊/ }))
    await userEvent.click((await group('明暗')).getByRole('radio', { name: '深色' }))
    await userEvent.click(first('儲存'))
    expect(screen.getByRole('status')).toHaveTextContent('已儲存')
    expect(stored()).toEqual({
      theme: 'dark',
      style: 'soft',
      layout: 'cards',
      font: 'system',
      textSize: 'xlarge',
      suitColors: 'two',
      density: 'compact',
      reading: 'full',
      newcomerAsked: false,
    })

    await userEvent.click(screen.getByRole('button', { name: '全部恢復預設' }))
    expect(screen.getByRole('status')).toHaveTextContent('已換成預設值')
    await userEvent.click(first('儲存'))
    expect(stored()).toEqual(defaultPrefs)
  })
})

describe('版面', () => {
  it('整本一頁 (the default) keeps the catalogue', () => {
    renderAt('/')
    expect(screen.getByRole('navigation', { name: '特約目錄' })).toBeInTheDocument()
  })

  it('專注單欄 hides the catalogue on a desktop', async () => {
    store({ layout: 'focus' })
    renderAt('/c/fixture-alpha')
    expect(await screen.findByRole('heading', { level: 1, name: /測試特約甲（虛構）/ }, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: '特約目錄' })).toBeNull()
  })

  it('卡片總覽 opens on tiles by category, with a preview drawer (e9-t17)', async () => {
    store({ layout: 'cards' })
    renderAt('/')
    expect(await screen.findByRole('heading', { level: 1, name: '卡片總覽' }, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: '特約目錄' })).toBeNull()

    const tabs = screen.getAllByRole('tab')
    expect(tabs[0]).toHaveTextContent('全部')
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    const all = within(screen.getByRole('tabpanel')).getAllByRole('button')
    expect(all.length).toBe(3)

    // A category shows only its own
    await userEvent.click(tabs[1])
    expect(tabs[1]).toHaveAttribute('aria-selected', 'true')
    expect(within(screen.getByRole('tabpanel')).getAllByRole('button').length).toBeLessThan(all.length)

    await userEvent.click(tabs[0])
    const drawer = within(screen.getByRole('complementary', { name: '預覽' }))
    expect(drawer.getByText(/點選左邊的特約/)).toBeInTheDocument()
    const tile = screen.getByRole('button', { name: /^測試特約甲（虛構）/ })
    await userEvent.click(tile)
    expect(tile).toHaveAttribute('aria-pressed', 'true')
    expect(drawer.getByRole('heading', { level: 2, name: '測試特約甲（虛構）' })).toBeInTheDocument()
    expect(drawer.getByRole('link', { name: '打開特約' })).toHaveAttribute('href', '/c/fixture-alpha')
    await waitFor(() => expect(drawer.getAllByRole('link').some((l) => l.getAttribute('href')?.startsWith('/c/fixture-alpha/'))).toBe(true))
  })
})
