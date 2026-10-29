import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError, type Me, type Permission, type RegisterResult } from '../lib/api.ts'

/**
 * The signed-in member, with the same account as TKU BridgeTable (淡江牌桌). `undefined` while the
 * session is being checked, `null` when signed out. The whole site needs an account (2026-10-29,
 * `SignedIn` in App.tsx); editing, importing and the admin page need permissions too.
 */
interface Auth {
  user: Me | null | undefined
  can: (permission: Permission) => boolean
  login: (username: string, password: string) => Promise<void>
  /** Signs in the club's very first account; every later registration waits for an admin */
  register: (username: string, password: string, inviteCode: string, note: string) => Promise<RegisterResult>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<Auth | null>(null)

/**
 * The member last signed in on this device: the pages show at once instead of waiting for
 * `/api/me`, and the handbook still opens offline (the PWA) when the Worker cannot be reached; only
 * a 401 from it means signed out. Cleared when signing out.
 */
const ME_KEY = 'tku-bridgebook:me'
function keep(user: Me | null) {
  try {
    if (user) localStorage.setItem(ME_KEY, JSON.stringify(user))
    else localStorage.removeItem(ME_KEY)
  } catch {
    // Without storage the site just needs the network to know who is signed in
  }
  return user
}
function kept(): Me | null {
  try {
    return JSON.parse(localStorage.getItem(ME_KEY) ?? 'null') as Me | null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // The member last signed in here shows at once, before the Worker confirms it (or says 401)
  const [user, setUser] = useState<Me | null | undefined>(() => kept() ?? undefined)

  const refresh = useCallback(
    () =>
      api
        .me()
        .then(({ user }) => keep(user))
        .catch((error) => (error instanceof ApiError && error.status === 401 ? keep(null) : kept()))
        // The same member as before keeps the same object, so nothing re-renders for nothing
        .then((next) => setUser((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))),
    [],
  )

  // Again whenever the page comes back to the front: a new avatar or name set on TKU-BridgeTable
  // shows here without reloading (both sites read the same account), and so does signing out there
  useEffect(() => {
    void refresh()
    const onShow = () => document.visibilityState === 'visible' && void refresh()
    document.addEventListener('visibilitychange', onShow)
    return () => document.removeEventListener('visibilitychange', onShow)
  }, [refresh])

  const login = useCallback(async (username: string, password: string) => {
    setUser(keep((await api.login(username, password)).user))
  }, [])

  const register = useCallback(async (username: string, password: string, inviteCode: string, note: string) => {
    const result = await api.register(username, password, inviteCode, note)
    if ('user' in result) setUser(keep(result.user))
    return result
  }, [])

  const logout = useCallback(async () => {
    await api.logout().catch(() => undefined)
    setUser(keep(null))
  }, [])

  const value = useMemo(
    () => ({
      user,
      can: (permission: Permission) => !!user?.permissions.includes(permission),
      login,
      register,
      logout,
      refresh,
    }),
    [user, login, register, logout, refresh],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useAuth(): Auth {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
