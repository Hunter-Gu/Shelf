import { describe, expect, it, vi } from "vitest"

import {
  toHomeTree,
  type Bookmark,
  type Folder,
  type RootTree
} from "~/bookmark-model"

import { adoptWorkspaceFolders } from "./adopt-workspace-folders"
import { proofWorkspaces } from "./proof-workspaces"
import { createWorkspace, WorkspaceType } from "./workspace"

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

const home = createWorkspace({
  id: "1",
  title: "Home",
  logo: "",
  type: WorkspaceType.BookmarksBar
})

const noMoves = () => Promise.resolve()

describe("adoptWorkspaceFolders", () => {
  it("gives a fresh install a Home pointing at the Bookmarks Bar", async () => {
    expect(await adoptWorkspaceFolders(treeOf([]), [], noMoves)).toEqual([home])
  })

  it("adopts workspace folders the stored list doesn't know about", async () => {
    const tree = treeOf([
      folder("10", "[🧠] Read (Shelf)", "1"),
      folder("11", "Notes", "1")
    ])

    expect(await adoptWorkspaceFolders(tree, [home], noMoves)).toEqual([
      home,
      createWorkspace({ id: "10", title: "Read", logo: "🧠" })
    ])
  })

  it("adopts an existing Home folder, under whatever name, and puts it first", async () => {
    const tree = treeOf([
      folder("10", "Read (Shelf)", "1"),
      folder("42", "[🏠] 工作 (Shelf|Home)", "1")
    ])

    expect(await adoptWorkspaceFolders(tree, [], noMoves)).toEqual([
      createWorkspace({
        id: "42",
        title: "工作",
        logo: "🏠",
        type: WorkspaceType.BookmarksBar
      }),
      createWorkspace({ id: "10", title: "Read", logo: "" })
    ])
  })

  it("leaves a stored order alone", async () => {
    const read = createWorkspace({ id: "10", title: "Read", logo: "" })
    const tree = treeOf([folder("10", "Read (Shelf)", "1")])

    expect(await adoptWorkspaceFolders(tree, [read, home], noMoves)).toEqual([
      read,
      home
    ])
  })

  it("pulls a workspace folder left under Other Bookmarks up to the bar", async () => {
    const moveBookmark = vi.fn().mockResolvedValue(undefined)
    const tree = treeOf(
      [],
      [
        folder("10", "Read (Shelf)", "2"),
        folder("20", "Shelf Pins", "2"),
        { id: "30", parentId: "2", index: 2, title: "Loose", url: "https://a/" }
      ]
    )

    const next = await adoptWorkspaceFolders(tree, [home], moveBookmark)

    expect(next).toEqual([
      home,
      createWorkspace({ id: "10", title: "Read", logo: "" })
    ])
    expect(moveBookmark.mock.calls).toEqual([["10", { parentId: "1" }]])
  })

  it("still returns a list when a folder vanishes mid-move", async () => {
    const moveBookmark = vi.fn().mockRejectedValue(new Error("No bookmark"))
    vi.spyOn(console, "error").mockImplementation(() => {})
    const tree = treeOf([], [folder("10", "Read (Shelf)", "2")])

    await expect(
      adoptWorkspaceFolders(tree, [home], moveBookmark)
    ).resolves.toHaveLength(2)
  })

  it("keeps workspaces already on the Bookmarks Bar where they are", async () => {
    const read = createWorkspace({ id: "10", title: "Read", logo: "" })
    const moveBookmark = vi.fn().mockResolvedValue(undefined)
    const tree = treeOf([folder("10", "Read (Shelf)", "1")])

    await adoptWorkspaceFolders(tree, [home, read], moveBookmark)

    expect(moveBookmark).not.toHaveBeenCalled()
  })
})

describe("upgrading from the Home/Other layout", () => {
  it("drops Other, keeps both workspaces and shows the rest under Home", async () => {
    const moveBookmark = vi.fn().mockResolvedValue(undefined)
    const stored = [
      createWorkspace({
        id: "1",
        title: "Home",
        logo: "🏠",
        type: WorkspaceType.BookmarksBar
      }),
      createWorkspace({
        id: "2",
        title: "Other",
        logo: "",
        type: 1 as WorkspaceType
      }),
      createWorkspace({ id: "10", title: "Read", logo: "" })
    ]
    const tree = treeOf(
      [
        folder("10", "Read (Shelf)", "1"),
        { id: "50", parentId: "1", index: 1, title: "Loose", url: "https://a/" }
      ],
      [
        // A workspace an older version left behind under Other Bookmarks, and
        // one the id-drift bug dropped from storage entirely.
        folder("20", "Write (Shelf)", "2"),
        folder("30", "Shelf Pins", "2"),
        {
          id: "60",
          parentId: "2",
          index: 2,
          title: "Stashed",
          url: "https://b/"
        }
      ]
    )

    const next = await adoptWorkspaceFolders(
      tree,
      proofWorkspaces(tree, stored),
      moveBookmark
    )

    expect(next).toEqual([
      createWorkspace({
        id: "1",
        title: "Home",
        logo: "🏠",
        type: WorkspaceType.BookmarksBar
      }),
      createWorkspace({ id: "10", title: "Read", logo: "" }),
      createWorkspace({ id: "20", title: "Write", logo: "" })
    ])
    expect(moveBookmark.mock.calls).toEqual([["20", { parentId: "1" }]])

    // Home shows both roots' loose bookmarks — workspace folders and the pins
    // folder stay hidden.
    const hiddenIds = new Set([...next.map((workspace) => workspace.id), "30"])
    const homeTree = toHomeTree(tree, "1", hiddenIds)

    expect((homeTree.children ?? []).map((item) => item.id)).toEqual([
      "50",
      "60"
    ])
  })
})
