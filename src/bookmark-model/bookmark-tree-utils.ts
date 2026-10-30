import { isFolder, type Bookmark, type Folder } from "./types"

export class BookmarkTreeUtils {
  private static findNodeById(draft: Folder, id: string) {
    const find = (
      node: Folder | Bookmark
    ): Folder | Bookmark | null | undefined => {
      if (node.id === id) {
        return node
      }

      if (!isFolder(node)) {
        return null
      }

      let i = 0
      const children = node.children || []
      while (i < children.length) {
        const res = find(children[i])

        if (res) {
          return res
        }

        i++
      }
    }

    return find(draft)
  }

  private static updateIndexFrom(startItemIndex: number, draft: Folder) {
    const children = draft.children || []
    if (startItemIndex >= children.length) {
      return
    }

    children.slice(startItemIndex).forEach((item, index) => {
      item.index = startItemIndex + index
    })
  }

  static add(draft: Folder, node: Bookmark | Folder) {
    const parentNode =
      node.parentId === draft.id
        ? draft
        : this.findNodeById(draft, node.parentId)

    if (parentNode && isFolder(parentNode)) {
      parentNode.children = parentNode.children || []
      // A reload() that lands while an onCreated patch for the same node is
      // still queued can already contain this id by the time the patch
      // applies — splicing again would insert a visible duplicate.
      if (parentNode.children.some((child) => child.id === node.id)) return

      parentNode.children.splice(node.index, 0, node)

      // update from old item
      this.updateIndexFrom(node.index + 1, parentNode)
    }
  }

  static change(
    draft: Folder,
    node: Pick<Folder, "id" | "title"> | Pick<Bookmark, "id" | "title" | "url">
  ) {
    const data = this.findNodeById(draft, node.id)

    if (!data || isFolder(data) !== isFolder(node)) {
      return
    }

    data.title = node.title

    if (!isFolder(data) && "url" in node) {
      data.url = node.url
    }
  }

  static move(
    draft: Folder,
    node: {
      id: string
      index: number
      parentId: string
      oldIndex: number
      oldParentId: string
      title?: string
      url?: string
    }
  ) {
    const { oldParentId, parentId, index, oldIndex, ...rest } = node
    const item = this.findNodeById(draft, node.id)

    if (!item) {
      if (rest.title !== undefined) {
        this.add(draft, { ...rest, parentId, index } as Bookmark | Folder)
      }
      return
    }

    // remove from old
    this.remove(draft, {
      id: node.id,
      index: oldIndex,
      parentId: oldParentId
    })

    // add to new
    this.add(draft, {
      ...item,
      parentId: parentId,
      index: index
    })
  }

  static remove(
    draft: Folder,
    node: { id: string; index: number; parentId: string }
  ) {
    const parentNode = this.findNodeById(draft, node.parentId)

    if (!parentNode || !isFolder(parentNode)) return

    const children = parentNode.children || []
    // The reported index is only trustworthy if it still points at the
    // expected item — if an earlier patch ever drifted, fall back to
    // locating it by id rather than splicing out whatever sits there now.
    const removedIndex =
      children[node.index]?.id === node.id
        ? node.index
        : children.findIndex((child) => child.id === node.id)

    if (removedIndex === -1) return

    children.splice(removedIndex, 1)
    parentNode.children = children
    this.updateIndexFrom(removedIndex, parentNode)
  }

  static reorder(
    draft: Folder,
    { id, childIds }: { id: string; childIds: string[] }
  ) {
    const sortMap = new Map(childIds.map((id, index) => [id, index]))

    const parentNode = this.findNodeById(draft, id)

    if (parentNode && isFolder(parentNode)) {
      ;(parentNode.children || [])
        .sort((a, b) => {
          const indexA = sortMap.has(a.id) ? sortMap.get(a.id)! : Infinity
          const indexB = sortMap.has(b.id) ? sortMap.get(b.id)! : Infinity
          return indexA - indexB
        })
        .forEach((item, index) => {
          item.index = index
        })
    }
  }

  static walk(tree: Folder, access: (item: Folder | Bookmark) => void) {
    const walk = (item: Folder | Bookmark) => {
      access(item)
      if (isFolder(item)) {
        item.children?.forEach((child) => {
          walk(child)
        })
      }
    }
    walk(tree)
  }
}
