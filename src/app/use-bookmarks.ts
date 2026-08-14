import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { browser } from "wxt/browser"

import {
  buildSearchTree,
  toAllBookmarks,
  toBaseFolder,
  treeToWorkspace,
  type Bookmark,
  type Folder,
  type RootTree,
  type SearchState
} from "~/bookmark-model"
import { WorkspaceType, type Workspace } from "~/workspace-model"

type BookmarkChange = Parameters<typeof browser.bookmarks.update>[1]
type BookmarkCreate = Parameters<typeof browser.bookmarks.create>[0]
type BookmarkMove = Parameters<typeof browser.bookmarks.move>[1]

export function useBookmarks() {
  const [tree, setTree] = useState<RootTree | null>(null)
  const [searchState, setSearchState] = useState<SearchState | null>(null)
  const [searchText, setSearchText] = useState("")
  const searchRequestRef = useRef(0)
  const reloadRequestRef = useRef(0)

  const reload = useCallback(async () => {
    const requestId = ++reloadRequestRef.current
    const [nextTree] = await browser.bookmarks.getTree()
    if (requestId !== reloadRequestRef.current) return
    setTree(nextTree as unknown as RootTree)
  }, [])

  useEffect(() => {
    void reload()

    const listeners = [
      browser.bookmarks.onCreated,
      browser.bookmarks.onChanged,
      browser.bookmarks.onMoved,
      browser.bookmarks.onRemoved,
      browser.bookmarks.onChildrenReordered
    ]

    listeners.forEach((event) => event.addListener(reload))
    return () => listeners.forEach((event) => event.removeListener(reload))
  }, [reload])

  const create = useCallback(async (details: BookmarkCreate) => {
    return browser.bookmarks.create(details)
  }, [])

  const change = useCallback(async (id: string, details: BookmarkChange) => {
    return browser.bookmarks.update(id, details)
  }, [])

  const move = useCallback(async (id: string, details: BookmarkMove) => {
    return browser.bookmarks.move(id, details)
  }, [])

  const remove = useCallback(async (id: string) => {
    return browser.bookmarks.remove(id)
  }, [])

  const removeTree = useCallback(async (id: string) => {
    return browser.bookmarks.removeTree(id)
  }, [])

  const search = useCallback((text: string) => {
    searchRequestRef.current += 1
    setSearchText(text)
    setSearchState(text ? { text, tree: null } : null)
  }, [])

  useEffect(() => {
    if (!searchText || !tree) return

    const requestId = ++searchRequestRef.current
    void browser.bookmarks
      .search(searchText)
      .then((results) => {
        if (requestId !== searchRequestRef.current) return
        setSearchState({
          text: searchText,
          tree: buildSearchTree(tree, results as Array<Folder | Bookmark>)
        })
      })
      .catch(() => {})
  }, [searchText, tree])

  const getTreeByWorkspaceId = useCallback(
    ({
      currentWorkspace,
      workspaces,
      sourceTree
    }: {
      currentWorkspace: Workspace
      workspaces: Workspace[]
      sourceTree: RootTree
    }) => {
      if (!currentWorkspace.id) return null

      if (currentWorkspace.type === WorkspaceType.Normal) {
        return treeToWorkspace(currentWorkspace.id, sourceTree)
      }

      const { bookmarksBar, otherBookmarks } = toBaseFolder(sourceTree)
      const workspaceIds = workspaces.map((workspace) => workspace.id)
      const baseFolder =
        currentWorkspace.type === WorkspaceType.BookmarksBar
          ? bookmarksBar
          : otherBookmarks

      return {
        ...baseFolder,
        children: baseFolder.children?.filter(
          (item) => !workspaceIds.includes(item.id)
        )
      }
    },
    []
  )

  const visibleTree = searchState?.tree ?? tree

  return useMemo(
    () => ({
      tree,
      visibleTree,
      searchState,
      searchText,
      search,
      reload,
      create,
      change,
      move,
      remove,
      removeTree,
      getTreeByWorkspaceId,
      allBookmarks: tree ? toAllBookmarks(tree) : []
    }),
    [
      tree,
      visibleTree,
      searchState,
      searchText,
      search,
      reload,
      create,
      change,
      move,
      remove,
      removeTree,
      getTreeByWorkspaceId
    ]
  )
}
