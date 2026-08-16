import { describe, expect, it } from "vitest"

import type { Folder } from "~/bookmark-model"

import {
  canDropBookmarkItem,
  isSameDropPosition,
  planBookmarkDrop,
  type BookmarkDragBookmarkItem,
  type BookmarkDragItem,
  type BookmarkDropTarget,
  type BookmarkZone
} from "./bookmark-drop"

const source = (zone: BookmarkZone): BookmarkDragBookmarkItem => ({
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

describe("isSameDropPosition", () => {
  it("treats both boundaries around the source as the same position", () => {
    expect(
      isSameDropPosition(
        { parentId: "folder", index: 1 },
        { parentId: "folder", index: 1 }
      )
    ).toBe(true)
    expect(
      isSameDropPosition(
        { parentId: "folder", index: 1 },
        { parentId: "folder", index: 2 }
      )
    ).toBe(true)
  })

  it("detects a real same-folder or cross-folder move", () => {
    expect(
      isSameDropPosition(
        { parentId: "folder", index: 4 },
        { parentId: "folder", index: 1 }
      )
    ).toBe(false)
    expect(
      isSameDropPosition(
        { parentId: "source", index: 1 },
        { parentId: "target", index: 4 }
      )
    ).toBe(false)
  })
})

describe("canDropBookmarkItem", () => {
  const workspace: Folder = {
    id: "workspace",
    parentId: "root",
    index: 0,
    title: "Workspace",
    children: [
      {
        id: "folder",
        parentId: "workspace",
        index: 0,
        title: "Folder",
        children: [
          {
            id: "child",
            parentId: "folder",
            index: 0,
            title: "Child"
          }
        ]
      },
      {
        id: "sibling",
        parentId: "workspace",
        index: 1,
        title: "Sibling"
      }
    ]
  }
  const folder: BookmarkDragItem = {
    kind: "folder",
    zone: "workspace",
    id: "folder",
    parentId: "workspace",
    index: 0,
    title: "Folder"
  }

  it("rejects pin, favorite, self, and descendant targets for folders", () => {
    expect(canDropBookmarkItem(folder, target("pin"), workspace)).toBe(false)
    expect(canDropBookmarkItem(folder, target("favorite"), workspace)).toBe(
      false
    )
    expect(
      canDropBookmarkItem(
        folder,
        { ...target("workspace"), parentId: "folder" },
        workspace
      )
    ).toBe(false)
    expect(
      canDropBookmarkItem(
        folder,
        { ...target("workspace"), parentId: "child" },
        workspace
      )
    ).toBe(false)
  })

  it("allows folders elsewhere in the workspace and bookmarks in every zone", () => {
    expect(
      canDropBookmarkItem(
        folder,
        { ...target("workspace"), parentId: "sibling" },
        workspace
      )
    ).toBe(true)
    expect(
      canDropBookmarkItem(source("workspace"), target("pin"), workspace)
    ).toBe(true)
  })
})
