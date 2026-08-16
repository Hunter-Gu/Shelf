import { isFolder, type Folder } from "./types"

export function filterBookmarksByUrl(
  folder: Folder,
  excludedUrls: ReadonlySet<string>
): Folder {
  if (!folder.children?.length || excludedUrls.size === 0) return folder

  let changed = false
  const children = folder.children.flatMap((item) => {
    if (!isFolder(item)) {
      if (!excludedUrls.has(item.url)) return [item]
      changed = true
      return []
    }

    const nextFolder = filterBookmarksByUrl(item, excludedUrls)
    if (nextFolder !== item) changed = true
    return [nextFolder]
  })

  return changed ? { ...folder, children } : folder
}
