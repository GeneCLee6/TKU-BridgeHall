import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'

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

const trigger = (name: RegExp) => screen.getByRole('button', { name })

describe('handbook page', () => {
  it('lists every convention collapsed, and expands one on click', async () => {
    renderAt('/')
    expect(trigger(/^雷本索特約/)).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(trigger(/^雷本索特約/))
    expect(trigger(/^雷本索特約/)).toHaveAttribute('aria-expanded', 'true')
    expect(trigger(/^對抗不尋常2NT/)).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens the whole path down to a deep-linked section', () => {
    renderAt('/c/defense-vs-unusual-2nt/vs-1s-after-3c-3d')
    expect(trigger(/^對抗不尋常2NT/)).toHaveAttribute('aria-expanded', 'true')
    expect(trigger(/^[原文已移除]/)).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByRole('button', { expanded: true }).length).toBe(4)
  })

  it('expands and collapses everything from the header', async () => {
    renderAt('/')
    await userEvent.click(screen.getByRole('button', { name: '全部展開' }))
    expect(trigger(/^雷本索特約/)).toHaveAttribute('aria-expanded', 'true')
    expect(trigger(/^遭非自然牌組插叫/)).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(screen.getByRole('button', { name: '全部收合' }))
    expect(screen.queryAllByRole('button', { expanded: true })).toHaveLength(0)
  })

  it('shows 待確認 notes in the page', () => {
    renderAt('/c/defense-vs-unusual-2nt')
    expect(screen.getAllByText('待確認').length).toBeGreaterThan(0)
  })
  it('keeps the phone header to menu, logo and search, with view actions inside the menu', async () => {
    const original = window.matchMedia
    window.matchMedia = ((query: string) => ({
      matches: true,
      media: query,
      addEventListener() {},
      removeEventListener() {},
    })) as unknown as typeof window.matchMedia
    try {
      renderAt('/')
      const header = screen.getByRole('banner')
      expect(within(header).queryByRole('button', { name: '全部展開' })).toBeNull()
      expect(within(header).queryByRole('button', { name: /深色模式|淺色模式/ })).toBeNull()
      expect(screen.queryByText('♦♣')).toBeNull()

      await userEvent.click(within(header).getByLabelText('開啟目錄'))
      const menu = screen.getByRole('navigation', { name: '特約目錄' })
      expect(within(menu).getByRole('button', { name: /深色模式|淺色模式/ })).toBeInTheDocument()
      await userEvent.click(within(menu).getByRole('button', { name: '全部展開' }))
      expect(trigger(/^雷本索特約/)).toHaveAttribute('aria-expanded', 'true')
      expect(within(header).getByLabelText('開啟目錄')).toHaveAttribute('aria-expanded', 'false')
    } finally {
      window.matchMedia = original
    }
  })
})
