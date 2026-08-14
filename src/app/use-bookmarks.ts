import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { browser } from "wxt/browser"

import {
  BookmarkTreeUtils,
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

  // Patch the in-memory tree instead of re-fetching it from the browser.
  // Clones first so the previous tree (still referenced by whatever last
  // rendered) is never mutated in place.
  const applyPatch = useCallback((patch: (draft: RootTree) => void) => {
    setTree((prev) => {
      if (!prev) return prev
      const draft = structuredClone(prev)
      patch(draft)
      return draft
    })
  }, [])

  useEffect(() => {
    void reload()

    // Chrome suppresses per-item events during a bulk import and fires
    // onImportBegan/onImportEnded around it instead — the API docs say as
    // much ("expensive observers should ignore onCreated until onImportEnded
    // fires"). Patching per-event during an import would be both wasted work
    // and unreliable, so everything is ignored until it ends, then resolved
    // with one full reload.
    let isImporting = false

    const handleCreated = (
      _id: string,
      bookmark: chrome.bookmarks.BookmarkTreeNode
    ) => {
      if (isImporting) return
      if (bookmark.parentId === undefined || bookmark.index === undefined) return
      const node: Bookmark | Folder =
        bookmark.url !== undefined
          ? {
              id: bookmark.id,
              parentId: bookmark.parentId,
              index: bookmark.index,
              title: bookmark.title,
              url: bookmark.url
            }
          : {
              id: bookmark.id,
              parentId: bookmark.parentId,
              index: bookmark.index,
              title: bookmark.title
            }
      applyPatch((draft) => BookmarkTreeUtils.add(draft, node))
    }

    const handleChanged = (
      id: string,
      changeInfo: chrome.bookmarks.BookmarkChangeInfo
    ) => {
      if (isImporting) return
      const node =
        changeInfo.url !== undefined
          ? { id, title: changeInfo.title, url: changeInfo.url }
          : { id, title: changeInfo.title }
      applyPatch((draft) => BookmarkTreeUtils.change(draft, node))
    }

    const handleMoved = (
      id: string,
      moveInfo: chrome.bookmarks.BookmarkMoveInfo
    ) => {
      if (isImporting) return
      applyPatch((draft) =>
        BookmarkTreeUtils.move(draft, {
          id,
          index: moveInfo.index,
          parentId: moveInfo.parentId,
          oldIndex: moveInfo.oldIndex,
          oldParentId: moveInfo.oldParentId
        })
      )
    }

    const handleRemoved = (
      id: string,
      removeInfo: chrome.bookmarks.BookmarkRemoveInfo
    ) => {
      if (isImporting) return
      applyPatch((draft) =>
        BookmarkTreeUtils.remove(draft, {
          id,
          index: removeInfo.index,
          parentId: removeInfo.parentId
        })
      )
    }

    const handleReordered = (
      id: string,
      reorderInfo: chrome.bookmarks.BookmarkReorderInfo
    ) => {
      if (isImporting) return
      applyPatch((draft) =>
        BookmarkTreeUtils.reorder(draft, { id, childIds: reorderInfo.childIds })
      )
    }

    const handleImportBegan = () => {
      isImporting = true
    }
    const handleImportEnded = () => {
      isImporting = false
      void reload()
    }

    browser.bookmarks.onCreated.addListener(handleCreated)
    browser.bookmarks.onChanged.addListener(handleChanged)
    browser.bookmarks.onMoved.addListener(handleMoved)
    browser.bookmarks.onRemoved.addListener(handleRemoved)
    browser.bookmarks.onChildrenReordered.addListener(handleReordered)
    browser.bookmarks.onImportBegan.addListener(handleImportBegan)
    browser.bookmarks.onImportEnded.addListener(handleImportEnded)

    return () => {
      browser.bookmarks.onCreated.removeListener(handleCreated)
      browser.bookmarks.onChanged.removeListener(handleChanged)
      browser.bookmarks.onMoved.removeListener(handleMoved)
      browser.bookmarks.onRemoved.removeListener(handleRemoved)
      browser.bookmarks.onChildrenReordered.removeListener(handleReordered)
      browser.bookmarks.onImportBegan.removeListener(handleImportBegan)
      browser.bookmarks.onImportEnded.removeListener(handleImportEnded)
    }
  }, [reload, applyPatch])

  // Safety net: reconcile against the real tree whenever the panel becomes
  // visible again, in case incremental patching ever drifts from reality
  // (a missed event, an edge case the patch logic doesn't cover).
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void reload()
    }
    document.addEventListener("visibilitychange", handleVisibility)
    return () => document.removeEventListener("visibilitychange", handleVisibility)
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
    // Keep whatever results are already showing instead of flashing empty —
    // the debounced effect below will replace them once the new query settles.
    setSearchState((prev) => (text ? { text, tree: prev?.tree ?? null } : null))
  }, [])

  useEffect(() => {
    if (!searchText || !tree) return

    const requestId = ++searchRequestRef.current
    const timeoutId = setTimeout(() => {
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
    }, 200)

    return () => clearTimeout(timeoutId)
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
