import { avatarUrl, FILE_LIMITS } from '../../src/lib/account.ts'
import { avatarInitials, avatarSlot } from '../../src/lib/avatar.ts'
import { clampCrop, encodeAvatar, initialCrop, moveCrop, sourceSquare, zoomCrop } from '../../src/lib/avatarImage.ts'
import { fitWithin, uploadPrepared } from '../../src/lib/imageUpload.ts'
import { avatarColors, onAvatar } from '../../src/styles/avatarColors.ts'

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

describe('default avatars (e11-t03)', () => {
  it('takes one character of a Chinese name and up to two capitals of a Latin one', () => {
    expect(avatarInitials('王小明')).toBe('王')
    expect(avatarInitials('Gene Lee')).toBe('GL')
    expect(avatarInitials('amy')).toBe('A')
    expect(avatarInitials('amy_chen.tw')).toBe('AC')
    expect(avatarInitials('  ')).toBe('?')
  })

  it('gives the same id the same colour, spread over all of them', () => {
    expect(avatarSlot('u1', 10)).toBe(avatarSlot('u1', 10))
    const slots = new Set(Array.from({ length: 200 }, (_, i) => avatarSlot(`user-${i}`, 10)))
    expect(slots.size).toBe(10)
  })

  it('keeps the initials readable on every colour (4.5:1)', () => {
    for (const colour of avatarColors) expect((luminance(onAvatar) + 0.05) / (luminance(colour) + 0.05)).toBeGreaterThanOrEqual(4.5)
  })

  it("points at the member's picture by version", () => {
    expect(avatarUrl('u 1', 42)).toBe('/api/avatar/u%201?v=42')
  })
})

describe('cropping (e11-t03)', () => {
  const image = { width: 1000, height: 500 }
  const frame = 256

  it('starts zoomed out with the short side filling the frame, centred', () => {
    const crop = initialCrop(image, frame)
    expect(crop.zoom).toBe(1)
    expect(crop.y).toBe(0)
    expect(crop.x).toBeCloseTo((256 - 512) / 2)
    expect(sourceSquare(crop, image, frame)).toEqual({ sx: 250, sy: 0, size: 500 })
  })

  it('never lets an edge of the picture show', () => {
    const crop = initialCrop(image, frame)
    expect(moveCrop(crop, 1000, 1000, image, frame)).toMatchObject({ x: 0, y: 0 })
    expect(moveCrop(crop, -1000, 0, image, frame).x).toBeCloseTo(256 - 512)
    expect(clampCrop({ zoom: 0.2, x: 0, y: 0 }, image, frame).zoom).toBe(1)
    expect(zoomCrop(crop, 99, image, frame).zoom).toBe(4)
  })

  it('writes the smallest good-enough file, WebP first, then JPEG', async () => {
    const sizes: Record<string, number> = { 'image/webp': 200_000, 'image/jpeg': 40_000 }
    const tried: string[] = []
    const blob = await encodeAvatar(async (type, quality) => {
      tried.push(`${type}@${quality}`)
      return new Blob([new Uint8Array(Math.round(sizes[type] * quality))], { type })
    })
    expect(blob?.type).toBe('image/jpeg')
    expect(tried[0]).toBe('image/webp@0.86')
    // A browser that cannot write WebP gives PNG: straight on to JPEG
    const fallback = await encodeAvatar(async (type) => new Blob(['x'], { type: type === 'image/webp' ? 'image/png' : type }))
    expect(fallback?.type).toBe('image/jpeg')
  })
})

describe('uploading a picture (e11-t02)', () => {
  it('shrinks to the long side, never enlarging', () => {
    expect(fitWithin({ width: 4000, height: 3000 }, 2048)).toEqual({ width: 2048, height: 1536 })
    expect(fitWithin({ width: 300, height: 4800 }, 480)).toEqual({ width: 30, height: 480 })
    expect(fitWithin({ width: 200, height: 100 }, 480)).toEqual({ width: 200, height: 100 })
  })

  it('takes a pass, then puts the picture and its thumbnail', async () => {
    const calls: { method: string; path: string; body: unknown; type?: string }[] = []
    vi.stubGlobal(
      'fetch',
      vi.fn(async (path: string, init: RequestInit) => {
        const type = new Headers(init.headers).get('Content-Type') ?? undefined
        calls.push({ method: init.method ?? 'GET', path, body: typeof init.body === 'string' ? JSON.parse(init.body) : init.body, type })
        if (path === '/api/files/ticket')
          return Response.json({ key: 'post/a.webp', uploadUrl: '/api/files/upload/t', thumbUrl: '/api/files/upload/t?part=thumb', expires: 1 })
        const thumb = path.endsWith('thumb')
        return Response.json({ file: { key: 'post/a.webp', type: 'image/webp', size: 3, url: '/api/files/post/a.webp?e=1&s=x', ...(thumb ? { thumbUrl: '/t' } : {}) } })
      }),
    )
    try {
      const picture = new Blob(['abc'], { type: 'image/webp' })
      const thumb = new Blob(['a'], { type: 'image/jpeg' })
      const file = await uploadPrepared(picture, thumb, 'post')
      expect(file.thumbUrl).toBe('/t')
      expect(calls.map((c) => `${c.method} ${c.path}`)).toEqual([
        'POST /api/files/ticket',
        'PUT /api/files/upload/t',
        'PUT /api/files/upload/t?part=thumb',
      ])
      expect(calls[0].body).toEqual({ purpose: 'post', type: 'image/webp', size: 3 })
      expect(calls[1]).toMatchObject({ body: picture, type: 'image/webp' })
      expect(calls[2]).toMatchObject({ body: thumb, type: 'image/jpeg' })
      await expect(uploadPrepared(new Blob(['x'], { type: 'image/gif' }), null, 'post')).rejects.toThrow(TypeError)
      expect(FILE_LIMITS.maxBytes).toBe(2 * 1024 * 1024)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
