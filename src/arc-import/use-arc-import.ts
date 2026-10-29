import { useState } from "react"
import { browser } from "wxt/browser"

import {
  importArcSidebar,
  type ArcImportResult,
  type BookmarksApi
} from "./import-arc-sidebar"
import { parseArcSidebar, type ArcSidebar } from "./parse-arc-sidebar"

function toggled(set: Set<string>, key: string) {
  const next = new Set(set)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  return next
}

/** Reading Arc's sidebar file, choosing what to bring over, and importing it. */
export function useArcImport() {
  const [sidebar, setSidebar] = useState<ArcSidebar | null>(null)
  const [spaceIds, setSpaceIds] = useState<Set<string>>(new Set())
  const [favoriteProfiles, setFavoriteProfiles] = useState<Set<string>>(
    new Set()
  )
  const [today, setToday] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isImporting, setImporting] = useState(false)
  const [result, setResult] = useState<ArcImportResult | null>(null)

  const readFile = async (file: File) => {
    setError(null)
    setResult(null)
    try {
      const parsed = parseArcSidebar(JSON.parse(await file.text()))
      const [first] = parsed.profiles
      if (!first)
        throw new Error("Nothing is pinned or open in this Arc sidebar.")
      // Shelf lives in one Chrome profile, so only Arc's first profile — the
      // main one when there is one — starts out chosen.
      setSidebar(parsed)
      setSpaceIds(
        new Set(
          parsed.spaces
            .filter((space) => space.profile === first.key)
            .map((space) => space.id)
        )
      )
      setFavoriteProfiles(new Set(first.favorites.length ? [first.key] : []))
      setToday(true)
    } catch (caught) {
      setSidebar(null)
      setError(
        caught instanceof SyntaxError
          ? "That file isn't readable JSON. Pick StorableSidebar.json from Arc's folder."
          : (caught as Error).message
      )
    }
  }

  const chosenSpaces =
    sidebar?.spaces.filter((space) => spaceIds.has(space.id)) ?? []
  const todayCount = chosenSpaces.reduce(
    (count, space) => count + space.today.length,
    0
  )
  const willImport =
    chosenSpaces.some((space) => space.items.length) ||
    favoriteProfiles.size > 0 ||
    (today && todayCount > 0)

  const run = async () => {
    if (!sidebar) return
    setImporting(true)
    setError(null)
    try {
      setResult(
        await importArcSidebar(
          sidebar,
          {
            spaceIds: [...spaceIds],
            favoriteProfiles: [...favoriteProfiles],
            today
          },
          browser.bookmarks as unknown as BookmarksApi
        )
      )
    } catch (caught) {
      setError((caught as Error).message)
    } finally {
      setImporting(false)
    }
  }

  return {
    sidebar,
    spaceIds,
    toggleSpace: (id: string) => setSpaceIds((set) => toggled(set, id)),
    favoriteProfiles,
    toggleFavorites: (key: string) =>
      setFavoriteProfiles((set) => toggled(set, key)),
    today,
    setToday,
    todayCount,
    readFile,
    run,
    canImport: willImport && !isImporting,
    isImporting,
    result,
    error
  }
}
