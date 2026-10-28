import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { App } from '../../src/App.tsx'
import { conventionBySlug } from '../../src/content/index.ts'
import { generateQuizzes } from '../../src/lib/quiz.ts'
import { strings } from '../../src/strings.ts'
import { warmPages } from './warmPages.ts'

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )

beforeAll(() => {
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
})
beforeAll(() => Promise.all([warmPages(), import('../../src/pages/PracticePage.tsx')]), 60_000)

const WAIT = { timeout: 10_000 }

describe('練習 (e6-t02, e6-t03, AC-6.3)', () => {
  it('starts with the convention from 練這個特約 and answers a round with the source shown', async () => {
    const user = userEvent.setup()
    renderAt('/practice?c=lebensohl')
    const box = await screen.findByRole('checkbox', { name: /^雷本索特約/ }, WAIT)
    expect(box).toBeChecked()
    // Only Lebensohl is chosen; its questions are all the round can draw from
    const asked = generateQuizzes([conventionBySlug('lebensohl')!], 'club').quizzes
    expect(screen.getByText(`符合條件的題目共 ${asked.length} 題。`)).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox').filter((b) => (b as HTMLInputElement).checked)).toHaveLength(1)

    await user.selectOptions(screen.getByRole('combobox', { name: /題數/ }), '5')
    await user.click(screen.getByRole('button', { name: '開始練習' }))

    for (let i = 1; i <= 5; i++) {
      expect(await screen.findByText(`第 ${i}／5 題`)).toBeInTheDocument()
      const choices = within(screen.getByRole('list', { name: '選項' })).getAllByRole('button')
      expect(choices).toHaveLength(4)
      // Every choice is one of Lebensohl's meanings, word for word
      const meanings = new Set(asked.map((q) => q.answer))
      choices.forEach((c) => expect(meanings.has(c.textContent ?? '')).toBe(true))
      await user.click(choices[0])
      expect(await screen.findByRole('heading', { name: /^答(對了|錯了)/ })).toHaveFocus()
      expect(screen.getByText('正解')).toBeInTheDocument()
      const link = screen.getByRole('link', { name: '去讀原文' })
      expect(link.getAttribute('href')).toMatch(/^\/c\/lebensohl\//)
      // The source table is shown under the answer
      expect(screen.getAllByRole('table').length).toBeGreaterThan(0)
      await user.click(screen.getByRole('button', { name: i < 5 ? '下一題' : '看結果' }))
    }
    expect(await screen.findByRole('heading', { name: '練習結束' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /^答對 \d／5 題$/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '再練一次' }))
    expect(await screen.findByText('第 1／5 題')).toBeInTheDocument()
  })

  it('offers only conventions with questions, all chosen by default', async () => {
    renderAt('/practice')
    await screen.findByRole('checkbox', { name: /^雷本索特約/ }, WAIT)
    const boxes = screen.getAllByRole('checkbox')
    expect(boxes).toHaveLength(19)
    boxes.forEach((b) => expect(b).toBeChecked())
    await userEvent.click(screen.getByRole('button', { name: '全不選' }))
    expect(screen.getByText(/沒有符合條件的題目/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '開始練習' })).toBeDisabled()
  })
})

describe('練這個特約 (e6-t09)', () => {
  it('is on a convention page with response tables and not on one without', async () => {
    const { unmount } = renderAt('/c/lebensohl')
    const link = await screen.findByRole('link', { name: '練這個特約' }, WAIT)
    expect(link).toHaveAttribute('href', '/practice?c=lebensohl')
    unmount()
    renderAt('/c/system-overview')
    await screen.findByRole('heading', { level: 1, name: /淡江自然制總覽/ }, WAIT)
    // Once its content is in, there is still no way to practise a convention without tables
    await waitFor(() => expect(screen.queryByText(strings.loading)).toBeNull(), WAIT)
    expect(screen.queryByRole('link', { name: '練這個特約' })).toBeNull()
  })
})
