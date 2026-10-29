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
    expect(boxes).toHaveLength(20)
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

describe('叫品題 (e6-t07) and a lesson’s questions (e4-t10)', () => {
  it('practises a lesson’s questions and answers a call question on the bidding box', async () => {
    const user = userEvent.setup()
    renderAt('/practice?lesson=from-zero%2Flesson-7')
    // 叫牌觀念 has one question: the worked example under 「EX) 1♦ 1♠ 2♣ 2♠ 3♦ ？」, whose answer is PASS
    const mode = await screen.findByRole('combobox', { name: /出題範圍/ }, WAIT)
    await waitFor(() => expect(mode).toHaveDisplayValue('這一課：叫牌觀念、防禦與打牌（自然制講義）（1 題）'))
    expect(screen.getByText('符合條件的題目共 1 題。')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '開始練習' }))

    const prompt = await screen.findByText((_, el) => el?.tagName === 'P' && el.textContent === 'EX) 1♦ 1♠ 2♣ 2♠ 3♦ ？', undefined, WAIT)
    expect(prompt).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '你叫什麼？' })).toHaveFocus()
    const box = within(screen.getByRole('group', { name: '叫牌盒' }))
    expect(box.getAllByRole('button')).toHaveLength(38)
    await user.click(box.getByRole('button', { name: 'Pass' }))
    expect(await screen.findByRole('heading', { name: '答對了！' })).toHaveFocus()
    expect(box.getByRole('button', { name: 'Pass' })).toHaveAttribute('aria-pressed', 'true')
    // The source's own hand and its label, under the answer
    expect(within(screen.getByRole('region', { name: '原文的牌例' })).getByText('PASS')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '看結果' }))
    expect(await screen.findByRole('heading', { name: /^答對 1／1 題$/ })).toBeInTheDocument()
  })

  it('marks a wrong call and the source’s call', async () => {
    const user = userEvent.setup()
    renderAt('/practice?lesson=from-zero%2Flesson-7')
    await screen.findByText('符合條件的題目共 1 題。', undefined, WAIT)
    await user.click(screen.getByRole('button', { name: '開始練習' }))
    const box = within(await screen.findByRole('group', { name: '叫牌盒' }, WAIT))
    await user.click(box.getByRole('button', { name: '3黑桃' }))
    expect(await screen.findByRole('heading', { name: '答錯了。' })).toBeInTheDocument()
    expect(screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === '你叫的：3♠ · 原文叫：Pass')).toBeInTheDocument()
  })

  it('filters by kind', async () => {
    const user = userEvent.setup()
    renderAt('/practice')
    const kind = await screen.findByRole('combobox', { name: /題型/ }, WAIT)
    await screen.findByRole('checkbox', { name: /^雷本索特約/ }, WAIT)
    await user.selectOptions(kind, 'call')
    expect(await screen.findByText('符合條件的題目共 14 題。')).toBeInTheDocument()
  })
})
