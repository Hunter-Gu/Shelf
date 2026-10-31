import { describe, expect, it } from "vitest"

import { collection, input } from "./__tests__/bookmarks-api"
import { bookmarkDestinations, pageDestinations } from "./destinations"

describe("bookmark destinations", () => {
  it("includes spaces and nested ordinary folders without exposing special or managed subtrees", () => {
    const state = collection([
      {
        id: "research",
        title: "Research",
        children: [{ id: "papers", title: "Papers" }]
      },
      {
        id: "highlights",
        title: "Highlights (Shelf|Highlights)",
        children: [{ id: "yellow", title: "Yellow" }]
      },
      { id: "favorites", title: "Favorites (Shelf|Favorites)" },
      { id: "pins", title: "Pins (Shelf|Pins)" },
      {
        id: "managed",
        title: "Managed",
        unmodifiable: "managed",
        children: [{ id: "policy", title: "Policy" }]
      },
      { id: "link", title: "Page", url: input.pageUrl }
    ])
    const destinations = bookmarkDestinations(state.tree)
    expect(destinations.map((folder) => folder.id)).toEqual([
      "bar",
      "work",
      "research",
      "papers"
    ])
    expect(destinations[0]).toMatchObject({
      id: "bar",
      title: "Home",
      path: "Home",
      kind: "space"
    })
    expect(destinations.find((folder) => folder.id === "work")).toMatchObject({
      path: "Work",
      kind: "space",
      parentId: undefined
    })
    expect(destinations.find((folder) => folder.id === "papers")).toMatchObject(
      { path: "Work / Research / Papers", kind: "folder", parentId: "research" }
    )
  })

  it("groups loose folders from Chrome's roots under Home instead of exposing native roots", () => {
    const state = collection()
    state.tree.children![0].children!.push({ id: "loose", title: "Reading" })
    state.tree.children![1].children!.push({ id: "archive", title: "Archive" })
    const destinations = bookmarkDestinations(state.tree)
    expect(destinations.find((folder) => folder.id === "loose")).toMatchObject({
      path: "Home / Reading",
      parentId: "bar"
    })
    expect(
      destinations.find((folder) => folder.id === "archive")
    ).toMatchObject({ path: "Home / Archive", parentId: "bar" })
    expect(
      destinations.some((folder) =>
        ["Bookmarks Bar", "Other Bookmarks"].includes(folder.title)
      )
    ).toBe(false)
    expect(destinations.some((folder) => folder.id === "other")).toBe(false)
  })

  it("uses Home's own name and folder while including loose folders in its tree", () => {
    const state = collection([
      {
        id: "home",
        title: "Personal (Shelf|Home)",
        children: [{ id: "inbox", title: "Inbox" }]
      }
    ])
    state.tree.children![1].children!.push({ id: "archive", title: "Archive" })
    const destinations = bookmarkDestinations(state.tree)
    expect(destinations[0]).toMatchObject({
      id: "home",
      title: "Personal",
      kind: "space"
    })
    expect(
      destinations.find((folder) => folder.id === "archive")
    ).toMatchObject({ path: "Personal / Archive", parentId: "home" })
    expect(destinations.find((folder) => folder.id === "inbox")).toMatchObject({
      path: "Personal / Inbox",
      parentId: "home"
    })
    expect(
      destinations.some(
        (folder) => folder.id === "bar" || folder.id === "other"
      )
    ).toBe(false)
    expect(
      pageDestinations(state.tree, input.pageUrl, "deleted-space").destinationId
    ).toBe("home")
  })

  it("defaults to the original page's existing folder, otherwise the active space", () => {
    const state = collection([
      {
        id: "research",
        title: "Research",
        children: [
          {
            id: "saved",
            title: "Page",
            parentId: "research",
            url: input.pageUrl + "#section"
          }
        ]
      }
    ])
    expect(
      pageDestinations(state.tree, input.pageUrl, "work").destinationId
    ).toBe("research")
    expect(
      pageDestinations(state.tree, "https://example.com/new", "work")
        .destinationId
    ).toBe("work")
    expect(
      pageDestinations(state.tree, "https://example.com/new", "deleted-space")
        .destinationId
    ).toBe("bar")
  })
})
