import { LEGACY_SPECIAL_TITLES } from "~/pin-model/pin-folder"
import { formatShelfTitle, parseShelfTitle } from "~/shelf-title"

export const HIGHLIGHTS_FOLDER_TITLE = formatShelfTitle("Highlights", {
  role: "Highlights"
})

export type BookmarkNode = {
  id: string
  title: string
  url?: string
  parentId?: string
  unmodifiable?: string
  children?: BookmarkNode[]
}

export function isHighlightsFolder(node: BookmarkNode) {
  return !node.url && parseShelfTitle(node.title)?.role === "Highlights"
}

export function highlightFolders(root: BookmarkNode): BookmarkNode[] {
  if (isHighlightsFolder(root)) return [root]
  return (root.children ?? []).flatMap(highlightFolders)
}

export function ordinaryBookmarks(root: BookmarkNode): BookmarkNode[] {
  if (!root.url && Object.values(LEGACY_SPECIAL_TITLES).includes(root.title))
    return []
  const role = !root.url && parseShelfTitle(root.title)?.role
  if (role && role !== "Home") return []
  if (root.url) return [root]
  return (root.children ?? []).flatMap(ordinaryBookmarks)
}
