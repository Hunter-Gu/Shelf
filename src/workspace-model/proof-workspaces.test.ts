import { describe, expect, it } from "vitest"

import type { Folder, RootTree } from "~/bookmark-model"

import { proofWorkspaces } from "./proof-workspaces"
import { createWorkspace, WorkspaceType, type Workspace } from "./workspace"

function folder(id: string, title: string, parentId: string): Folder {
  return { id, parentId, index: 0, title, children: [] }
}

function treeOf(barChildren: Folder[], otherChildren: Folder[] = []): RootTree {
  return {
    id: "0",
    parentId: "",
    index: 0,
    title: "",
    children: [
      { id: "1", parentId: "0", index: 0, title: "Bookmarks Bar", children: barChildren },
      { id: "2", parentId: "0", index: 1, title: "Other Bookmarks", children: otherChildren }
    ]
  }
}

const home = createWorkspace({
  id: "1",
  title: "Home",
  logo: "",
  type: WorkspaceType.BookmarksBar
})

function normal(id: string, title: string, extra: Partial<Workspace> = {}) {
  return createWorkspace({ id, title, logo: "", ...extra })
}

describe("proofWorkspaces", () => {
  it("hydrates a workspace from the folder its id still resolves to", () => {
    const tree = treeOf([folder("10", "[🧠] Read (Workspace)", "1")])

    expect(proofWorkspaces(tree, [normal("10", "Stale")])).toEqual([
      normal("10", "Read", { logo: "🧠" })
    ])
  })

  it("re-adopts a workspace by title when its stored id no longer resolves", () => {
    const tree = treeOf([folder("99", "Read (Workspace)", "1")])
    const stored = normal("10", "Read", {
      color: "teal",
      isPinsCollapsed: true
    })

    expect(proofWorkspaces(tree, [stored])).toEqual([
      normal("99", "Read", { color: "teal", isPinsCollapsed: true })
    ])
  })

  it("prefers a title match over an id that landed on an unrelated folder", () => {
    const tree = treeOf([folder("10", "Notes", "1"), folder("99", "Read (Workspace)", "1")])

    expect(proofWorkspaces(tree, [normal("10", "Read")])).toEqual([
      normal("99", "Read")
    ])
  })

  it("keeps a workspace whose folder was renamed out of the format", () => {
    const tree = treeOf([folder("10", "Notes", "1")])

    expect(proofWorkspaces(tree, [normal("10", "Read")])).toEqual([
      normal("10", "Read")
    ])
  })

  it("drops a workspace when no folder matches its id or title", () => {
    const tree = treeOf([folder("99", "Write (Workspace)", "1")])

    expect(proofWorkspaces(tree, [normal("10", "Read")])).toEqual([])
  })

  it("gives each drifted workspace a folder of its own", () => {
    const tree = treeOf([
      folder("98", "Read (Workspace)", "1"),
      folder("99", "Read (Workspace)", "1")
    ])

    expect(
      proofWorkspaces(tree, [normal("10", "Read"), normal("11", "Read")])
    ).toEqual([normal("98", "Read"), normal("99", "Read")])
  })

  it("keeps Home anchored to the Bookmarks Bar until it owns a folder", () => {
    expect(proofWorkspaces(treeOf([]), [home])).toEqual([home])
  })

  it("re-adopts Home's own folder by its marker", () => {
    const tree = treeOf([folder("42", "[🏠] Home (Home Workspace)", "1")])
    const stored = createWorkspace({
      id: "41",
      title: "Home",
      logo: "",
      type: WorkspaceType.BookmarksBar
    })

    expect(proofWorkspaces(tree, [stored])).toEqual([
      createWorkspace({
        id: "42",
        title: "Home",
        logo: "🏠",
        type: WorkspaceType.BookmarksBar
      })
    ])
  })

  it("follows a renamed Home by its marker, not its name", () => {
    const tree = treeOf([folder("42", "工作 (Home Workspace)", "1")])
    const stored = createWorkspace({
      id: "41",
      title: "Home",
      logo: "",
      type: WorkspaceType.BookmarksBar
    })

    expect(proofWorkspaces(tree, [stored])).toEqual([
      createWorkspace({
        id: "42",
        title: "工作",
        logo: "",
        type: WorkspaceType.BookmarksBar
      })
    ])
  })

  it("takes over the Home folder when one shows up", () => {
    const tree = treeOf([folder("42", "[🏠] Home (Home Workspace)", "1")])

    expect(proofWorkspaces(tree, [home])).toEqual([
      createWorkspace({
        id: "42",
        title: "Home",
        logo: "🏠",
        type: WorkspaceType.BookmarksBar
      })
    ])
  })

  it("falls back to the Bookmarks Bar when Home's folder is gone", () => {
    const stored = createWorkspace({
      id: "42",
      title: "Home",
      logo: "🏠",
      type: WorkspaceType.BookmarksBar
    })

    expect(proofWorkspaces(treeOf([]), [stored])).toEqual([
      createWorkspace({
        id: "1",
        title: "Home",
        logo: "🏠",
        type: WorkspaceType.BookmarksBar
      })
    ])
  })

  it("never lets a normal workspace adopt Home's folder", () => {
    const tree = treeOf([folder("42", "Read (Home Workspace)", "1")])

    expect(proofWorkspaces(tree, [normal("10", "Read")])).toEqual([])
  })

  it("lets a normal workspace be named Home once Home is renamed", () => {
    const tree = treeOf([
      folder("42", "工作 (Home Workspace)", "1"),
      folder("10", "Home (Workspace)", "1")
    ])

    expect(proofWorkspaces(tree, [home, normal("10", "Home")])).toEqual([
      createWorkspace({
        id: "42",
        title: "工作",
        logo: "",
        type: WorkspaceType.BookmarksBar
      }),
      normal("10", "Home")
    ])
  })

  it("drops the Other Bookmarks workspace stored by older versions", () => {
    const tree = treeOf([], [])
    const otherBookmarks = createWorkspace({
      id: "2",
      title: "Other",
      logo: "",
      type: 1 as WorkspaceType
    })

    expect(proofWorkspaces(tree, [home, otherBookmarks])).toEqual([home])
  })

  it("still resolves a workspace left under Other Bookmarks", () => {
    const tree = treeOf([], [folder("10", "Read (Workspace)", "2")])

    expect(proofWorkspaces(tree, [normal("10", "Read")])).toEqual([
      normal("10", "Read")
    ])
  })
})
