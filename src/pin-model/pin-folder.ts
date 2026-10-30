import {
  isFolder,
  toBaseFolder,
  type Folder,
  type RootTree
} from "~/bookmark-model"
import { formatShelfTitle } from "~/shelf-title"

// Pins and favorites live as real bookmark nodes inside these two hidden
// folders (same trick as workspace roots) rather than a separate storage
// item, so create/delete/reorder/sync all come for free from the bookmark
// APIs. Titles are exact-match, not a parsed pattern like workspaceName —
// there's exactly one of each, so no variable portion to parse.
export const PINS_FOLDER_TITLE = formatShelfTitle("Pins", { role: "Pins" })
export const FAVORITES_FOLDER_TITLE = formatShelfTitle("Favorites", {
  role: "Favorites"
})

// What older versions called them. Still matched so a panel that opens before
// the rename lands doesn't create a second folder alongside the old one.
export const LEGACY_SPECIAL_TITLES: Record<string, string> = {
  [PINS_FOLDER_TITLE]: "Pins (Shelf)",
  [FAVORITES_FOLDER_TITLE]: "Favorites (Shelf)"
}

export function findSpecialFolder(
  tree: RootTree,
  title: string
): Folder | null {
  const { otherBookmarks } = toBaseFolder(tree)
  const children = otherBookmarks.children ?? []
  const match =
    children.find((item) => item.title === title) ??
    children.find((item) => item.title === LEGACY_SPECIAL_TITLES[title])
  return match && isFolder(match) ? match : null
}

export function collectFolderUrls(folder: Folder | null): Set<string> {
  const urls = new Set<string>()
  for (const child of folder?.children ?? []) {
    if (!isFolder(child)) urls.add(child.url)
  }
  return urls
}
