type TreeNode = {
  id: string
  parentId: string
  index: number
  title: string
}

export type Bookmark = TreeNode & {
  url: string
}

export type RootTree = TreeNode & {
  children: [Folder, Folder]
}

export type Folder = TreeNode & {
  children?: Array<Folder | Bookmark>
}

export function isFolder(node: Partial<Folder | Bookmark>): node is Folder {
  return !("url" in node)
}

export type SearchState = {
  text: string
  tree: RootTree | null
}
