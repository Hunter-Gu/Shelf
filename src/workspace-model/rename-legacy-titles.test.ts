import { describe, expect, it, vi } from "vitest"

import type { Bookmark, Folder, RootTree } from "~/bookmark-model"

import { legacyTitleRenames, renameLegacyTitles } from "./rename-legacy-titles"

function folder(id: string, title: string, parentId: string): Folder {
  return { id, parentId, index: 0, title, children: [] }
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
      {
        id: "2",
        parentId: "0",
        index: 1,
        title: "Other",
        children: otherChildren
      }
    ]
  }
}

describe("legacyTitleRenames", () => {
  it("moves old workspace, Home, pins and favorites titles to the Shelf format", () => {
    const tree = treeOf(
      [
        folder("10", "[🧠] Read (Workspace)", "1"),
        folder("11", "[🏠] Reading (Home Workspace)", "1")
      ],
      [
        folder("20", "Pins (Shelf)", "2"),
        folder("21", "Favorites (Shelf)", "2"),
        folder("22", "Write (Workspace)", "2")
      ]
    )

    expect(legacyTitleRenames(tree)).toEqual([
      { id: "10", title: "[🧠] Read (Shelf)" },
      { id: "11", title: "[🏠] Reading (Shelf|Home)" },
      { id: "20", title: "Pins (Shelf|Pins)" },
      { id: "21", title: "Favorites (Shelf|Favorites)" },
      { id: "22", title: "Write (Shelf)" }
    ])
  })

  it("leaves folders already in the new format, plain folders and bookmarks alone", () => {
    const tree = treeOf(
      [
        folder("10", "[👨‍💻] Dev (Shelf)", "1"),
        folder("11", "Pins (Shelf)", "1"),
        folder("12", "Notes", "1"),
        {
          id: "13",
          parentId: "1",
          index: 0,
          title: "Read (Workspace)",
          url: "https://a.example"
        }
      ],
      [folder("20", "Pins (Shelf|Pins)", "2")]
    )

    expect(legacyTitleRenames(tree)).toEqual([])
  })
})

describe("renameLegacyTitles", () => {
  it("returns the tree with the titles that were renamed", async () => {
    const tree = treeOf([folder("10", "Read (Workspace)", "1")])
    const changeBookmark = vi.fn().mockResolvedValue(undefined)

    const next = await renameLegacyTitles(tree, changeBookmark)

    expect(changeBookmark).toHaveBeenCalledWith("10", { title: "Read (Shelf)" })
    expect(next.children[0].children?.[0].title).toBe("Read (Shelf)")
  })

  it("keeps the old title when a rename fails", async () => {
    const tree = treeOf([folder("10", "Read (Workspace)", "1")])
    const changeBookmark = vi.fn().mockRejectedValue(new Error("gone"))
    vi.spyOn(console, "error").mockImplementation(() => {})

    const next = await renameLegacyTitles(tree, changeBookmark)

    expect(next).toBe(tree)
  })
})
