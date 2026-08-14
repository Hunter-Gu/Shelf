import { describe, expect, it, vi } from "vitest"

import type { Bookmark, Folder } from "../../../bookmark-model"
import { DnDMode, type DnDContextType } from "../../../context/dnd-context"
import { moveItem } from "./move-item"

const bookmark: Bookmark = {
  id: "bookmark",
  parentId: "folder",
  index: 0,
  title: "Bookmark",
  url: "https://example.com"
}

const childFolder: Folder = {
  id: "child",
  parentId: "folder",
  index: 1,
  title: "Child"
}

const folder: Folder = {
  id: "folder",
  parentId: "root",
  index: 0,
  title: "Folder",
  children: [bookmark, childFolder]
}

describe("moveItem", () => {
  it("does not move an item onto itself", () => {
    const move = vi.fn()
    moveItem(bookmark, { ...bookmark, mode: DnDMode.Append }, { move })
    expect(move).not.toHaveBeenCalled()
  })

  it("does not move a folder into one of its descendants", () => {
    const move = vi.fn()
    moveItem(folder, { ...childFolder, mode: DnDMode.Insert }, { move })
    expect(move).not.toHaveBeenCalled()
  })

  it("moves a valid item after the target", () => {
    const move = vi.fn()
    const target: DnDContextType = {
      ...childFolder,
      parentId: "root",
      index: 2,
      mode: DnDMode.Append
    }

    moveItem(bookmark, target, { move })

    expect(move).toHaveBeenCalledWith("bookmark", {
      parentId: "root",
      index: 3
    })
  })
})
