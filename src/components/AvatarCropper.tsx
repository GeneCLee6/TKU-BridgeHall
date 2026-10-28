import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type WheelEvent } from 'react'
import styled, { useTheme } from 'styled-components'
import { accountApi, AVATAR_MAX_BYTES, AVATAR_PIXELS } from '../lib/account.ts'
import { errorText } from '../lib/api.ts'
import {
  AVATAR_MAX_ZOOM,
  canvasEncoder,
  clampCrop,
  encodeAvatar,
  initialCrop,
  moveCrop,
  sourceSquare,
  zoomCrop,
  type Crop,
} from '../lib/avatarImage.ts'
import { accountStrings as t } from '../strings-account.ts'
import { strings } from '../strings.ts'
import { Button, ErrorText, Muted } from './ui.tsx'

/**
 * 裁切頭像 (e11-t03, the same as TKU-BridgeTable's e1-t34): the chosen picture under a square
 * frame, moved by dragging (or the arrow keys) and zoomed with the slider (or the wheel, or + and
 * -). The frame's canvas is the upload itself, 256×256; the circle over it is only CSS, so the
 * saved square has no mask drawn in. Shown in place on the account page, not as a dialog.
 */

const FRAME = AVATAR_PIXELS

/** Reads the picture; null when the browser cannot */
function loadImage(file: Blob): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image.naturalWidth && image.naturalHeight ? image : null)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    image.src = url
  })
}

export function AvatarCropper({ file, onClose, onSaved }: { file: File; onClose: () => void; onSaved: () => void }) {
  const theme = useTheme()
  const titleId = useId()
  const hintId = useId()
  const canvas = useRef<HTMLCanvasElement>(null)
  const drag = useRef<{ id: number; x: number; y: number } | null>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [crop, setCrop] = useState<Crop | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const size = image ? { width: image.naturalWidth, height: image.naturalHeight } : null

  useEffect(() => {
    let cancelled = false
    void loadImage(file).then((loaded) => {
      if (cancelled) return
      if (!loaded) return setError(t.avatarUnreadable)
      setImage(loaded)
      setCrop(initialCrop({ width: loaded.naturalWidth, height: loaded.naturalHeight }, FRAME))
    })
    return () => {
      cancelled = true
    }
  }, [file])

  // The frame shows exactly what will be uploaded
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d')
    if (!ctx || !image || !crop) return
    const { sx, sy, size: side } = sourceSquare(crop, { width: image.naturalWidth, height: image.naturalHeight }, FRAME)
    ctx.imageSmoothingQuality = 'high'
    // A transparent picture gets the page's surface behind it, not black
    ctx.fillStyle = theme.colors.surface
    ctx.fillRect(0, 0, FRAME, FRAME)
    ctx.drawImage(image, sx, sy, side, side, 0, 0, FRAME, FRAME)
  }, [image, crop, theme])

  /** Frame pixels per screen pixel: the frame shrinks on a narrow phone */
  const ratio = () => FRAME / (canvas.current?.getBoundingClientRect().width || FRAME)

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const from = drag.current
    if (!from || from.id !== event.pointerId || !crop || !size) return
    const r = ratio()
    setCrop(moveCrop(crop, (event.clientX - from.x) * r, (event.clientY - from.y) * r, size, FRAME))
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
  }
  const onPointerUp = () => {
    drag.current = null
  }
  const onWheel = (event: WheelEvent<HTMLCanvasElement>) => {
    if (!crop || !size) return
    const rect = event.currentTarget.getBoundingClientRect()
    const r = ratio()
    const zoom = crop.zoom * (event.deltaY < 0 ? 1.1 : 1 / 1.1)
    setCrop(zoomCrop(crop, zoom, size, FRAME, (event.clientX - rect.left) * r, (event.clientY - rect.top) * r))
  }
  const onKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    if (event.key === 'Escape') return onClose()
    if (!crop || !size) return
    const step = event.shiftKey ? 32 : 8
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [step, 0],
      ArrowRight: [-step, 0],
      ArrowUp: [0, step],
      ArrowDown: [0, -step],
    }
    if (moves[event.key]) setCrop(moveCrop(crop, ...moves[event.key], size, FRAME))
    else if (event.key === '+' || event.key === '=') setCrop(zoomCrop(crop, crop.zoom * 1.1, size, FRAME))
    else if (event.key === '-') setCrop(zoomCrop(crop, crop.zoom / 1.1, size, FRAME))
    else return
    event.preventDefault()
  }

  const save = async () => {
    if (!canvas.current || !crop) return
    setBusy(true)
    setError(null)
    try {
      const picture = await encodeAvatar(canvasEncoder(canvas.current))
      if (!picture) {
        setError(t.avatarTooLarge(AVATAR_MAX_BYTES / 1024))
        setBusy(false)
        return
      }
      await accountApi.uploadAvatar(picture)
      onSaved()
    } catch (err) {
      setError(errorText(err))
      setBusy(false)
    }
  }

  return (
    <Box role="group" aria-labelledby={titleId} aria-describedby={hintId}>
      <Title id={titleId}>{t.cropTitle}</Title>
      <Muted id={hintId}>{t.cropHint}</Muted>
      <Stage>
        <Frame
          ref={canvas}
          width={FRAME}
          height={FRAME}
          tabIndex={0}
          role="img"
          aria-label={t.cropFrame}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
        />
      </Stage>
      <Zoom>
        {t.cropZoom}
        <input
          type="range"
          min={1}
          max={AVATAR_MAX_ZOOM}
          step={0.01}
          value={crop?.zoom ?? 1}
          disabled={!crop}
          onChange={(e) => crop && size && setCrop(clampCrop(zoomCrop(crop, Number(e.target.value), size, FRAME), size, FRAME))}
        />
      </Zoom>
      {error && <ErrorText role="alert">{error}</ErrorText>}
      <Buttons>
        <Button type="button" $variant="ghost" onClick={onClose}>
          {strings.cancel}
        </Button>
        <Button type="button" $variant="primary" disabled={!crop || busy} onClick={() => void save()}>
          {busy ? t.saving : strings.save}
        </Button>
      </Buttons>
    </Box>
  )
}

const Box = styled.div`
  width: 100%;
  max-width: 360px;
  margin-top: ${({ theme }) => theme.space(4)};
  padding: ${({ theme }) => theme.space(4)};
  border: ${({ theme }) => theme.borders.control} ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.shape.panel};
  background: ${({ theme }) => theme.colors.surfaceAlt};
`

const Title = styled.h3`
  margin: 0 0 ${({ theme }) => theme.space(2)};
  font-size: 1.0625rem;
`

const Stage = styled.div`
  position: relative;
  width: min(${FRAME}px, 100%);
  aspect-ratio: 1;
  margin: ${({ theme }) => theme.space(3)} auto;
  overflow: hidden;
  border-radius: ${({ theme }) => theme.shape.control};
  touch-action: none;

  /* The round avatar others will see; outside it is dimmed */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    box-shadow: 0 0 0 ${FRAME}px ${({ theme }) => theme.colors.overlay};
    pointer-events: none;
  }
`

const Frame = styled.canvas`
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
  &:active {
    cursor: grabbing;
  }
  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: -3px;
  }
`

const Zoom = styled.label`
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: ${({ theme }) => theme.space(3)};
  font-size: 0.875rem;
  font-weight: 600;
`

const Buttons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space(2)};
  margin-top: ${({ theme }) => theme.space(4)};
`
