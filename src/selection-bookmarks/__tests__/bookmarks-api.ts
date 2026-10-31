import type { BookmarkNode } from "../folder"
import { HighlightStore } from "../store"

export function collection(extra: BookmarkNode[] = []) {
  const tree: BookmarkNode = {
    id: "root",
    title: "",
    children: [
      {
        id: "bar",
        title: "Bookmarks Bar",
        children: [{ id: "work", title: "Work (Shelf)", children: extra }]
      },
      { id: "other", title: "Other Bookmarks", children: [] }
    ]
  }
  const find = (id: string, node = tree): BookmarkNode | undefined =>
    node.id === id
      ? node
      : node.children?.map((child) => find(id, child)).find(Boolean)
  const created: BookmarkNode[] = []
  let treeReads = 0
  const parentOf = (id: string, node = tree): BookmarkNode | undefined =>
    node.children?.some((child) => child.id === id)
      ? node
      : node.children?.map((child) => parentOf(id, child)).find(Boolean)
  const api = {
    async move(id: string, destination: { parentId: string }) {
      const node = find(id)
      const parent = parentOf(id)
      const nextParent = find(destination.parentId)
      if (!node || !parent || !nextParent) throw new Error("Not found")
      parent.children = parent.children!.filter((child) => child.id !== id)
      nextParent.children ??= []
      nextParent.children.push(node)
      node.parentId = nextParent.id
      return structuredClone(node)
    },
    async remove(id: string) {
      const parent = parentOf(id)
      if (!parent) throw new Error("Not found")
      parent.children = parent.children!.filter((child) => child.id !== id)
    },
    async update(id: string, changes: { url: string }) {
      const node = find(id)
      if (!node) throw new Error("Not found")
      Object.assign(node, changes)
      return structuredClone(node)
    },
    async getTree() {
      treeReads++
      return [structuredClone(tree)]
    },
    async getSubTree(id: string) {
      const node = find(id)
      if (!node) throw new Error("Not found")
      return [structuredClone(node)]
    },
    async create(input: { parentId: string; title: string; url?: string }) {
      const node: BookmarkNode = { ...input, id: `created-${created.length}` }
      const parent = find(input.parentId)!
      parent.children ??= []
      parent.children.push(node)
      created.push(node)
      return structuredClone(node)
    }
  }
  return {
    tree,
    find,
    created,
    api,
    treeReads: () => treeReads,
    store: new HighlightStore(api)
  }
}

export const input = {
  text: "a passage worth saving",
  pageUrl: "https://example.com/article?version=1",
  pageTitle: "Article title",
  folderId: "work",
  color: "yellow" as const
}
