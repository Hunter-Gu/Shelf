import { isFolder, type Folder } from "~/bookmark-model"

export const BOOKMARK_DND_TYPE = "shelf_bookmark"

export type BookmarkZone = "workspace" | "pin" | "favorite"

type BookmarkDragItemBase = {
  zone: BookmarkZone
  id: string
  parentId: string
  index: number
  title: string
}

export type BookmarkDragBookmarkItem = BookmarkDragItemBase & {
  kind?: "bookmark"
  url: string
}

export type BookmarkDragFolderItem = Omit<BookmarkDragItemBase, "zone"> & {
  kind: "folder"
  zone: "workspace"
}

export type BookmarkDragItem = BookmarkDragBookmarkItem | BookmarkDragFolderItem

export function isFolderDragItem(
  item: BookmarkDragItem
): item is BookmarkDragFolderItem {
  return item.kind === "folder"
}

// Home's tree merges the loose contents of both bookmark roots under a single
// folder, so a folder's rendered children can outnumber the ones Chrome
// actually keeps there. Appending needs the real count or the index lands out
// of bounds.
export function ownChildCount(folder: Folder | null) {
  return (folder?.children ?? []).filter((item) => item.parentId === folder?.id)
    .length
}

export function findFolderById(folder: Folder | null, id: string): Folder | null {
  if (!folder) return null
  if (folder.id === id) return folder

  for (const child of folder.children ?? []) {
    if (!isFolder(child)) continue
    const match = findFolderById(child, id)
    if (match) return match
  }
  return null
}

export function canDropBookmarkItem(
  source: BookmarkDragItem,
  target: BookmarkDropTarget,
  workspaceTree: Folder | null
) {
  if (!target.parentId) return false
  if (!isFolderDragItem(source)) return true
  if (target.zone !== "workspace") return false

  const sourceFolder = findFolderById(workspaceTree, source.id)
  if (!sourceFolder) return false
  return !findFolderById(sourceFolder, target.parentId)
}

export type BookmarkDropEdge = "before" | "after" | "inside" | "append"

export type BookmarkDropTarget = {
  zone: BookmarkZone
  parentId: string
  index: number
  edge: BookmarkDropEdge
  anchorId?: string
}

export type BookmarkDropPlan =
  | "reorder-workspace"
  | "reorder-pin"
  | "reorder-favorite"
  | "move-to-workspace"
  | "move-to-pin"
  | "move-to-favorite"

export function planBookmarkDrop(
  source: BookmarkDragBookmarkItem,
  target: BookmarkDropTarget
): BookmarkDropPlan {
  if (source.zone !== target.zone) return `move-to-${target.zone}`
  return `reorder-${target.zone}`
}

export function isSameDropPosition(
  source: Pick<BookmarkDragItem, "parentId" | "index">,
  target: Pick<BookmarkDropTarget, "parentId" | "index">
) {
  return (
    source.parentId === target.parentId &&
    (target.index === source.index || target.index === source.index + 1)
  )
}
