/**
 * What the phone's bottom toolbar (components/MobileToolbar.tsx, e9-t09) asks the page to open.
 * The page owns those panels (閱讀設定 with its page actions, 本頁 with its sections), so the
 * toolbar sends a window event instead of holding their state.
 */
export const toolbarEvents = {
  /** Toggles the page's 閱讀設定 panel (ReadingSettingsButton) */
  reading: 'bridgehall:reading-settings',
  /** Opens the convention page's 本頁 list */
  onThisPage: 'bridgehall:on-this-page',
} as const

export const sendToolbarEvent = (name: string) => window.dispatchEvent(new Event(name))
