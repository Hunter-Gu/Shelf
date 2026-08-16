import { describe, expect, it } from "vitest"

import { filterBookmarksByUrl } from "../filter-bookmarks-by-url"
import type { Folder } from "../types"

const tree: Folder = {
  id: "workspace",
  parentId: "root",
  index: 0,
  title: "Workspace",
  children: [
    {
      id: "visible",
      parentId: "workspace",
      index: 0,
      title: "Visible",
      url: "https://visible.example/"
    },
    {
      id: "pinned",
      parentId: "workspace",
      index: 1,
      title: "Pinned",
      url: "https://hidden.example/"
    },
    {
      id: "folder",
      parentId: "workspace",
      index: 2,
      title: "Folder",
      children: [
        {
          id: "favorite",
          parentId: "folder",
          index: 0,
          title: "Favorite copy",
          url: "https://hidden.example/"
        }
      ]
    }
  ]
}

describe("filterBookmarksByUrl", () => {
  it("recursively hides every bookmark whose URL is excluded", () => {
    const filtered = filterBookmarksByUrl(
      tree,
      new Set(["https://hidden.example/"])
    )

    expect(filtered.children).toEqual([
      tree.children?.[0],
      { ...tree.children?.[2], children: [] }
    ])
    expect(tree.children).toHaveLength(3)
  })

  it("preserves the original tree when nothing is filtered", () => {
    expect(filterBookmarksByUrl(tree, new Set())).toBe(tree)
    expect(filterBookmarksByUrl(tree, new Set(["https://other.example/"]))).toBe(
      tree
    )
  })
})
