import { useCallback, useEffect, useMemo, useRef } from "react"
import { browser } from "wxt/browser"

import {
  isFolder,
  toBaseFolder,
  type Bookmark,
  type Folder,
  type RootTree
} from "~/bookmark-model"
import {
  collectFolderUrls,
  FAVORITES_FOLDER_TITLE,
  findSpecialFolder,
  PINS_FOLDER_TITLE
} from "~/pin-model/pin-folder"

export function usePins({ tree }: { tree: RootTree | null }) {
  const pinsFolder = tree ? findSpecialFolder(tree, PINS_FOLDER_TITLE) : null
  const favoritesFolder = tree
    ? findSpecialFolder(tree, FAVORITES_FOLDER_TITLE)
    : null

  const pinnedUrls = useMemo(() => collectFolderUrls(pinsFolder), [pinsFolder])
  const favoriteUrls = useMemo(
    () => collectFolderUrls(favoritesFolder),
    [favoritesFolder]
  )

  // The special folders' own children, in bookmark order — the source for
  // strip UIs, as opposed to pinnedUrls/favoriteUrls which are membership
  // lookups keyed by url.
  const pinnedItems = useMemo(
    () =>
      (pinsFolder?.children ?? []).filter(
        (child): child is Bookmark => !isFolder(child)
      ),
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
  // The creation promise is cached per title so a drop that lands before
  // the mount effect's creation has resolved awaits the same creation
  // instead of throwing "not ready" or racing a second create. The entry is
  // kept on success (not just while pending) — `pinsFolder`/`favoritesFolder`
  // only pick up the new folder once its onCreated event round-trips through
  // the tree's patch debounce, so a caller that lands in that gap must still
  // see the same resolved id rather than finding an empty cache and creating
  // a second folder. It's only cleared on failure, so a later attempt can
  // retry.
  const ensuringRef = useRef<Map<string, Promise<string>>>(new Map())
  const ensureFolderId = useCallback(
    (title: string, existing: Folder | null): Promise<string> => {
      if (existing) return Promise.resolve(existing.id)
      if (!tree) {
        return Promise.reject(new Error("Bookmark collection is not ready"))
      }

      const pending = ensuringRef.current.get(title)
      if (pending) return pending

      const { otherBookmarks } = toBaseFolder(tree)
      const promise = browser.bookmarks
        .create({ parentId: otherBookmarks.id, title })
        .then((created) => created.id)
        .catch((error: unknown) => {
          ensuringRef.current.delete(title)
          throw error
        })
      ensuringRef.current.set(title, promise)
      return promise
    },
    [tree]
  )

  useEffect(() => {
    void ensureFolderId(PINS_FOLDER_TITLE, pinsFolder).catch(() => {})
  }, [ensureFolderId, pinsFolder])

  useEffect(() => {
    void ensureFolderId(FAVORITES_FOLDER_TITLE, favoritesFolder).catch(() => {})
  }, [ensureFolderId, favoritesFolder])

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
      if (node.parentId === pinsFolderId || node.parentId === favoritesFolderId)
        return

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
    (
      folderId: string | undefined,
      bookmark: { title: string; url: string }
    ) => {
      if (!folderId) return Promise.resolve()
      return browser.bookmarks
        .create({
          parentId: folderId,
          title: bookmark.title,
          url: bookmark.url
        })
        .then(() => {})
    },
    []
  )

  const removeFrom = useCallback((folder: Folder | null, url: string) => {
    const match = folder?.children?.find(
      (child) => !isFolder(child) && child.url === url
    )
    return match ? browser.bookmarks.remove(match.id) : Promise.resolve()
  }, [])

  const removeAllFrom = useCallback((folder: Folder | null, url: string) => {
    return Promise.all(
      (folder?.children ?? [])
        .filter((child) => !isFolder(child) && child.url === url)
        .map((child) => browser.bookmarks.remove(child.id))
    ).then(() => {})
  }, [])

  // `moveFromId` is set when the bookmark is transferred from the other
  // special folder. Keep the whole transfer here so callers never move a
  // node and then remove it again through a stale folder snapshot.
  const placeIn = useCallback(
    async (
      title: string,
      folder: Folder | null,
      bookmark: { title: string; url: string },
      index: number,
      moveFromId?: string
    ) => {
      const folderId = await ensureFolderId(title, folder)

      const existing = folder?.children?.find(
        (child) => !isFolder(child) && child.url === bookmark.url
      )
      if (existing) {
        if (index !== existing.index && index !== existing.index + 1) {
          await browser.bookmarks.move(existing.id, {
            parentId: folderId,
            index
          })
        }
        if (moveFromId && moveFromId !== existing.id) {
          await browser.bookmarks.remove(moveFromId)
        }
        return
      }

      if (moveFromId) {
        await browser.bookmarks.move(moveFromId, { parentId: folderId, index })
        return
      }

      await browser.bookmarks.create({
        parentId: folderId,
        index,
        title: bookmark.title,
        url: bookmark.url
      })
    },
    [ensureFolderId]
  )

  const moveIn = useCallback(
    (folder: Folder | null, id: string, index: number) => {
      if (!folder || !folder.children?.some((child) => child.id === id)) {
        return Promise.resolve()
      }
      return browser.bookmarks
        .move(id, { parentId: folder.id, index })
        .then(() => {})
    },
    []
  )

  const pin = useCallback(
    (bookmark: { title: string; url: string }) =>
      pinnedUrls.has(bookmark.url)
        ? Promise.resolve()
        : addTo(pinsFolder?.id, bookmark),
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
      placePin: (
        bookmark: { title: string; url: string },
        index: number,
        moveFromId?: string
      ) => placeIn(PINS_FOLDER_TITLE, pinsFolder, bookmark, index, moveFromId),
      placeFavorite: (
        bookmark: { title: string; url: string },
        index: number,
        moveFromId?: string
      ) =>
        placeIn(
          FAVORITES_FOLDER_TITLE,
          favoritesFolder,
          bookmark,
          index,
          moveFromId
        ),
      movePin: (id: string, index: number) => moveIn(pinsFolder, id, index),
      moveFavorite: (id: string, index: number) =>
        moveIn(favoritesFolder, id, index),
      removePinsByUrl: (url: string) => removeAllFrom(pinsFolder, url),
      removeFavoritesByUrl: (url: string) =>
        removeAllFrom(favoritesFolder, url),
      pin,
      unpin,
      favorite,
      unfavorite
    }),
    [
      pinsFolder,
      favoritesFolder,
      pinnedUrls,
      favoriteUrls,
      pinnedItems,
      favoriteItems,
      placeIn,
      moveIn,
      removeAllFrom,
      pin,
      unpin,
      favorite,
      unfavorite
    ]
  )
}
