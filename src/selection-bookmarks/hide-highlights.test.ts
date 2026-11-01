import { describe, expect, it } from "vitest"

import { buildSearchTree } from "~/bookmark-model/build-search-tree"
import type { Bookmark, RootTree } from "~/bookmark-model/types"

import { HIGHLIGHTS_FOLDER_TITLE } from "./folder"
import { hideHighlights } from "./hide-highlights"

function tree(): RootTree {
  const passage: Bookmark = {
    id: "passage",
    parentId: "hidden",
    index: 0,
    title: "Saved quotation",
    url: "https://example.com/#:~:text=quote"
  }
  return {
    id: "root",
    parentId: "",
    index: 0,
    title: "",
    children: [
      {
        id: "bar",
        parentId: "root",
        index: 0,
        title: "Bookmarks Bar",
        children: [
          {
            id: "page",
            parentId: "bar",
            index: 0,
            title: HIGHLIGHTS_FOLDER_TITLE,
            url: "https://example.com"
          }
        ]
      },
      {
        id: "other",
        parentId: "root",
        index: 1,
        title: "Other Bookmarks",
        children: [
          {
            id: "hidden",
            parentId: "other",
            index: 0,
            title: HIGHLIGHTS_FOLDER_TITLE,
            children: [passage]
          }
        ]
      }
    ]
  }
}

describe("hideHighlights", () => {
  it("omits the internal folder and its data while retaining ordinary bookmarks", () => {
    const raw = tree()
    const visible = hideHighlights(raw)
    expect(visible.children[1].children).toEqual([])
    expect(visible.children[0]).toBe(raw.children[0])
    expect(raw.children[1].children).toHaveLength(1)
  })

  it("omits renamed internal folders even when moved inside a space", () => {
    const raw = tree()
    const folder = raw.children[1].children![0]
    folder.title = "My quotes (Shelf|Highlights)"
    raw.children[1].children = []
    raw.children[0].children!.push({
      id: "space",
      parentId: "bar",
      index: 1,
      title: "Work (Shelf)",
      children: [folder]
    })
    const visible = hideHighlights(raw)
    const space = visible.children[0].children![1]
    expect("children" in space && space.children).toEqual([])
  })

  it("does not reintroduce hidden data from Chrome search results", () => {
    const raw = tree()
    const folder = raw.children[1].children![0]
    const results = [
      folder,
      ...("children" in folder ? (folder.children ?? []) : [])
    ]
    const result = buildSearchTree(hideHighlights(raw), results)
    expect(result.children.every((root) => !root.children?.length)).toBe(true)
  })
})
