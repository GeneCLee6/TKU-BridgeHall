import { render, screen } from '@testing-library/react'
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
})
