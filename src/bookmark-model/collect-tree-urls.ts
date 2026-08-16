import { BookmarkTreeUtils } from "./bookmark-tree-utils"
import { isFolder, type Folder } from "./types"

export function collectTreeUrls(folder: Folder): Set<string> {
  const urls = new Set<string>()
  BookmarkTreeUtils.walk(folder, (item) => {
    if (!isFolder(item)) urls.add(item.url)
  })
  return urls
}
