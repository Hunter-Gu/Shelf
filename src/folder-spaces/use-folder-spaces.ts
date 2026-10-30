import { useEffect, useState } from "react"
import { browser } from "wxt/browser"

import {
  nameProblem,
  readFolders,
  turnFoldersIntoSpaces,
  type BookmarkNode,
  type FolderChoice
} from "./folder-spaces"

type Folders = ReturnType<typeof readFolders>

/** Choosing bookmark folders, naming them, and turning them into spaces. */
export function useFolderSpaces() {
  const [folders, setFolders] = useState<Folders | null>(null)
  const [chosen, setChosen] = useState<Map<string, FolderChoice>>(new Map())
  const [hasTried, setTried] = useState(false)
  const [isWorking, setWorking] = useState(false)
  const [result, setResult] = useState<{
    spaces: number
    failed: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    browser.bookmarks
      .getTree()
      .then(([root]) => setFolders(readFolders(root as BookmarkNode)))
      .catch((caught: Error) => setError(caught.message))
  }, [])

  const edit = (id: string, changes: Partial<FolderChoice>) =>
    setChosen((current) => {
      const choice = current.get(id)
      if (!choice) return current
      return new Map(current).set(id, { ...choice, ...changes })
    })

  const toggle = (id: string) =>
    setChosen((current) => {
      const next = new Map(current)
      const folder = folders?.candidates.find((item) => item.id === id)
      if (next.has(id)) next.delete(id)
      else if (folder) next.set(id, { id, name: folder.title, logo: "" })
      return next
    })

  const problemOf = (id: string) => {
    const choice = chosen.get(id)
    if (!choice || !folders) return null
    return nameProblem(choice.name, {
      takenNames: folders.takenNames,
      otherChosenNames: [...chosen.values()]
        .filter((other) => other.id !== id)
        .map((other) => other.name)
    })
  }

  const run = async () => {
    if (!folders || !chosen.size) return
    setTried(true)
    if ([...chosen.keys()].some(problemOf)) return
    setWorking(true)
    setError(null)
    try {
      setResult(
        await turnFoldersIntoSpaces(
          [...chosen.values()],
          folders.candidates,
          folders.bookmarksBarId,
          {
            move: (id, destination) => browser.bookmarks.move(id, destination),
            update: (id, changes) => browser.bookmarks.update(id, changes)
          }
        )
      )
    } catch (caught) {
      setError((caught as Error).message)
    } finally {
      setWorking(false)
    }
  }

  return {
    candidates: folders?.candidates ?? null,
    chosen,
    toggle,
    rename: (id: string, name: string) => edit(id, { name }),
    setLogo: (id: string, logo: string) => edit(id, { logo }),
    // Only shown once the user has tried to go ahead, so a name isn't flagged
    // while it's still being typed.
    problemOf: (id: string) => (hasTried ? problemOf(id) : null),
    run,
    isWorking,
    result,
    error
  }
}
