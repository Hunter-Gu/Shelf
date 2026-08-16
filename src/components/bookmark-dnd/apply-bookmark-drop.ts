import { isFolder, type Bookmark, type Folder } from "~/bookmark-model"

import {
  normalizeDropIndex,
  planBookmarkDrop,
  type BookmarkDragItem,
  type BookmarkDropTarget
} from "./bookmark-drop"

type BookmarkDropOperations = {
  createBookmark: (details: {
    parentId: string
    index: number
    title: string
    url: string
  }) => Promise<unknown>
  moveBookmark: (
    id: string,
    details: { parentId: string; index: number }
  ) => Promise<unknown>
  movePin: (id: string, index: number) => Promise<unknown>
  moveFavorite: (id: string, index: number) => Promise<unknown>
  placePin: (
    bookmark: { title: string; url: string },
    index: number,
    moveFromId?: string
  ) => Promise<unknown>
  placeFavorite: (
    bookmark: { title: string; url: string },
    index: number,
    moveFromId?: string
  ) => Promise<unknown>
  removePinsByUrl: (url: string) => Promise<unknown>
  removeFavoritesByUrl: (url: string) => Promise<unknown>
}

function findBookmarkByUrl(
  folder: Folder | null,
  url: string
): Bookmark | null {
  if (!folder) return null

  for (const child of folder.children ?? []) {
    if (!isFolder(child)) {
      if (child.url === url) return child
      continue
    }

    const match: Bookmark | null = findBookmarkByUrl(child, url)
    if (match) return match
  }
  return null
}

async function ensureWorkspaceSource(
  source: BookmarkDragItem,
  workspaceTree: Folder | null,
  operations: BookmarkDropOperations
) {
  if (findBookmarkByUrl(workspaceTree, source.url) || !workspaceTree) return
  await operations.createBookmark({
    parentId: workspaceTree.id,
    index: workspaceTree.children?.length ?? 0,
    title: source.title,
    url: source.url
  })
}

async function placeInWorkspace(
  source: BookmarkDragItem,
  target: BookmarkDropTarget,
  workspaceTree: Folder | null,
  operations: BookmarkDropOperations
) {
  const existing = findBookmarkByUrl(workspaceTree, source.url)
  if (existing) {
    await operations.moveBookmark(existing.id, {
      parentId: target.parentId,
      index: normalizeDropIndex(existing, target)
    })
  } else {
    await operations.createBookmark({
      parentId: target.parentId,
      index: target.index,
      title: source.title,
      url: source.url
    })
  }

  await operations.removePinsByUrl(source.url)
  await operations.removeFavoritesByUrl(source.url)
}

export async function applyBookmarkDrop({
  source,
  target,
  workspaceTree,
  operations
}: {
  source: BookmarkDragItem
  target: BookmarkDropTarget
  workspaceTree: Folder | null
  operations: BookmarkDropOperations
}) {
  const plan = planBookmarkDrop(source, target)
  const index = normalizeDropIndex(source, target)

  switch (plan) {
    case "reorder-workspace":
      if (source.parentId === target.parentId && source.index === index) return
      await operations.moveBookmark(source.id, {
        parentId: target.parentId,
        index
      })
      return
    case "reorder-pin":
      if (source.parentId === target.parentId && source.index === index) return
      await operations.movePin(source.id, index)
      return
    case "reorder-favorite":
      if (source.parentId === target.parentId && source.index === index) return
      await operations.moveFavorite(source.id, index)
      return
    case "move-to-workspace":
      await placeInWorkspace(source, target, workspaceTree, operations)
      return
    case "move-to-pin":
      if (source.zone === "favorite") {
        await ensureWorkspaceSource(source, workspaceTree, operations)
      }
      await operations.placePin(
        source,
        target.index,
        source.zone === "favorite" ? source.id : undefined
      )
      return
    case "move-to-favorite":
      await operations.placeFavorite(
        source,
        target.index,
        source.zone === "pin" ? source.id : undefined
      )
  }
}
