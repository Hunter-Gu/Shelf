import { describe, expect, it } from "vitest"

import {
  nameProblem,
  readFolders,
  turnFoldersIntoSpaces,
  type BookmarkNode
} from "./folder-spaces"

const link = (id: string): BookmarkNode => ({
  id,
  title: id,
  url: `https://${id}.example/`
})

function tree(bar: BookmarkNode[], other: BookmarkNode[] = []): BookmarkNode {
  return {
    id: "0",
    title: "",
    children: [
      { id: "1", title: "Bookmarks Bar", children: bar },
      { id: "2", title: "Other Bookmarks", children: other }
    ]
  }
}

describe("readFolders", () => {
  it("lists plain top-level folders with their bookmark counts", () => {
    const { candidates } = readFolders(
      tree(
        [
          link("a"),
          {
            id: "work",
            title: "Work",
            children: [
              link("b"),
              { id: "sub", title: "Sub", children: [link("c")] }
            ]
          },
          { id: "space", title: "Reading (Shelf)", children: [] }
        ],
        [
          { id: "recipes", title: "Recipes", children: [link("d")] },
          { id: "pins", title: "Pins (Shelf|Pins)", children: [] }
        ]
      )
    )

    expect(candidates).toEqual([
      {
        id: "work",
        parentId: "1",
        title: "Work",
        location: "Bookmarks Bar",
        bookmarks: 2
      },
      {
        id: "recipes",
        parentId: "2",
        title: "Recipes",
        location: "Other Bookmarks",
        bookmarks: 1
      }
    ])
  })

  it("includes folders inside Home's own folder", () => {
    const { candidates } = readFolders(
      tree([
        {
          id: "home",
          title: "[🏠] Home (Shelf|Home)",
          children: [{ id: "trip", title: "Trip", children: [] }]
        }
      ])
    )

    expect(candidates).toMatchObject([
      { id: "trip", parentId: "home", location: "Home" }
    ])
  })

  it("collects the names spaces already use, Home included", () => {
    expect(
      readFolders(tree([{ id: "s", title: "[📚] Reading (Shelf)" }])).takenNames
    ).toEqual(["Reading", "Home"])
    expect(
      readFolders(tree([{ id: "h", title: "Base (Shelf|Home)" }])).takenNames
    ).toEqual(["Base"])
  })
})

describe("nameProblem", () => {
  const names = { takenNames: ["Reading"], otherChosenNames: ["Work"] }

  it("accepts a free name", () => {
    expect(nameProblem("Recipes", names)).toBeNull()
  })

  it("rejects empty, taken and repeated names", () => {
    expect(nameProblem("  ", names)).toBe("Enter a name")
    expect(nameProblem("reading ", names)).toBe('"reading" is already a space')
    expect(nameProblem("WORK", names)).toBe("Two spaces can't share a name")
  })
})

describe("turnFoldersIntoSpaces", () => {
  it("moves folders to the Bookmarks Bar and renames them as spaces", async () => {
    const calls: string[] = []
    const { candidates, bookmarksBarId } = readFolders(
      tree(
        [{ id: "work", title: "Work", children: [] }],
        [{ id: "recipes", title: "Recipes", children: [] }]
      )
    )

    const result = await turnFoldersIntoSpaces(
      [
        { id: "work", name: "Day job", logo: "💼" },
        { id: "recipes", name: "Recipes", logo: "" }
      ],
      candidates,
      bookmarksBarId,
      {
        move: async (id, { parentId }) => calls.push(`move ${id} ${parentId}`),
        update: async (id, { title }) => calls.push(`title ${id} ${title}`)
      }
    )

    expect(calls).toEqual([
      "title work [💼] Day job (Shelf)",
      "move recipes 1",
      "title recipes Recipes (Shelf)"
    ])
    expect(result).toEqual({ spaces: 2, failed: 0 })
  })

  it("keeps going when one folder fails", async () => {
    const { candidates, bookmarksBarId } = readFolders(
      tree([
        { id: "a", title: "A", children: [] },
        { id: "b", title: "B", children: [] }
      ])
    )

    const result = await turnFoldersIntoSpaces(
      [
        { id: "a", name: "A", logo: "" },
        { id: "b", name: "B", logo: "" }
      ],
      candidates,
      bookmarksBarId,
      {
        move: async () => {},
        update: async (id) => {
          if (id === "a") throw new Error("gone")
        }
      }
    )

    expect(result).toEqual({ spaces: 1, failed: 1 })
  })
})
