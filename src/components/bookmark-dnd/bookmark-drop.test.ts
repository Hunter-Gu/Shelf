import { describe, expect, it } from "vitest"

import {
  normalizeDropIndex,
  planBookmarkDrop,
  type BookmarkDragItem,
  type BookmarkDropTarget,
  type BookmarkZone
} from "./bookmark-drop"

const source = (zone: BookmarkZone): BookmarkDragItem => ({
  zone,
  id: `${zone}-source`,
  parentId: `${zone}-folder`,
  index: 1,
  title: "Example",
  url: "https://example.com/"
})

const target = (zone: BookmarkZone): BookmarkDropTarget => ({
  zone,
  parentId: `${zone}-folder`,
  index: 3,
  edge: "after"
})

describe("planBookmarkDrop", () => {
  it.each([
    ["workspace", "workspace", "reorder-workspace"],
    ["workspace", "pin", "move-to-pin"],
    ["workspace", "favorite", "move-to-favorite"],
    ["pin", "workspace", "move-to-workspace"],
    ["pin", "pin", "reorder-pin"],
    ["pin", "favorite", "move-to-favorite"],
    ["favorite", "workspace", "move-to-workspace"],
    ["favorite", "pin", "move-to-pin"],
    ["favorite", "favorite", "reorder-favorite"]
  ] as const)("plans %s → %s as %s", (from, to, expected) => {
    expect(planBookmarkDrop(source(from), target(to))).toBe(expected)
  })
})

describe("normalizeDropIndex", () => {
  it("shifts a same-folder downward boundary after removing the source", () => {
    expect(
      normalizeDropIndex(
        { parentId: "folder", index: 1 },
        { parentId: "folder", index: 4 }
      )
    ).toBe(3)
  })

  it("keeps upward and cross-folder boundaries unchanged", () => {
    expect(
      normalizeDropIndex(
        { parentId: "folder", index: 4 },
        { parentId: "folder", index: 1 }
      )
    ).toBe(1)
    expect(
      normalizeDropIndex(
        { parentId: "source", index: 1 },
        { parentId: "target", index: 4 }
      )
    ).toBe(4)
  })
})
