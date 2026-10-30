import { useEffect, useState } from 'react'
import { usePreferences, type DisplayPrefs } from './PreferencesContext.tsx'

/**
 * A settings form over the display preferences (2026-10-30): a choice is shown at once as a
 * preview but stored only on 儲存; 取消, closing the form or leaving the page puts back what was
 * stored. Leaving the site with unsaved changes asks first.
 */
export function useDisplayDraft() {
  const prefs = usePreferences()
  const { saved, preview, update } = prefs
  const [draft, setDraft] = useState<Partial<DisplayPrefs>>({})
  const changed = (Object.keys(draft) as (keyof DisplayPrefs)[]).filter((key) => draft[key] !== saved[key])
  const dirty = changed.length > 0

  useEffect(() => {
    preview(dirty ? draft : null)
  }, [draft, dirty, preview])
  // Unsaved changes do not outlive the form
  useEffect(() => () => preview(null), [preview])

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  return {
    /** What the form shows: the stored settings with this form's changes */
    value: { ...saved, ...draft } as DisplayPrefs,
    dirty,
    set: (changes: Partial<DisplayPrefs>) => setDraft((now) => ({ ...now, ...changes })),
    save: () => {
      update(Object.fromEntries(changed.map((key) => [key, draft[key]])))
      setDraft({})
    },
    cancel: () => setDraft({}),
  }
}
