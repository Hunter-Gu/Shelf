import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren
} from "react"

import { useActiveTab } from "./use-active-tab"
import { useBookmarks } from "./use-bookmarks"
import { useWorkspaces } from "./use-workspaces"
import { useTheme } from "~/hooks/use-theme"

const AppContext = createContext<ReturnType<typeof useAppState> | null>(null)

function useAppState() {
  const bookmarks = useBookmarks()
  const workspaces = useWorkspaces({
    tree: bookmarks.tree,
    createBookmark: bookmarks.create,
    changeBookmark: bookmarks.change,
    moveBookmark: bookmarks.move,
    removeBookmark: bookmarks.remove,
    removeBookmarkTree: bookmarks.removeTree
  })
  const tabs = useActiveTab()
  const theme = useTheme()

  return useMemo(() => ({ bookmarks, workspace: workspaces, tabs, theme }), [bookmarks, workspaces, tabs, theme])
}

export function AppProvider({ children }: PropsWithChildren) {
  return <AppContext.Provider value={useAppState()}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const value = useContext(AppContext)
  if (!value) throw new Error("useAppContext must be used within AppProvider")
  return value
}
