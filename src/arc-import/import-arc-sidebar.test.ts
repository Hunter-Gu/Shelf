import { describe, expect, it } from "vitest"

import {
  importArcSidebar,
  type BookmarkNode,
  type BookmarksApi
} from "./import-arc-sidebar"
import type { ArcSidebar } from "./parse-arc-sidebar"

function fakeBookmarks(bar: BookmarkNode[] = [], other: BookmarkNode[] = []) {
  let nextId = 100
  const root: BookmarkNode = {
    id: "0",
    title: "",
    children: [
      { id: "1", title: "Bookmarks Bar", children: bar },
      { id: "2", title: "Other Bookmarks", children: other }
    ]
  }
  const find = (node: BookmarkNode, id: string): BookmarkNode | undefined =>
    node.id === id
      ? node
      : node.children?.map((child) => find(child, id)).find(Boolean)

  const api: BookmarksApi = {
    getTree: async () => [structuredClone(root)],
    create: async ({ parentId, title, url }) => {
      const parent = find(root, parentId)
      if (!parent) throw new Error(`No folder ${parentId}`)
      const node: BookmarkNode = url
        ? { id: String(nextId++), title, url }
        : { id: String(nextId++), title, children: [] }
      parent.children = [...(parent.children ?? []), node]
      return { id: node.id }
    }
  }
  return { api, bar: () => root.children![0], other: () => root.children![1] }
}

const sidebar: ArcSidebar = {
  spaces: [
    {
      id: "work",
      title: "Work",
      emoji: "💼",
      profile: "default",
      items: [
        {
          kind: "folder",
          title: "Docs",
          children: [{ kind: "link", title: "B", url: "https://b.example" }]
        },
        { kind: "link", title: "A", url: "https://a.example" }
      ],
      today: [{ kind: "link", title: "Open", url: "https://open.example" }]
    },
    {
      id: "home",
      title: "Home",
      emoji: "",
      profile: "default",
      items: [{ kind: "link", title: "C", url: "https://c.example" }],
      today: []
    },
    {
      id: "scratch",
      title: "Scratch",
      emoji: "",
      profile: "Profile 1",
      items: [],
      today: [{ kind: "link", title: "Draft", url: "https://draft.example" }]
    }
  ],
  profiles: [
    {
      key: "default",
      label: "Main profile",
      favorites: [{ kind: "link", title: "Mail", url: "https://mail.example" }]
    },
    {
      key: "Profile 1",
      label: "Profile 1",
      favorites: [
        { kind: "link", title: "Music", url: "https://music.example" }
      ]
    }
  ]
}

const nothing = { spaceIds: [], favoriteProfiles: [], today: false }

describe("importArcSidebar", () => {
  it("creates a Shelf space per chosen Arc space and fills Shelf's favorites", async () => {
    const bookmarks = fakeBookmarks()

    const result = await importArcSidebar(
      sidebar,
      { ...nothing, spaceIds: ["work", "home"], favoriteProfiles: ["default"] },
      bookmarks.api
    )

    expect(result).toEqual({ spaces: 2, added: 4, skipped: 0, failed: 0 })
    expect(bookmarks.bar().children).toMatchObject([
      {
        title: "[💼] Work (Shelf)",
        children: [
          { title: "Docs", children: [{ url: "https://b.example" }] },
          { title: "A", url: "https://a.example" }
        ]
      },
      { title: "Home (Arc) (Shelf)", children: [{ url: "https://c.example" }] }
    ])
    expect(bookmarks.other().children).toMatchObject([
      {
        title: "Favorites (Shelf|Favorites)",
        children: [{ url: "https://mail.example" }]
      }
    ])
  })

  it("only imports the spaces and profiles that were chosen", async () => {
    const bookmarks = fakeBookmarks()

    await importArcSidebar(
      sidebar,
      { ...nothing, spaceIds: ["work"], favoriteProfiles: ["Profile 1"] },
      bookmarks.api
    )

    expect(bookmarks.bar().children?.map((node) => node.title)).toEqual([
      "[💼] Work (Shelf)"
    ])
    expect(bookmarks.other().children?.[0].children).toMatchObject([
      { url: "https://music.example" }
    ])
  })

  it("puts the chosen spaces' open tabs in Arc Today, one folder per space", async () => {
    const bookmarks = fakeBookmarks()

    await importArcSidebar(
      sidebar,
      { ...nothing, spaceIds: ["work", "scratch"], today: true },
      bookmarks.api
    )

    // Scratch has nothing pinned, so it gets no space of its own.
    expect(bookmarks.bar().children).toMatchObject([
      { title: "[💼] Work (Shelf)" },
      {
        title: "Arc Today",
        children: [
          { title: "Work", children: [{ url: "https://open.example" }] },
          { title: "Scratch", children: [{ url: "https://draft.example" }] }
        ]
      }
    ])
  })

  it("puts Arc Today in Home's own folder when Home has one", async () => {
    const bookmarks = fakeBookmarks([
      { id: "30", title: "[🏠] Home (Shelf|Home)", children: [] }
    ])

    await importArcSidebar(
      sidebar,
      { ...nothing, spaceIds: ["scratch"], today: true },
      bookmarks.api
    )

    expect(bookmarks.bar().children).toMatchObject([
      {
        id: "30",
        children: [{ title: "Arc Today", children: [{ title: "Scratch" }] }]
      }
    ])
  })

  it("fills in what already exists instead of duplicating it", async () => {
    const bookmarks = fakeBookmarks([
      {
        id: "10",
        title: "Work (Shelf)",
        children: [
          {
            id: "11",
            title: "Docs",
            children: [{ id: "12", title: "B", url: "https://b.example" }]
          }
        ]
      }
    ])
    const choice = { ...nothing, spaceIds: ["work"], today: true }

    const first = await importArcSidebar(sidebar, choice, bookmarks.api)
    const again = await importArcSidebar(sidebar, choice, bookmarks.api)

    expect(first).toEqual({ spaces: 1, added: 2, skipped: 1, failed: 0 })
    expect(again).toEqual({ spaces: 1, added: 0, skipped: 3, failed: 0 })
    expect(bookmarks.bar().children).toHaveLength(2)
    expect(bookmarks.bar().children?.[0].children).toMatchObject([
      { title: "Docs", children: [{ url: "https://b.example" }] },
      { title: "A", url: "https://a.example" }
    ])
  })

  it("treats an address Chrome stored with a trailing slash as the same link", async () => {
    const bookmarks = fakeBookmarks(
      [],
      [
        {
          id: "20",
          title: "Favorites (Shelf|Favorites)",
          children: [{ id: "21", title: "Mail", url: "https://mail.example/" }]
        }
      ]
    )

    const result = await importArcSidebar(
      sidebar,
      { ...nothing, favoriteProfiles: ["default"] },
      bookmarks.api
    )

    expect(result).toEqual({ spaces: 0, added: 0, skipped: 1, failed: 0 })
  })

  it("adds favorites to the folder an older version created", async () => {
    const bookmarks = fakeBookmarks(
      [],
      [{ id: "20", title: "Favorites (Shelf)", children: [] }]
    )

    await importArcSidebar(
      sidebar,
      { ...nothing, favoriteProfiles: ["default"] },
      bookmarks.api
    )

    expect(bookmarks.other().children).toMatchObject([
      { id: "20", children: [{ url: "https://mail.example" }] }
    ])
  })
})
