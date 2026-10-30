import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren
} from "react"

import { useAppContext } from "~/app/app-context"
import {
  BookmarkTreeUtils,
  isFolder,
  type Bookmark,
  type Folder,
  type RootTree
} from "~/bookmark-model"

type CurrentTabBookmark = {
  currentTab: chrome.tabs.Tab | null
  bookmark: Bookmark | null
  workspaceId: string | null
}

const CurrentTabBookmarkContext = createContext<CurrentTabBookmark>({
  currentTab: null,
  bookmark: null,
  workspaceId: null
})

function findDescendantBookmark(
  folder: Folder | RootTree,
  url: string,
  excludeIds: Set<string>
): Bookmark | null {
  for (const child of folder.children ?? []) {
    if (isFolder(child)) {
      if (excludeIds.has(child.id)) continue
      const result = findDescendantBookmark(child, url, excludeIds)
      if (result) return result
    } else if (child.url === url) {
      return child
    }
  }
  return null
}

function findWorkspaceId(
  tree: RootTree,
  nodeId: string,
  workspaceIds: Set<string>
): string | null {
  const parentMap = new Map<string, string>()
  BookmarkTreeUtils.walk(tree, (item) => {
    parentMap.set(item.id, item.parentId)
  })

  let id: string | undefined = nodeId
  while (id) {
    if (workspaceIds.has(id)) return id
    id = parentMap.get(id)
  }
  return null
}

export function CurrentTabBookmarkProvider({ children }: PropsWithChildren) {
  const { bookmarks, tabs, workspace, pins } = useAppContext()
  const value = useMemo(() => {
    const url = tabs.activeTab?.url
    const excludeIds = new Set(
      [pins.pinsFolderId, pins.favoritesFolderId].filter(
        (id): id is string => typeof id === "string"
      )
    )
    const bookmark =
      bookmarks.tree && url
        ? findDescendantBookmark(bookmarks.tree, url, excludeIds)
        : null
    const workspaceIds = new Set(workspace.workspaces.map((space) => space.id))
    const workspaceId =
      bookmark && bookmarks.tree
        ? findWorkspaceId(bookmarks.tree, bookmark.parentId, workspaceIds)
        : null

    return { currentTab: tabs.activeTab, bookmark, workspaceId }
  }, [
    bookmarks.tree,
    tabs.activeTab,
    workspace.workspaces,
    pins.pinsFolderId,
    pins.favoritesFolderId
  ])

  return (
    <CurrentTabBookmarkContext.Provider value={value}>
      {children}
    </CurrentTabBookmarkContext.Provider>
  )
}

export function useCurrentTabBookmark() {
  return useContext(CurrentTabBookmarkContext)
}
