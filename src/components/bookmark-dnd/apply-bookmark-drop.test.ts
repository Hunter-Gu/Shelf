import { describe, expect, it, vi } from "vitest"

import type { Folder } from "~/bookmark-model"

import { applyBookmarkDrop } from "./apply-bookmark-drop"
import type { BookmarkDragItem, BookmarkDropTarget } from "./bookmark-drop"

const favorite: BookmarkDragItem = {
  zone: "favorite",
  id: "favorite",
  parentId: "favorites",
  index: 0,
  title: "Example",
  url: "https://example.com/"
}

const target = (
  zone: BookmarkDropTarget["zone"],
  parentId: string
): BookmarkDropTarget => ({
  zone,
  parentId,
  index: 1,
  edge: "after"
})

function operations(order: string[] = []) {
  return {
    createBookmark: vi.fn(async () => {
      order.push("create-bookmark")
    }),
    moveBookmark: vi.fn(async () => {
      order.push("move-bookmark")
    }),
    movePin: vi.fn(async () => {
      order.push("move-pin")
    }),
    moveFavorite: vi.fn(async () => {
      order.push("move-favorite")
    }),
    placePin: vi.fn(async () => {
      order.push("place-pin")
    }),
    placeFavorite: vi.fn(async () => {
      order.push("place-favorite")
    }),
    removePinsByUrl: vi.fn(async () => {
      order.push("remove-pins")
    }),
    removeFavoritesByUrl: vi.fn(async () => {
      order.push("remove-favorites")
    })
  }
}

describe("applyBookmarkDrop", () => {
  it("creates a workspace source before moving a favorite into pins", async () => {
    const order: string[] = []
    const actions = operations(order)
    const workspace: Folder = {
      id: "workspace",
      parentId: "root",
      index: 0,
      title: "Workspace",
      children: []
    }

    await applyBookmarkDrop({
      source: favorite,
      target: target("pin", "pins"),
      workspaceTree: workspace,
      operations: actions
    })

    expect(order).toEqual(["create-bookmark", "place-pin"])
    // The favorite copy is moved into pins directly, not recreated —
    // avoids a separate create-then-delete that can leave neither side
    // landed if either step fails or the events race each other.
    expect(actions.placePin).toHaveBeenCalledWith(
      favorite,
      target("pin", "pins").index,
      favorite.id
    )
    expect(actions.removeFavoritesByUrl).not.toHaveBeenCalled()
  })

  it("moves a pin copy directly into favorites instead of recreating it", async () => {
    const actions = operations()
    const pin: BookmarkDragItem = {
      zone: "pin",
      id: "pin",
      parentId: "pins",
      index: 0,
      title: "Example",
      url: "https://example.com/"
    }

    await applyBookmarkDrop({
      source: pin,
      target: target("favorite", "favorites"),
      workspaceTree: null,
      operations: actions
    })

    expect(actions.placeFavorite).toHaveBeenCalledWith(
      pin,
      target("favorite", "favorites").index,
      pin.id
    )
    expect(actions.removePinsByUrl).not.toHaveBeenCalled()
  })

  it("creates a new copy (no moveFromId) when placing a workspace bookmark into pins", async () => {
    const actions = operations()
    const workspaceBookmark: BookmarkDragItem = {
      zone: "workspace",
      id: "bookmark",
      parentId: "workspace",
      index: 0,
      title: "Example",
      url: "https://example.com/"
    }

    await applyBookmarkDrop({
      source: workspaceBookmark,
      target: target("pin", "pins"),
      workspaceTree: null,
      operations: actions
    })

    expect(actions.placePin).toHaveBeenCalledWith(
      workspaceBookmark,
      target("pin", "pins").index,
      undefined
    )
  })

  it("moves an existing workspace source before clearing classifications", async () => {
    const order: string[] = []
    const actions = operations(order)
    const workspace: Folder = {
      id: "workspace",
      parentId: "root",
      index: 0,
      title: "Workspace",
      children: [
        {
          id: "source",
          parentId: "workspace",
          index: 0,
          title: favorite.title,
          url: favorite.url
        }
      ]
    }

    await applyBookmarkDrop({
      source: favorite,
      target: target("workspace", "workspace"),
      workspaceTree: workspace,
      operations: actions
    })

    expect(order).toEqual(["move-bookmark", "remove-pins", "remove-favorites"])
  })

  it("does not remove the source classification when target creation fails", async () => {
    const actions = operations()
    actions.placeFavorite.mockRejectedValueOnce(new Error("create failed"))

    await expect(
      applyBookmarkDrop({
        source: { ...favorite, zone: "pin", parentId: "pins" },
        target: target("favorite", "favorites"),
        workspaceTree: null,
        operations: actions
      })
    ).rejects.toThrow("create failed")

    expect(actions.removePinsByUrl).not.toHaveBeenCalled()
  })
})
