import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, type Me, type Permission, type RegisterResult } from '../lib/api.ts'

/**
 * The signed-in member, with the same account as TKU BridgeTable (淡江牌桌). `undefined` while the
 * session is being checked, `null` when signed out. Reading the handbook needs no account;
 * editing, importing and the admin page do.
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null | undefined>(undefined)

  const refresh = useCallback(
    () =>
      api
        .me()
        .then(({ user }) => setUser(user))
        .catch(() => setUser(null)),
    [],
  )

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(async (username: string, password: string) => {
    setUser((await api.login(username, password)).user)
  }, [])

  const register = useCallback(async (username: string, password: string, inviteCode: string, note: string) => {
    const result = await api.register(username, password, inviteCode, note)
    if ('user' in result) setUser(result.user)
    return result
  }, [])

  const logout = useCallback(async () => {
    await api.logout().catch(() => undefined)
    setUser(null)
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
