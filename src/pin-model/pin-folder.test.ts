import { describe, expect, it } from "vitest"

import type { RootTree } from "~/bookmark-model"

import {
  collectFolderUrls,
  FAVORITES_FOLDER_TITLE,
  findSpecialFolder,
  PINS_FOLDER_TITLE
} from "./pin-folder"

function makeTree(otherBookmarksChildren: RootTree["children"][1]["children"]): RootTree {
  return {
    id: "0",
    parentId: "",
    index: 0,
    title: "root",
    children: [
      { id: "1", parentId: "0", index: 0, title: "Bookmarks Bar", children: [] },
      {
        id: "2",
        parentId: "0",
        index: 1,
        title: "Other Bookmarks",
        children: otherBookmarksChildren
      }
    ]
  }
}

describe("findSpecialFolder", () => {
  it("finds a special folder by exact title under Other Bookmarks", () => {
    const tree = makeTree([
      { id: "10", parentId: "2", index: 0, title: "Some Folder", children: [] },
      { id: "11", parentId: "2", index: 1, title: PINS_FOLDER_TITLE, children: [] }
    ])

    const folder = findSpecialFolder(tree, PINS_FOLDER_TITLE)
    expect(folder?.id).toBe("11")
  })

  it("returns null when the folder doesn't exist yet", () => {
    const tree = makeTree([])
    expect(findSpecialFolder(tree, FAVORITES_FOLDER_TITLE)).toBeNull()
  })

  it("ignores a bookmark that happens to share the title", () => {
    const tree = makeTree([
      { id: "12", parentId: "2", index: 0, title: PINS_FOLDER_TITLE, url: "https://example.com" }
    ])
    expect(findSpecialFolder(tree, PINS_FOLDER_TITLE)).toBeNull()
  })

  it("still finds a folder under the title older versions gave it", () => {
    const tree = makeTree([
      { id: "13", parentId: "2", index: 0, title: "Pins (Shelf)", children: [] }
    ])

    expect(PINS_FOLDER_TITLE).toBe("Pins (Shelf|Pins)")
    expect(findSpecialFolder(tree, PINS_FOLDER_TITLE)?.id).toBe("13")
  })
})

describe("collectFolderUrls", () => {
  it("collects urls of direct bookmark children only", () => {
    const folder = {
      id: "11",
      parentId: "2",
      index: 0,
      title: PINS_FOLDER_TITLE,
      children: [
        { id: "20", parentId: "11", index: 0, title: "A", url: "https://a.example" },
        { id: "21", parentId: "11", index: 1, title: "B", url: "https://b.example" },
        { id: "22", parentId: "11", index: 2, title: "nested folder", children: [] }
      ]
    }
    expect(collectFolderUrls(folder)).toEqual(
      new Set(["https://a.example", "https://b.example"])
    )
  })

  it("returns an empty set for a null folder", () => {
    expect(collectFolderUrls(null)).toEqual(new Set())
  })
})
