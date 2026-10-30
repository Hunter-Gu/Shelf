import { isFolder, type Folder, type RootTree } from "~/bookmark-model"

export type SuggestionSpace = { id: string; title: string; isHome: boolean }

export type FolderSuggestion = {
  folderId: string
  /** The folder's name, led by its space's when that isn't the current one. */
  label: string
  host: string
}

export function siteOf(url: string) {
  try {
    const { protocol, hostname } = new URL(url)
    if (protocol !== "http:" && protocol !== "https:") return null
    return hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    return null
  }
}

/**
 * The folder that already holds the most bookmarks from the same site as a
 * page just saved, so the page can be offered a move there. Pins, favorites
 * and the folder it was saved into don't count.
 */
export function suggestFolder(
  tree: RootTree,
  saved: { id: string; url: string; parentId: string },
  {
    excludeIds,
    spaces,
    currentSpaceId
  }: {
    excludeIds: string[]
    spaces: SuggestionSpace[]
    currentSpaceId: string
  }
): FolderSuggestion | null {
  const host = siteOf(saved.url)
  if (!host) return null

  const roots = new Set(tree.children.map((root) => root.id))
  const counts = new Map<
    string,
    { folder: Folder; path: Folder[]; count: number }
  >()

  const visit = (folder: Folder, path: Folder[]) => {
    for (const child of folder.children ?? []) {
      if (isFolder(child)) {
        if (!excludeIds.includes(child.id)) visit(child, [...path, child])
        continue
      }
      if (child.id === saved.id || siteOf(child.url) !== host) continue
      if (roots.has(folder.id) || folder.id === saved.parentId) continue
      const entry = counts.get(folder.id) ?? { folder, path, count: 0 }
      entry.count += 1
      counts.set(folder.id, entry)
    }
  }
  tree.children.forEach((root) => visit(root, []))

  let best: { folder: Folder; path: Folder[]; count: number } | undefined
  for (const entry of counts.values()) {
    if (!best || entry.count > best.count) best = entry
  }
  if (!best) return null

  const home = spaces.find((space) => space.isHome)
  const space =
    [...best.path]
      .reverse()
      .map((folder) => spaces.find((item) => item.id === folder.id))
      .find(Boolean) ?? home
  const label =
    space?.id === best.folder.id
      ? space.title
      : !space || space.id === currentSpaceId
        ? best.folder.title
        : `${space.title} › ${best.folder.title}`

  return { folderId: best.folder.id, label, host }
}
