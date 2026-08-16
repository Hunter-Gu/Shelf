import { useCallback, useEffect, useMemo, useRef } from "react"
import { browser } from "wxt/browser"

import { isFolder, toBaseFolder, type Bookmark, type Folder, type RootTree } from "~/bookmark-model"
import {
  collectFolderUrls,
  FAVORITES_FOLDER_TITLE,
  findSpecialFolder,
  PINS_FOLDER_TITLE
} from "~/pin-model/pin-folder"

export function usePins({ tree }: { tree: RootTree | null }) {
  const pinsFolder = tree ? findSpecialFolder(tree, PINS_FOLDER_TITLE) : null
  const favoritesFolder = tree ? findSpecialFolder(tree, FAVORITES_FOLDER_TITLE) : null

  const pinnedUrls = useMemo(() => collectFolderUrls(pinsFolder), [pinsFolder])
  const favoriteUrls = useMemo(() => collectFolderUrls(favoritesFolder), [favoritesFolder])

  // The special folders' own children, in bookmark order — the source for
  // strip UIs, as opposed to pinnedUrls/favoriteUrls which are membership
  // lookups keyed by url.
  const pinnedItems = useMemo(
    () => (pinsFolder?.children ?? []).filter((child): child is Bookmark => !isFolder(child)),
    [pinsFolder]
  )
  const favoriteItems = useMemo(
    () =>
      (favoritesFolder?.children ?? []).filter(
        (child): child is Bookmark => !isFolder(child)
      ),
    [favoritesFolder]
  )

  // Both folders are created lazily on first use rather than on install, so
  // a fresh profile never gets them until the feature is actually touched.
  const ensuringRef = useRef<Set<string>>(new Set())
  const ensureFolder = useCallback(
    async (title: string, existing: Folder | null) => {
      if (existing || !tree || ensuringRef.current.has(title)) return
      ensuringRef.current.add(title)
      try {
        const { otherBookmarks } = toBaseFolder(tree)
        await browser.bookmarks.create({ parentId: otherBookmarks.id, title })
      } finally {
        ensuringRef.current.delete(title)
      }
    },
    [tree]
  )

  useEffect(() => {
    void ensureFolder(PINS_FOLDER_TITLE, pinsFolder)
  }, [ensureFolder, pinsFolder])

  useEffect(() => {
    void ensureFolder(FAVORITES_FOLDER_TITLE, favoritesFolder)
  }, [ensureFolder, favoritesFolder])

  // Deleting a bookmark also removes any pinned/favorited copy of it.
  // Deleting *from* one of the special folders is just a plain removal —
  // it must not cascade back and delete the source bookmark.
  useEffect(() => {
    const pinsFolderId = pinsFolder?.id
    const favoritesFolderId = favoritesFolder?.id
    if (!pinsFolderId && !favoritesFolderId) return

    const handleRemoved = (
      _id: string,
      removeInfo: chrome.bookmarks.BookmarkRemoveInfo
    ) => {
      const node = removeInfo.node
      if (!node.url) return
      if (node.parentId === pinsFolderId || node.parentId === favoritesFolderId) return

      for (const folderId of [pinsFolderId, favoritesFolderId]) {
        if (!folderId) continue
        void browser.bookmarks.getChildren(folderId).then((children) => {
          const match = children.find((child) => child.url === node.url)
          if (match) void browser.bookmarks.remove(match.id)
        })
      }
    }

    browser.bookmarks.onRemoved.addListener(handleRemoved)
    return () => browser.bookmarks.onRemoved.removeListener(handleRemoved)
  }, [pinsFolder?.id, favoritesFolder?.id])

  const addTo = useCallback(
    (folderId: string | undefined, bookmark: { title: string; url: string }) => {
      if (!folderId) return Promise.resolve()
      return browser.bookmarks
        .create({ parentId: folderId, title: bookmark.title, url: bookmark.url })
        .then(() => {})
    },
    []
  )

  const removeFrom = useCallback((folder: Folder | null, url: string) => {
    const match = folder?.children?.find((child) => !isFolder(child) && child.url === url)
    return match ? browser.bookmarks.remove(match.id) : Promise.resolve()
  }, [])

  const pin = useCallback(
    (bookmark: { title: string; url: string }) =>
      pinnedUrls.has(bookmark.url) ? Promise.resolve() : addTo(pinsFolder?.id, bookmark),
    [addTo, pinsFolder?.id, pinnedUrls]
  )

  const unpin = useCallback(
    (url: string) => removeFrom(pinsFolder, url),
    [pinsFolder, removeFrom]
  )

  const favorite = useCallback(
    (bookmark: { title: string; url: string }) =>
      favoriteUrls.has(bookmark.url)
        ? Promise.resolve()
        : addTo(favoritesFolder?.id, bookmark),
    [addTo, favoritesFolder?.id, favoriteUrls]
  )

  const unfavorite = useCallback(
    (url: string) => removeFrom(favoritesFolder, url),
    [favoritesFolder, removeFrom]
  )

  return useMemo(
    () => ({
      pinsFolderId: pinsFolder?.id,
      favoritesFolderId: favoritesFolder?.id,
      pinnedUrls,
      favoriteUrls,
      pinnedItems,
      favoriteItems,
      isPinned: (url: string) => pinnedUrls.has(url),
      isFavorite: (url: string) => favoriteUrls.has(url),
      pin,
      unpin,
      favorite,
      unfavorite
    }),
    [
      pinsFolder?.id,
      favoritesFolder?.id,
      pinnedUrls,
      favoriteUrls,
      pinnedItems,
      favoriteItems,
      pin,
      unpin,
      favorite,
      unfavorite
    ]
  )
}
