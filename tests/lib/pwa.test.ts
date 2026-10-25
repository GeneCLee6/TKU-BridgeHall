import html from '../../index.html?raw'
import { act, renderHook } from '@testing-library/react'
import manifestText from '../../public/manifest.webmanifest?raw'
import { useUpdate, watchForUpdates } from '../../src/lib/pwa.ts'

/** The installable app: manifest, icons and the tags phones read from index.html */
describe('phone app (PWA)', () => {
  const manifest = JSON.parse(manifestText) as {
    short_name: string
    display: string
    start_url: string
    icons: { src: string; purpose: string }[]
  }
  const shipped = Object.keys(import.meta.glob('../../public/*')).map((p) =>
    p.replace('../../public', ''),
  )

  it('names the app 淡江橋譜 and opens full screen', () => {
    expect(manifest.short_name).toBe('淡江橋譜')
    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBe('/')
  })

  it('ships every icon the manifest lists, including a maskable one', () => {
    manifest.icons.forEach((icon) => expect(shipped).toContain(icon.src))
    expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true)
  })

  it('links the manifest, the iPhone icon and the service worker', () => {
    expect(html).toContain('href="/manifest.webmanifest"')
    expect(html).toContain('href="/apple-touch-icon.png"')
    expect(shipped).toContain('/apple-touch-icon.png')
    expect(shipped).toContain('/sw.js')
  })
})

describe('new versions', () => {
  const worker = () =>
    Object.assign(new EventTarget(), { state: 'installing', postMessage: vi.fn() }) as unknown as ServiceWorker & {
      postMessage: ReturnType<typeof vi.fn>
    }
  const setUp = (controller: object | null) => {
    const registration = Object.assign(new EventTarget(), {
      waiting: null as ServiceWorker | null,
      installing: null as ServiceWorker | null,
      update: vi.fn(async () => {}),
    })
    const container = Object.assign(new EventTarget(), { controller })
    watchForUpdates(
      registration as unknown as ServiceWorkerRegistration,
      container as unknown as ServiceWorkerContainer,
    )
    const install = (w: ServiceWorker) => {
      registration.installing = w
      registration.dispatchEvent(new Event('updatefound'))
      Object.assign(w, { state: 'installed' })
      w.dispatchEvent(new Event('statechange'))
    }
    return { registration, install }
  }

  it('offers a new version once it has installed, and switches to it on reload', () => {
    const { result } = renderHook(() => useUpdate())
    expect(result.current.available).toBe(false)
    const { install } = setUp({})
    const next = worker()
    act(() => install(next))
    expect(result.current.available).toBe(true)
    result.current.reload()
    expect(next.postMessage).toHaveBeenCalledWith({ type: 'skip-waiting' })
  })

  it('checks for a new version when the page comes back into view', () => {
    const { registration } = setUp({})
    document.dispatchEvent(new Event('visibilitychange'))
    expect(registration.update).toHaveBeenCalled()
  })
})
