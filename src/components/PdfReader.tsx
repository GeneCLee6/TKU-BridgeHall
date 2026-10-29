import { ChevronLeft, ChevronRight, Maximize, Minimize, ZoomIn, ZoomOut } from 'lucide-react'
import * as pdfjs from 'pdfjs-dist'
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import styled, { css } from 'styled-components'
import { ebookStrings as t } from '../pages/ebookStrings.ts'
import { printColors } from '../styles/tokens.ts'
import { Button, ErrorText, Input, Muted } from './ui.tsx'

/**
 * 站內 PDF 閱讀器（e5-t10, AC-5.5）: pdf.js draws one page at a time on a canvas, fitted to the
 * reader's width (so it works on a phone) times the zoom, sharp on high-density screens. Previous
 * and next page by button, arrow keys or a swipe; a page number to jump to; full screen (the
 * element's own, or a fixed cover where the browser has none, as on an iPhone).
 *
 * Only the e-book page loads this (lazy), so pdf.js (~0.5 MB, its worker ~1.3 MB) never touches the
 * home page. CJK PDFs without embedded fonts need Adobe's CMaps; they, the standard fonts and the
 * image decoders come from the CDN copy of the same pdf.js version, fetched only when a PDF asks.
 * `onPage` tells the page which page is showing (reading progress, e5-t14).
 */

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
const CDN = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/`

const ZOOMS = [0.75, 1, 1.25, 1.5, 2, 3]
const SWIPE_PX = 60

interface Props {
  url: string
  title: string
  initialPage?: number
  onPage?: (page: number, pages: number) => void
}

export function PdfReader({ url, title, initialPage = 1, onPage }: Props) {
  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [doc, setDoc] = useState<pdfjs.PDFDocumentProxy | null>(null)
  const [failed, setFailed] = useState(false)
  const [page, setPage] = useState(initialPage)
  const [typed, setTyped] = useState(String(initialPage))
  const [zoom, setZoom] = useState(1)
  const [width, setWidth] = useState(0)
  const [full, setFull] = useState(false)
  // Full screen without the Fullscreen API: a fixed cover over the page
  const [cover, setCover] = useState(false)
  const touch = useRef<number | null>(null)

  // A new address is a new reader (the page gives it a `key`), so nothing to reset here
  useEffect(() => {
    const task = pdfjs.getDocument({
      url,
      cMapUrl: `${CDN}cmaps/`,
      cMapPacked: true,
      standardFontDataUrl: `${CDN}standard_fonts/`,
      wasmUrl: `${CDN}wasm/`,
      iccUrl: `${CDN}iccs/`,
    })
    task.promise.then(
      (loaded) => {
        setDoc(loaded)
        setPage((p) => Math.min(Math.max(1, p), loaded.numPages))
      },
      () => setFailed(true),
    )
    return () => void task.destroy()
  }, [url])

  // The reader's width, so the page fits it
  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const measure = () => setWidth(frame.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const changed = () => setFull(document.fullscreenElement === frameRef.current)
    document.addEventListener('fullscreenchange', changed)
    return () => document.removeEventListener('fullscreenchange', changed)
  }, [])

  useEffect(() => {
    if (!doc || !width || !canvasRef.current) return
    let cancelled = false
    let render: { cancel(): void; promise: Promise<void> } | undefined
    const canvas = canvasRef.current
    void doc.getPage(page).then((p) => {
      if (cancelled) return
      const base = p.getViewport({ scale: 1 })
      const scale = (width / base.width) * zoom
      const ratio = window.devicePixelRatio || 1
      const viewport = p.getViewport({ scale: scale * ratio })
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      canvas.style.width = `${Math.floor(viewport.width / ratio)}px`
      canvas.style.height = `${Math.floor(viewport.height / ratio)}px`
      render = p.render({ canvas, viewport })
      render.promise.catch(() => {})
    })
    setTyped(String(page))
    onPage?.(page, doc.numPages)
    return () => {
      cancelled = true
      render?.cancel()
    }
  }, [doc, page, width, zoom, onPage])

  const pages = doc?.numPages ?? 0
  const go = useCallback((n: number) => setPage((p) => (pages ? Math.min(Math.max(1, n), pages) : p)), [pages])

  const toggleFull = () => {
    const frame = frameRef.current
    if (!frame) return
    if (cover) return setCover(false)
    if (full) return void document.exitFullscreen()
    if (frame.requestFullscreen) frame.requestFullscreen().catch(() => setCover(true))
    else setCover(true)
  }

  const jump = (event: FormEvent) => {
    event.preventDefault()
    const n = Number(typed)
    if (Number.isInteger(n)) go(n)
    else setTyped(String(page))
  }

  const onKey = (event: React.KeyboardEvent) => {
    if ((event.target as HTMLElement).tagName === 'INPUT') return
    if (event.key === 'ArrowRight' || event.key === 'PageDown') go(page + 1)
    else if (event.key === 'ArrowLeft' || event.key === 'PageUp') go(page - 1)
    else if (event.key === 'Escape' && cover) setCover(false)
    else return
    event.preventDefault()
  }

  const zoomIndex = ZOOMS.indexOf(zoom)
  const expanded = full || cover

  return (
    <Frame
      ref={frameRef}
      $cover={cover}
      role="region"
      aria-label={t.reader.label(title)}
      tabIndex={0}
      onKeyDown={onKey}
    >
      <Bar>
        <Button type="button" $small onClick={() => go(page - 1)} disabled={page <= 1 || !doc} aria-label={t.reader.prev}>
          <ChevronLeft size={18} aria-hidden />
        </Button>
        <PageForm onSubmit={jump}>
          <PageInput
            aria-label={t.reader.page}
            inputMode="numeric"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onBlur={jump}
            disabled={!doc}
          />
          <span>{t.reader.of(pages)}</span>
        </PageForm>
        <Button type="button" $small onClick={() => go(page + 1)} disabled={!doc || page >= pages} aria-label={t.reader.next}>
          <ChevronRight size={18} aria-hidden />
        </Button>
        <Spacer />
        <Button type="button" $small $variant="ghost" onClick={() => setZoom(ZOOMS[zoomIndex - 1])} disabled={zoomIndex <= 0} aria-label={t.reader.zoomOut}>
          <ZoomOut size={18} aria-hidden />
        </Button>
        <Button
          type="button"
          $small
          $variant="ghost"
          onClick={() => setZoom(ZOOMS[zoomIndex + 1])}
          disabled={zoomIndex >= ZOOMS.length - 1}
          aria-label={t.reader.zoomIn}
        >
          <ZoomIn size={18} aria-hidden />
        </Button>
        <Button type="button" $small $variant="ghost" onClick={toggleFull} aria-label={expanded ? t.reader.exitFullscreen : t.reader.fullscreen}>
          {expanded ? <Minimize size={18} aria-hidden /> : <Maximize size={18} aria-hidden />}
        </Button>
      </Bar>
      <Sheet
        onTouchStart={(e) => (touch.current = e.touches.length === 1 && zoom === 1 ? e.touches[0].clientX : null)}
        onTouchEnd={(e) => {
          const start = touch.current
          touch.current = null
          if (start === null) return
          const moved = e.changedTouches[0].clientX - start
          if (Math.abs(moved) >= SWIPE_PX) go(moved < 0 ? page + 1 : page - 1)
        }}
      >
        {failed ? (
          <ErrorText role="alert">{t.reader.failed}</ErrorText>
        ) : !doc ? (
          <Muted role="status">{t.reader.loading}</Muted>
        ) : null}
        <Canvas ref={canvasRef} hidden={!doc || failed} aria-label={`${title} ${page}${t.reader.of(pages)}`} role="img" />
      </Sheet>
    </Frame>
  )
}

const Frame = styled.div<{ $cover: boolean }>`
  /* Positioned, so a visually hidden label inside stays within the scrolling frame (CLAUDE.md) */
  position: relative;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 60vh;
  border: ${({ theme }) => theme.borders.panel} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.panel};
  background: ${({ theme }) => theme.colors.surface};
  overflow: hidden;

  &:fullscreen {
    border: 0;
    border-radius: 0;
    background: ${({ theme }) => theme.colors.bg};
  }

  ${({ $cover }) =>
    $cover &&
    css`
      position: fixed;
      inset: 0;
      z-index: 1000;
      border: 0;
      border-radius: 0;
      background: ${({ theme }) => theme.colors.bg};
    `}
`

const Bar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.space(2)};
  padding: ${({ theme }) => theme.space(2)};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const Spacer = styled.span`
  flex: 1;
`

const PageForm = styled.form`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space(1)};
  font-variant-numeric: tabular-nums;
`

const PageInput = styled(Input)`
  width: 4rem;
  text-align: center;
`

const Sheet = styled.div`
  overflow: auto;
  padding: ${({ theme }) => theme.space(2)};
  display: grid;
  justify-items: center;
  align-content: start;
  touch-action: pan-y pinch-zoom;
`

const Canvas = styled.canvas`
  display: block;
  max-width: none;
  box-shadow: ${({ theme }) => theme.shadows.panel};
  /* A PDF page is paper: white in every mode, like a printed page */
  background: ${printColors.paper};
`
