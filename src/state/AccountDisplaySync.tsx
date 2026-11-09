import { useEffect, useRef } from 'react'
import { api } from '../lib/api.ts'
import { useAuth } from './AuthContext.tsx'
import { accountDisplayOf, displayFromAccount, usePreferences } from './PreferencesContext.tsx'

/**
 * 個人設定 kept with the account (AC-9.9; TKU-BridgeTable `POST /api/account/preferences`
 * `bookDisplay`), so a member sees the same style, layout and text size on every device.
 * PreferencesContext keeps working from localStorage as before; this only carries the display
 * settings between it and the account while someone is signed in:
 *
 * - Signing in, or `/api/me` bringing settings another device saved, applies the account's.
 * - An account with none yet gets this device's (the first sign-in after this was added).
 * - Saving a setting here sends them all. One that could not be sent (offline) is remembered in
 *   localStorage and sent again next time, before the account's can overwrite it.
 *
 * Renders nothing; sits inside both AuthProvider and PreferencesProvider (App.tsx).
 */
const UNSENT_KEY = 'tku-bridgebook:displayUnsent'
/** Settings changed in a row (a form's 儲存 sets several) go to the account once */
const SEND_AFTER_MS = 800

function unsentFor(userId: string): boolean {
  try {
    return window.localStorage.getItem(UNSENT_KEY) === userId
  } catch {
    return false
  }
}

function markUnsent(userId: string | null) {
  try {
    if (userId) window.localStorage.setItem(UNSENT_KEY, userId)
    else window.localStorage.removeItem(UNSENT_KEY)
  } catch {
    // Without storage an unsent change waits only until the page closes
  }
}

const same = (a: Record<string, string>, b: Record<string, string>) => JSON.stringify(a) === JSON.stringify(b)

export function AccountDisplaySync() {
  const { user } = useAuth()
  const { saved, update } = usePreferences()
  const userId = user?.id
  const accountDisplay = user?.bookDisplay
  const accountKey = accountDisplay && JSON.stringify(accountDisplay)
  // What the account is known to hold for this member: no need to send it back
  const synced = useRef<{ userId: string; display: Record<string, string> } | null>(null)
  // Read when the account's settings arrive, not on every change of them (that would put the
  // account's back over a setting just changed here)
  const savedRef = useRef(saved)
  savedRef.current = saved
  const updateRef = useRef(update)
  updateRef.current = update

  // From the account: on sign-in, and when /api/me brings what another device saved
  useEffect(() => {
    if (!userId) {
      synced.current = null
      return
    }
    const local = accountDisplayOf(savedRef.current)
    if (!accountDisplay || unsentFor(userId)) {
      // Nothing kept yet, or this device's change never arrived: this device's settings win
      synced.current = { userId, display: {} }
      return
    }
    const changes = displayFromAccount(accountDisplay)
    const applied = { ...local, ...changes }
    synced.current = { userId, display: applied }
    if (!same(applied, local)) updateRef.current(changes)
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- accountKey stands for accountDisplay
  }, [userId, accountKey])

  // To the account: whenever the display settings change while signed in
  const display = accountDisplayOf(saved)
  const displayKey = JSON.stringify(display)
  useEffect(() => {
    const known = synced.current
    if (!userId || !known || known.userId !== userId || same(known.display, display)) return
    const timer = setTimeout(() => {
      synced.current = { userId, display }
      api.setPreferences({ bookDisplay: display }).then(
        () => markUnsent(null),
        () => {
          markUnsent(userId)
          // Sent again with the next change, or on the next visit
          if (synced.current?.userId === userId) synced.current = { userId, display: {} }
        },
      )
    }, SEND_AFTER_MS)
    return () => clearTimeout(timer)
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- displayKey stands for display
  }, [userId, displayKey])

  return null
}
