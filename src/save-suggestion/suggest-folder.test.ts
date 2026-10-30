import { describe, expect, it } from "vitest"

import type { Bookmark, Folder, RootTree } from "~/bookmark-model"

import { siteOf, suggestFolder } from "./suggest-folder"

const link = (id: string, parentId: string, url: string): Bookmark => ({
  id,
  parentId,
  index: 0,
  title: id,
  url
})

const folder = (
  id: string,
  parentId: string,
  title: string,
  children: Array<Folder | Bookmark> = []
): Folder => ({ id, parentId, index: 0, title, children })

function tree(
  bar: Array<Folder | Bookmark>,
  other: Array<Folder | Bookmark> = []
) {
  return {
    id: "0",
    parentId: "",
    index: 0,
    title: "",
    children: [
      folder("1", "0", "Bookmarks Bar", bar),
      folder("2", "0", "Other Bookmarks", other)
    ]
  } as RootTree
}

const spaces = [
  { id: "1", title: "Home", isHome: true },
  { id: "work", title: "Work", isHome: false }
]
const options = { excludeIds: ["pins"], spaces, currentSpaceId: "1" }
const saved = {
  id: "new",
  url: "https://www.allrecipes.com/miso",
  parentId: "1"
}

describe("siteOf", () => {
  it("ignores www and case, and skips non-web pages", () => {
    expect(siteOf("https://WWW.Example.com/a")).toBe("example.com")
    expect(siteOf("chrome://extensions")).toBeNull()
    expect(siteOf("not a url")).toBeNull()
  })
})

describe("suggestFolder", () => {
  it("picks the folder with the most bookmarks from the same site", () => {
    const suggestion = suggestFolder(
      tree([
        folder("recipes", "1", "Recipes", [
          link("a", "recipes", "https://allrecipes.com/ramen"),
          link("b", "recipes", "https://www.allrecipes.com/udon")
        ]),
        folder("misc", "1", "Misc", [
          link("c", "misc", "https://allrecipes.com/cake")
        ]),
        link("new", "1", saved.url)
      ]),
      saved,
      options
    )

    expect(suggestion).toEqual({
      folderId: "recipes",
      label: "Recipes",
      host: "allrecipes.com"
    })
  })

  it("names the space when the folder is in another one", () => {
    const suggestion = suggestFolder(
      tree([
        folder("work", "1", "Work (Shelf)", [
          folder("cook", "work", "Cooking", [
            link("a", "cook", "https://allrecipes.com/ramen")
          ])
        ])
      ]),
      saved,
      options
    )

    expect(suggestion?.label).toBe("Work › Cooking")
  })

  it("names just the space when its own folder holds them", () => {
    const suggestion = suggestFolder(
      tree([
        folder("work", "1", "Work (Shelf)", [
          link("a", "work", "https://allrecipes.com/ramen")
        ])
      ]),
      saved,
      options
    )

    expect(suggestion).toMatchObject({ folderId: "work", label: "Work" })
  })

  it("ignores pins, the root folders and where it was just saved", () => {
    expect(
      suggestFolder(
        tree(
          [link("a", "1", "https://allrecipes.com/ramen")],
          [
            folder("pins", "2", "Pins (Shelf|Pins)", [
              link("b", "pins", "https://allrecipes.com/udon")
            ])
          ]
        ),
        saved,
        options
      )
    ).toBeNull()
    expect(
      suggestFolder(
        tree([
          folder("recipes", "1", "Recipes", [
            link("a", "recipes", "https://allrecipes.com/ramen")
          ])
        ]),
        { ...saved, parentId: "recipes" },
        options
      )
    ).toBeNull()
  })

  it("suggests nothing when no other bookmark shares the site", () => {
    expect(
      suggestFolder(
        tree([
          folder("r", "1", "Reading", [link("a", "r", "https://example.com/")])
        ]),
        saved,
        options
      )
    ).toBeNull()
  })
})
