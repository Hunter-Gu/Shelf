import { isFolder, type Folder, type RootTree } from "~/bookmark-model/types"

import { isHighlightsFolder } from "./folder"

function visibleFolder(folder: Folder): Folder {
  if (!folder.children) return folder
  let changed = false
  const children = folder.children.flatMap((child) => {
    if (isHighlightsFolder(child)) {
      changed = true
      return []
    }
    const next = isFolder(child) ? visibleFolder(child) : child
    if (next !== child) changed = true
    return [next]
  })
  return changed ? { ...folder, children } : folder
}

export function hideHighlights(tree: RootTree): RootTree {
  const children = tree.children.map(visibleFolder) as RootTree["children"]
  return children.every((child, index) => child === tree.children[index])
    ? tree
    : { ...tree, children }
}
