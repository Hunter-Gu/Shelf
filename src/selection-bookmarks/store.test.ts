import { describe, expect, it } from "vitest"

import { passageUrl } from "~/bookmark-model/passage-url"

import { collection, input } from "./__tests__/bookmarks-api"
import { HIGHLIGHTS_FOLDER_TITLE } from "./folder"

describe("HighlightStore", () => {
  it("saves a clean page URL and a full passage URL when the source has lost its text directive", async () => {
    const full = passageUrl(input.text, input.pageUrl)
    const visibleUrl = full.split(":~:")[0]
    const state = collection()
    await state.store.save({ ...input, pageUrl: visibleUrl })
    expect(state.find("work")!.children![0].url).toBe(input.pageUrl)
    expect(
      state.find("other")!.children![0].children![0].children![0].url
    ).toBe(full)
    expect(await state.store.forPage(input.pageUrl)).toEqual([
      expect.objectContaining({
        color: "yellow",
        directives: [encodeURIComponent(input.text)]
      })
    ])
  })

  it("recognizes a stripped id belonging to an earlier passage when saving a different one", async () => {
    const state = collection()
    await state.store.save(input)
    state.find("work")!.children = []
    const earlierUrl = passageUrl(input.text, input.pageUrl).split(":~:")[0]
    await state.store.save({
      ...input,
      text: "another selection",
      pageUrl: earlierUrl
    })
    expect(state.find("work")!.children![0].url).toBe(input.pageUrl)
    expect(await state.store.forPage(input.pageUrl)).toHaveLength(2)
  })

  it("saves the page in the selected space and the passage in a hidden folder", async () => {
    const state = collection()
    expect(await state.store.save(input)).toBe(true)
    expect(state.created).toEqual([
      expect.objectContaining({
        parentId: "work",
        title: input.pageTitle,
        url: input.pageUrl
      }),
      expect.objectContaining({
        parentId: "other",
        title: HIGHLIGHTS_FOLDER_TITLE
      }),
      expect.objectContaining({ parentId: "created-1", title: "Yellow" }),
      expect.objectContaining({
        parentId: "created-2",
        title: input.text,
        url: passageUrl(input.text, input.pageUrl)
      })
    ])
    expect(await state.store.forPage(input.pageUrl)).toEqual([
      expect.objectContaining({
        color: "yellow",
        directives: [encodeURIComponent(input.text)]
      })
    ])
  })

  it("keeps an existing page where it is when saved to the same folder", async () => {
    const original = {
      id: "original",
      title: "My title",
      parentId: "nested",
      url: input.pageUrl
    }
    const state = collection([
      { id: "nested", title: "Reading", children: [original] }
    ])
    await state.store.save({ ...input, folderId: "nested" })
    expect(state.find("original")).toEqual(original)
    expect(
      state.created.filter((node) => node.url === input.pageUrl)
    ).toHaveLength(0)
  })

  it("shares the page and hidden folder across passages and deduplicates renamed passages", async () => {
    const state = collection()
    await state.store.save(input)
    const folder = state.find("other")!.children![0].children![0]
    folder.children![0].title = "User renamed this"
    await state.store.save(input)
    await state.store.save({ ...input, text: "a different passage" })
    expect(state.created).toHaveLength(5)
    expect(state.find("work")!.children).toHaveLength(1)
    expect(folder.children).toHaveLength(2)
    expect(await state.store.forPage(input.pageUrl)).toHaveLength(2)
  })

  it("does not treat pinned copies or earlier text-fragment bookmarks as the ordinary page", async () => {
    const state = collection([
      {
        id: "old-passage",
        title: input.text,
        url: passageUrl(input.text, input.pageUrl)
      }
    ])
    state.find("other")!.children!.push({
      id: "pins",
      title: "Pins (Shelf|Pins)",
      children: [{ id: "pin", title: "Pinned page", url: input.pageUrl }]
    })
    state.find("other")!.children!.push({
      id: "legacy-favorites",
      title: "Favorites (Shelf)",
      children: [{ id: "favorite", title: "Favorite page", url: input.pageUrl }]
    })
    await state.store.save(input)
    expect(state.created[0]).toMatchObject({
      parentId: "work",
      url: input.pageUrl,
      title: input.pageTitle
    })
  })

  it("restores only this page's hidden passages, including ordinary URL and anchor visits", async () => {
    const state = collection([
      {
        id: "ordinary-text-link",
        title: "Not a stored highlight",
        url: passageUrl("ordinary", input.pageUrl)
      }
    ])
    await state.store.save(input)
    expect(await state.store.forPage(`${input.pageUrl}#section`)).toEqual([
      expect.objectContaining({
        color: "yellow",
        directives: [encodeURIComponent(input.text)]
      })
    ])
    expect(
      await state.store.forPage(passageUrl(input.text, input.pageUrl))
    ).toHaveLength(1)
    expect(
      await state.store.forPage("https://example.com/article?version=2")
    ).toEqual([])
    expect(
      await state.store.forPage("https://elsewhere.com/article?version=1")
    ).toEqual([])
  })

  it("reloads bookmark changes without deleting the ordinary page", async () => {
    const state = collection()
    await state.store.save(input)
    await state.store.forPage(input.pageUrl)
    const reads = state.treeReads()
    await state.store.forPage(input.pageUrl)
    expect(state.treeReads()).toBe(reads)
    state.find("other")!.children![0].children = []
    state.store.invalidate()
    expect(await state.store.forPage(input.pageUrl)).toEqual([])
    expect(state.find("work")!.children![0].url).toBe(input.pageUrl)
    expect(state.treeReads()).toBe(reads + 1)
  })

  it("recreates a deleted Highlights folder", async () => {
    const state = collection()
    await state.store.save(input)
    state.find("other")!.children = []
    await state.store.save({ ...input, pageUrl: "https://example.com/new" })
    expect(state.find("other")!.children![0].title).toBe(
      HIGHLIGHTS_FOLDER_TITLE
    )
  })

  it("refuses a folder that no longer exists", async () => {
    const state = collection()
    await expect(
      state.store.save({ ...input, folderId: "deleted" })
    ).rejects.toThrow("no longer available")
    expect(state.created).toEqual([])
  })

  it("rejects invalid saves without creating bookmark data", async () => {
    const state = collection()
    expect(await state.store.save({ ...input, text: "  " })).toBe(false)
    expect(
      await state.store.save({ ...input, pageUrl: "chrome://settings" })
    ).toBe(false)
    expect(state.created).toEqual([])
    expect(state.treeReads()).toBe(0)
  })
})
