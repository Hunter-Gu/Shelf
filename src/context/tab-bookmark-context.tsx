import { createContext, useContext, useMemo, type PropsWithChildren } from "react"

import { useAppContext } from "~/app/app-context"
import type { Bookmark, Folder, RootTree } from "~/bookmark-model"

type CurrentTabBookmark = {
  currentTab: chrome.tabs.Tab | null
  bookmark: Bookmark | null
}

const CurrentTabBookmarkContext = createContext<CurrentTabBookmark>({
  currentTab: null,
  bookmark: null
})

function findDescendantBookmark(folder: Folder | RootTree, url: string): Bookmark | null {
  for (const child of folder.children ?? []) {
    if ("url" in child) {
      if (child.url === url) return child
    } else {
      const result = findDescendantBookmark(child, url)
      if (result) return result
    }
  }
  return null
}

export function CurrentTabBookmarkProvider({ children }: PropsWithChildren) {
  const { bookmarks, tabs } = useAppContext()
  const value = useMemo(() => {
    const url = tabs.activeTab?.url
    return {
      currentTab: tabs.activeTab,
      bookmark: bookmarks.tree && url ? findDescendantBookmark(bookmarks.tree, url) : null
    }
  }, [bookmarks.tree, tabs.activeTab])

  return (
    <CurrentTabBookmarkContext.Provider value={value}>
      {children}
    </CurrentTabBookmarkContext.Provider>
  )
}

export function useCurrentTabBookmark() {
  return useContext(CurrentTabBookmarkContext)
}
