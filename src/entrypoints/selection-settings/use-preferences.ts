import { useEffect, useState } from "react"

import type { SelectionPreferences } from "~/selection-bookmarks/preferences"
import { selectionPreferencesStorage } from "~/selection-bookmarks/preferences-storage"

export function usePreferences() {
  const [value, setValue] = useState<SelectionPreferences | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    let changed = false
    const unwatch = selectionPreferencesStorage.watch((value) => {
      changed = true
      setValue(value)
    })
    void selectionPreferencesStorage.getValue().then(
      (value) => {
        if (active && !changed) setValue(value)
      },
      () => {
        if (active)
          setError("Could not load your settings. Reload to try again.")
      }
    )
    return () => {
      active = false
      unwatch()
    }
  }, [])

  const update = async (changes: Partial<SelectionPreferences>) => {
    if (!value || saving) return
    setSaving(true)
    setError("")
    try {
      const next = { ...value, ...changes }
      await selectionPreferencesStorage.setValue(next)
      setValue(next)
    } catch {
      setError("Could not save this change. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return { value, saving, error, update }
}
