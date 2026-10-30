import { useEffect, useState } from "react"

import { useAppContext } from "~/app/app-context"
import { useCurrentTabBookmark } from "~/context/tab-bookmark-context"
import { WorkspaceType } from "~/workspace-model"

import { suggestFolder, type FolderSuggestion } from "./suggest-folder"

const HIDE_AFTER_MS = 5000

type Suggestion = FolderSuggestion & {
  bookmarkId: string
  url: string
  spaceId: string
  savedTo: string
}

/**
 * After a page is saved to the current space, offers to move it into the
 * folder that already holds that site's bookmarks. The offer goes away on its
 * own after a few seconds, or once the tab or space changes.
 */
export function useSaveSuggestion() {
  const { bookmarks, workspace, pins } = useAppContext()
  const { currentTab } = useCurrentTabBookmark()
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [isHovered, setHovered] = useState(false)
  const space = workspace.currentWorkspace

  const isStale =
    !!suggestion &&
    (currentTab?.url !== suggestion.url || space.id !== suggestion.spaceId)

  useEffect(() => {
    if (!suggestion || (isHovered && !isStale)) return
    const timer = setTimeout(() => setSuggestion(null), HIDE_AFTER_MS)
    return () => clearTimeout(timer)
  }, [suggestion, isHovered, isStale])

  const offer = (saved: { id: string; url: string; parentId: string }) => {
    if (!bookmarks.tree) return
    const found = suggestFolder(bookmarks.tree, saved, {
      excludeIds: [pins.pinsFolderId, pins.favoritesFolderId].filter(
        (id): id is string => !!id
      ),
      spaces: workspace.workspaces.map((item) => ({
        id: item.id,
        title: item.title,
        isHome: item.type === WorkspaceType.BookmarksBar
      })),
      currentSpaceId: space.id
    })
    setHovered(false)
    setSuggestion(
      found && {
        ...found,
        bookmarkId: saved.id,
        url: saved.url,
        spaceId: space.id,
        savedTo: space.title
      }
    )
  }

  const dismiss = () => setSuggestion(null)

  const move = async () => {
    if (!suggestion) return
    dismiss()
    await bookmarks.move(suggestion.bookmarkId, {
      parentId: suggestion.folderId
    })
  }

  return {
    suggestion: isStale ? null : suggestion,
    offer,
    move,
    dismiss,
    setHovered
  }
}
