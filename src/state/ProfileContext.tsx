import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import { api, CLUB_PROFILE_ID, type ProfileSummary } from '../lib/api.ts'
import type { ProfileView } from '../lib/profiles.ts'
import { useAuth } from './AuthContext.tsx'
import { ContentContext, useContent, type Content } from './ContentContext.tsx'

/**
 * The system profile (制度集) the reader reads with (e1-t11). Signed out there is only the club's,
 * and nothing about profiles is fetched: the handbook shows as it is. Signed in, the list comes
 * from the Worker and the choice is kept with the account (e1-t16); a choice the account could
 * not save yet (offline) waits in localStorage and is sent again next time. lib/profiles.ts is
 * loaded only for a signed-in reader, and the profiles themselves only when the chosen one's chain
 * changes something. `ProfiledContent` gives the handbook page the profile's view of the content.
 *
 * A link may name a profile, `?profile=<id>` (e7-t05: 淡江牌桌's calls link to the profile their
 * words came from): the page shows that one, for as long as the reader does not choose another,
 * without changing the account's choice. Only a profile the reader may read (one in the list)
 * takes effect; otherwise the reader's own shows.
 */

type Status = 'idle' | 'loading' | 'failed'

interface Profiles {
  /** What a signed-in reader may switch between; empty when signed out */
  list: ProfileSummary[]
  /** The profile shown: the club's unless a signed-in reader chose another that still exists */
  activeId: string
  choose: (id: string) => void
  /** Undefined while signed out or loading, or when the profile changes nothing */
  view?: ProfileView
  status: Status
}

const NONE: Profiles = { list: [], activeId: CLUB_PROFILE_ID, choose: () => {}, status: 'idle' }

const STORAGE_KEY = 'tku-bridgebook:profile'

type Choice = { user: string; id: string }

function unsaved(): Choice | undefined {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null') as Choice | null
    return value && typeof value.user === 'string' && typeof value.id === 'string'
      ? value
      : undefined
  } catch {
    return undefined
  }
}

function keep(choice: Choice | undefined) {
  try {
    if (choice) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(choice))
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Without storage an unsaved choice lasts until the page closes
  }
}

/** Sends the choice to the account; once saved it no longer waits in localStorage */
const save = (choice: Choice) =>
  api.setPreferences({ bookProfile: choice.id === CLUB_PROFILE_ID ? '' : choice.id }).then(
    () => keep(undefined),
    () => keep(choice),
  )

const ProfileContext = createContext<Profiles>(NONE)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id
  const [list, setList] = useState<ProfileSummary[]>([])
  const [choice, setChoice] = useState(unsaved)
  const [view, setView] = useState<ProfileView>()
  const [status, setStatus] = useState<Status>('idle')

  useEffect(() => {
    setList([])
    if (!userId) return
    let current = true
    api.book.profiles().then(
      (profiles) => current && setList(profiles),
      () => {},
    )
    return () => {
      current = false
    }
  }, [userId])

  // A profile a link asked for (?profile=), until the reader chooses one
  const asked = new URLSearchParams(useLocation().search).get('profile')
  const [linked, setLinked] = useState<string | null>(null)
  useEffect(() => {
    if (asked) setLinked(asked)
  }, [asked])

  const wanted = (choice?.user === userId ? choice?.id : user?.bookProfile) ?? CLUB_PROFILE_ID
  const has = (id: string | null) => list.some((p) => p.id === id)
  const activeId = has(linked) ? linked! : has(wanted) ? wanted : CLUB_PROFILE_ID

  // A choice made while the account could not be reached
  const savedId = user?.bookProfile ?? CLUB_PROFILE_ID
  useEffect(() => {
    if (choice && choice.user === userId && choice.id !== savedId) void save(choice)
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- once per account, not on every choice
  }, [userId])

  useEffect(() => {
    // The old view stays while the new one loads, so the page does not flash the club's content
    if (!list.length) {
      setView(undefined)
      setStatus('idle')
      return
    }
    let current = true
    setStatus('loading')
    import('../lib/profiles.ts')
      .then((m) => m.loadProfileView(list, activeId, api.book.profile))
      .then(
        (next) => {
          if (!current) return
          setView(next)
          setStatus('idle')
        },
        () => {
          if (!current) return
          setView(undefined)
          setStatus('failed')
        },
      )
    return () => {
      current = false
    }
  }, [list, activeId])

  const choose = useCallback(
    (id: string) => {
      if (!userId) return
      const next = { user: userId, id }
      setLinked(null)
      setChoice(next)
      keep(next)
      void save(next)
      // A profile made since the list came (a partnership just accepted) is fetched with it
      if (!list.some((p) => p.id === id)) api.book.profiles().then(setList, () => {})
    },
    [userId, list],
  )

  const value = useMemo(
    () => ({ list, activeId, choose, view, status }),
    [list, activeId, choose, view, status],
  )
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

/** Outside a ProfileProvider (component tests) there is only the club's profile */
// oxlint-disable-next-line react/only-export-components
export const useProfiles = (): Profiles => useContext(ProfileContext)

/** The content as `view` shows it: conventions it does not play left out, its overrides applied */
function lens(base: Content, view: ProfileView): Content {
  const { plays, convention, meta } = view
  const version = `${view.profile.id}@${view.profile.version}`
  return {
    ...base,
    conventions: base.conventions.filter((c) => plays(c.slug)).map(meta),
    bySlug: (slug) => {
      const found = plays(slug) ? base.bySlug(slug) : undefined
      return found && meta(found)
    },
    loaded: (slug) => {
      const found = plays(slug) ? base.loaded(slug) : undefined
      return found && convention(found)
    },
    load: (slug) =>
      plays(slug) ? base.load(slug).then((c) => c && convention(c)) : Promise.resolve(undefined),
    loadAll: () => base.loadAll().then((all) => all.filter((c) => plays(c.slug)).map(convention)),
    changed: (slug) =>
      view.changes(slug) ? `${base.changed(slug) ?? slug}~${version}` : base.changed(slug),
  }
}

/** Gives what is inside it the reader's profile's view of the content: the handbook page */
export function ProfiledContent({ children }: { children: ReactNode }) {
  const base = useContent()
  const { view } = useProfiles()
  const value = useMemo(() => (view ? lens(base, view) : base), [base, view])
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}
