import html from '../../index.html?raw'
import manifestText from '../../public/manifest.webmanifest?raw'

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
