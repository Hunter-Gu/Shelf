import { isFolder, toBaseFolder, type Folder, type RootTree } from "~/bookmark-model"

// Pins and favorites live as real bookmark nodes inside these two hidden
// folders (same trick as workspace roots) rather than a separate storage
// item, so create/delete/reorder/sync all come for free from the bookmark
// APIs. Titles are exact-match, not a parsed pattern like workspaceName —
// there's exactly one of each, so no variable portion to parse.
export const PINS_FOLDER_TITLE = "Pins (Shelf)"
export const FAVORITES_FOLDER_TITLE = "Favorites (Shelf)"

export function findSpecialFolder(tree: RootTree, title: string): Folder | null {
  const { otherBookmarks } = toBaseFolder(tree)
  const match = (otherBookmarks.children ?? []).find((item) => item.title === title)
  return match && isFolder(match) ? match : null
}

export function collectFolderUrls(folder: Folder | null): Set<string> {
  const urls = new Set<string>()
  for (const child of folder?.children ?? []) {
    if (!isFolder(child)) urls.add(child.url)
  }
  return urls
}
