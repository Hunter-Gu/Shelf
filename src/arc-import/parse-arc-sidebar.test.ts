import { describe, expect, it } from "vitest"

import { countLinks, parseArcSidebar } from "./parse-arc-sidebar"

function tab(id: string, parentID: string, url: string, title?: string) {
  return {
    id,
    parentID,
    title: title ?? null,
    childrenIds: [],
    data: { tab: { savedURL: url, savedTitle: `Saved ${id}` } }
  }
}

function folder(
  id: string,
  parentID: string,
  title: string,
  childrenIds: string[]
) {
  return { id, parentID, title, childrenIds, data: { list: {} } }
}

function container(id: string, childrenIds: string[], containerType: object) {
  return {
    id,
    parentID: null,
    title: null,
    childrenIds,
    data: { itemContainer: { containerType } }
  }
}

// Arc keeps spaces and items as [id, object, id, object, ...].
function pairs(objects: { id: string }[]) {
  return objects.flatMap((object) => [object.id, object])
}

function sidebarFile({
  spaces,
  items,
  topApps
}: {
  spaces: object[]
  items: { id: string }[]
  topApps: string[]
}) {
  return {
    sidebar: {
      containers: [
        { global: {} },
        {
          spaces: pairs(spaces as { id: string }[]),
          items: pairs(items),
          topAppsContainerIDs: topApps.flatMap((id) => [{ default: true }, id])
        }
      ]
    }
  }
}

const work = {
  id: "space-work",
  title: "Work",
  customInfo: { iconType: { emoji: 128188, emoji_v2: "💼" } },
  newContainerIDs: [
    { pinned: {} },
    "work-pinned",
    { unpinned: {} },
    "work-open"
  ]
}

const items = [
  container("work-pinned", ["docs", "tab-a", "split"], {
    spaceItems: { _0: "space-work" }
  }),
  folder("docs", "work-pinned", "Docs", ["tab-b", "empty"]),
  tab("tab-a", "work-pinned", "https://a.example", "Renamed A"),
  tab("tab-b", "docs", "https://b.example"),
  folder("empty", "docs", "Empty", []),
  {
    id: "split",
    parentID: "work-pinned",
    title: null,
    childrenIds: ["tab-c"],
    data: { splitView: {} }
  },
  tab("tab-c", "split", "https://c.example"),
  container("work-open", ["tab-open"], { spaceItems: { _0: "space-work" } }),
  tab("tab-open", "work-open", "https://open.example"),
  container("top", ["fav-1", "fav-2"], { topApps: { _0: { default: true } } }),
  tab("fav-1", "top", "https://mail.example"),
  tab("fav-2", "top", "https://mail.example")
]

describe("parseArcSidebar", () => {
  it("brings over each space's pinned links in Arc's order and its open tabs", () => {
    const { spaces } = parseArcSidebar(
      sidebarFile({ spaces: [work], items, topApps: ["top"] })
    )

    expect(spaces).toEqual([
      {
        id: "space-work",
        title: "Work",
        emoji: "💼",
        profile: "default",
        items: [
          {
            kind: "folder",
            title: "Docs",
            children: [
              { kind: "link", title: "Saved tab-b", url: "https://b.example" }
            ]
          },
          { kind: "link", title: "Renamed A", url: "https://a.example" },
          { kind: "link", title: "Saved tab-c", url: "https://c.example" }
        ],
        today: [
          { kind: "link", title: "Saved tab-open", url: "https://open.example" }
        ]
      }
    ])
  })

  it("leaves out empty folders and spaces with nothing pinned or open", () => {
    const idle = {
      id: "space-idle",
      title: "",
      customInfo: {},
      newContainerIDs: [{ pinned: {} }, "idle-pinned"]
    }
    const { spaces } = parseArcSidebar(
      sidebarFile({
        spaces: [idle, work],
        items: [...items, container("idle-pinned", [], {})],
        topApps: []
      })
    )

    expect(spaces.map((space) => space.title)).toEqual(["Work"])
    expect(countLinks(spaces[0].items)).toBe(3)
  })

  it("keeps each profile's spaces and favorites apart", () => {
    const personal = {
      id: "space-personal",
      title: "Personal",
      profile: { custom: { _0: { directoryBasename: "Profile 1" } } },
      newContainerIDs: [{ pinned: {} }, "personal-pinned"]
    }
    const file = sidebarFile({
      spaces: [work, personal],
      items: [
        ...items,
        container("personal-pinned", ["tab-p"], {}),
        tab("tab-p", "personal-pinned", "https://p.example"),
        container("top-2", ["fav-3"], {}),
        tab("fav-3", "top-2", "https://music.example")
      ],
      topApps: ["top"]
    })
    file.sidebar.containers[1]!.topAppsContainerIDs!.push(
      { custom: { _0: { directoryBasename: "Profile 1" } } } as never,
      "top-2" as never
    )

    const { profiles, spaces } = parseArcSidebar(file)

    expect(spaces.map((space) => [space.title, space.profile])).toEqual([
      ["Work", "default"],
      ["Personal", "Profile 1"]
    ])
    expect(profiles).toEqual([
      {
        key: "default",
        label: "Main profile",
        favorites: [
          { kind: "link", title: "Saved fav-1", url: "https://mail.example" }
        ]
      },
      {
        key: "Profile 1",
        label: "Profile 1",
        favorites: [
          { kind: "link", title: "Saved fav-3", url: "https://music.example" }
        ]
      }
    ])
  })

  it("rejects a file that isn't Arc's sidebar", () => {
    expect(() => parseArcSidebar({ roots: {} })).toThrow(/StorableSidebar/)
    expect(() => parseArcSidebar(null)).toThrow(/StorableSidebar/)
  })
})
