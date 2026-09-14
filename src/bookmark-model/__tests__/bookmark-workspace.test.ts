import { describe, expect, it } from "vitest"

import { toHomeTree } from "../bookmark-workspace"
import type { Bookmark, Folder, RootTree } from "../types"

function bookmark(id: string, parentId: string): Bookmark {
  return { id, parentId, index: 0, title: id, url: `https://${id}.example/` }
}

function folder(
  id: string,
  parentId: string,
  children: Array<Folder | Bookmark> = []
): Folder {
  return { id, parentId, index: 0, title: id, children }
}

function treeOf(
  barChildren: Array<Folder | Bookmark>,
  otherChildren: Array<Folder | Bookmark> = []
): RootTree {
  return {
    id: "0",
    parentId: "",
    index: 0,
    title: "",
    children: [
      { id: "1", parentId: "0", index: 0, title: "Bar", children: barChildren },
      { id: "2", parentId: "0", index: 1, title: "Other", children: otherChildren }
    ]
  }
}

const idsOf = (folder: Folder) => (folder.children ?? []).map((item) => item.id)

describe("toHomeTree", () => {
  it("gathers loose bookmarks from both roots while Home has no folder", () => {
    const tree = treeOf([bookmark("bar-item", "1")], [bookmark("other-item", "2")])

    const home = toHomeTree(tree, "1", new Set())

    expect(home.id).toBe("1")
    expect(idsOf(home)).toEqual(["bar-item", "other-item"])
  })

  it("hides workspace folders and explicitly excluded folders", () => {
    const tree = treeOf(
      [folder("workspace", "1"), bookmark("bar-item", "1")],
      [folder("pins", "2"), bookmark("other-item", "2")]
    )

    const home = toHomeTree(tree, "1", new Set(["workspace", "pins"]))

    expect(idsOf(home)).toEqual(["bar-item", "other-item"])
  })

  it("puts Home's own folder contents first once it has one", () => {
    const tree = treeOf(
      [folder("home", "1", [bookmark("filed", "home")]), bookmark("bar-item", "1")],
      [bookmark("other-item", "2")]
    )

    const home = toHomeTree(tree, "home", new Set(["home"]))

    expect(home.id).toBe("home")
    expect(idsOf(home)).toEqual(["filed", "bar-item", "other-item"])
  })
})
