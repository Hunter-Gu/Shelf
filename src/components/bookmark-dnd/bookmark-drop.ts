export const BOOKMARK_DND_TYPE = "markit_bookmark"

export type BookmarkZone = "workspace" | "pin" | "favorite"

export type BookmarkDragItem = {
  zone: BookmarkZone
  id: string
  parentId: string
  index: number
  title: string
  url: string
}

export type BookmarkDropEdge = "before" | "after" | "inside" | "append"

export type BookmarkDropTarget = {
  zone: BookmarkZone
  parentId: string
  index: number
  edge: BookmarkDropEdge
}

export type BookmarkDropPlan =
  | "reorder-workspace"
  | "reorder-pin"
  | "reorder-favorite"
  | "move-to-workspace"
  | "move-to-pin"
  | "move-to-favorite"

export function planBookmarkDrop(
  source: BookmarkDragItem,
  target: BookmarkDropTarget
): BookmarkDropPlan {
  if (source.zone !== target.zone) return `move-to-${target.zone}`
  return `reorder-${target.zone}`
}

// Drop targets describe a boundary in the pre-move list. Removing an item
// above that boundary shifts the final browser.bookmarks.move index by one.
export function normalizeDropIndex(
  source: Pick<BookmarkDragItem, "parentId" | "index">,
  target: Pick<BookmarkDropTarget, "parentId" | "index">
) {
  return source.parentId === target.parentId && source.index < target.index
    ? target.index - 1
    : target.index
}
