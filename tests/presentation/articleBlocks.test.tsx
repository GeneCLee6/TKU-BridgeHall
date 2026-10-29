import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'styled-components'
import { BlockView } from '../../src/components/BlockView.tsx'
import { ArticleFilesContext } from '../../src/state/ArticleFilesContext.tsx'
import { createTheme } from '../../src/styles/tokens.ts'
import type { ArticleBlock } from '../../src/types/article.ts'

/** The blocks only articles have (e5-t01, e5-t12); test data only */
const PICTURE = 'article/0123456789abcdef01234567.webp'

const themed = (node: React.ReactNode, files: Record<string, { url: string }> = {}) =>
  render(
    <ThemeProvider theme={createTheme('light')}>
      <ArticleFilesContext.Provider value={files}>{node}</ArticleFilesContext.Provider>
    </ThemeProvider>,
  )

describe('article blocks', () => {
  it('shows headings at their level', () => {
    themed(
      <>
        <BlockView block={{ kind: 'heading', level: 2, text: '測試小標' }} />
        <BlockView block={{ kind: 'heading', level: 3, text: '測試次小標' }} />
      </>,
    )
    expect(screen.getByRole('heading', { level: 2, name: '測試小標' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: '測試次小標' })).toBeInTheDocument()
  })

  it('shows a quote with where it is from', () => {
    const { container } = themed(<BlockView block={{ kind: 'quote', text: '測試引文', cite: '測試出處' }} />)
    expect(container.querySelector('blockquote')).toHaveTextContent('測試引文')
    expect(screen.getByText('— 測試出處')).toBeInTheDocument()
  })

  it('shows a picture by the address the Worker signed', () => {
    const block: ArticleBlock = { kind: 'image', src: PICTURE, alt: '測試替代文字', caption: '測試圖說' }
    themed(<BlockView block={block} />, { [PICTURE]: { url: `/api/files/${PICTURE}?e=1&s=x` } })
    const img = screen.getByRole('img', { name: '測試替代文字' })
    expect(img.tagName).toBe('IMG')
    expect(img).toHaveAttribute('src', `/api/files/${PICTURE}?e=1&s=x`)
    expect(screen.getByText('測試圖說')).toBeInTheDocument()
  })

  it('shows the description when there is no address (no R2 bucket yet)', () => {
    themed(<BlockView block={{ kind: 'image', src: PICTURE, alt: '測試替代文字' }} />)
    const box = screen.getByRole('img', { name: '測試替代文字' })
    expect(box.tagName).toBe('DIV')
    expect(box).toHaveTextContent('圖片暫時無法顯示：測試替代文字')
  })

  it('draws a deal with its caption, leaving out the seats with no cards', async () => {
    const block: ArticleBlock = {
      kind: 'deal',
      deal: { hands: { N: ['SA', 'SK', 'HT'], E: [], S: ['SQ', 'D2'], W: [] }, dealer: 'S', vul: 'Both' },
      caption: '測試牌例說明',
    }
    themed(<BlockView block={block} />)
    const diagram = await screen.findByRole('group', { name: '牌例' })
    expect(within(diagram).getByRole('group', { name: '北家' })).toHaveTextContent('A K')
    expect(within(diagram).getByRole('group', { name: '北家' })).toHaveTextContent('10')
    expect(within(diagram).getByRole('group', { name: '東家' })).not.toHaveTextContent('—')
    expect(diagram).toHaveTextContent('發牌：南')
    expect(diagram).toHaveTextContent('雙有身價')
    expect(screen.getByText('測試牌例說明')).toBeInTheDocument()
  })

  it('steps through the play a trick at a time and opens the whole list', async () => {
    const user = userEvent.setup()
    const block: ArticleBlock = {
      kind: 'play',
      contract: '4SX',
      declarer: 'S',
      tricks: [['HK', 'H2', 'HA', 'S2'], ['SA', 'S3', 'S4', 'S5'], ['D2']],
      caption: '測試出牌說明',
    }
    themed(<BlockView block={block} />)
    const box = await screen.findByRole('group', { name: /^出牌過程/ })
    expect(box).toHaveTextContent('合約 4♠ X')
    expect(box).toHaveTextContent('莊家：南家')
    expect(screen.getByRole('status')).toHaveTextContent('第 1 墩／共 3 墩')
    expect(box).toHaveTextContent('莊家方 1 墩・防守方 0 墩')
    expect(screen.getByRole('button', { name: '上一墩' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '下一墩' }))
    await user.click(screen.getByRole('button', { name: '下一墩' }))
    expect(screen.getByRole('status')).toHaveTextContent('第 3 墩／共 3 墩')
    expect(screen.getByRole('button', { name: '下一墩' })).toBeDisabled()
    expect(box).toHaveTextContent('莊家方 2 墩・防守方 0 墩')

    const toggle = screen.getByRole('button', { name: '展開全部 3 墩' })
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const rows = within(screen.getByRole('table', { name: '每一墩的出牌' })).getAllByRole('row')
    expect(rows).toHaveLength(4)
    expect(rows[1]).toHaveTextContent('西 ♥K')
    expect(rows[1]).toHaveTextContent('南 ♠2')
    expect(within(rows[1]).getAllByRole('cell').at(-1)).toHaveTextContent('南')
    expect(within(rows[3]).getAllByRole('cell').at(-1)).toHaveTextContent('—')
    expect(screen.getByText('測試出牌說明')).toBeInTheDocument()
  })
})
