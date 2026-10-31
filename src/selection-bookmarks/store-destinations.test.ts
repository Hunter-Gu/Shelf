import { describe, expect, it } from "vitest"

import { passageUrl } from "~/bookmark-model/passage-url"

import { collection, input } from "./__tests__/bookmarks-api"
import { HIGHLIGHTS_FOLDER_TITLE } from "./folder"

describe("saving a page to an explicit folder", () => {
  it("moves an existing highlight's page without touching the passage", async () => {
    const state = collection([
      { id: "research", title: "Research", children: [] }
    ])
    await state.store.save(input)
    const [saved] = await state.store.forPage(input.pageUrl)
    const passage = structuredClone(state.find(saved.id))
    const page = state
      .find("work")!
      .children!.find((node) => node.url === input.pageUrl)!
    await state.store.move(input.pageUrl, saved.id, {
      folderId: "research",
      pageTitle: "Current page title"
    })
    expect(state.find("research")!.children).toEqual([
      expect.objectContaining({
        parentId: "research",
        id: page.id,
        title: input.pageTitle,
        url: input.pageUrl
      })
    ])
    expect(state.find(saved.id)).toEqual(passage)
    expect(
      state.find("work")!.children!.filter((node) => node.url === input.pageUrl)
    ).toHaveLength(0)
    await state.store.move(input.pageUrl, saved.id, {
      folderId: "research",
      pageTitle: "Current page title"
    })
    expect(state.find("research")!.children).toHaveLength(1)
    expect(state.find(saved.id)!.url).toBe(passage!.url)
  })

  it("recreates a missing page bookmark during editing using the stored passage without live selected text", async () => {
    const state = collection([
      { id: "research", title: "Research", children: [] }
    ])
    await state.store.save(input)
    const [saved] = await state.store.forPage(input.pageUrl)
    const page = state
      .find("work")!
      .children!.find((node) => node.url === input.pageUrl)!
    await state.api.remove(page.id)
    const visibleUrl = passageUrl(input.text, input.pageUrl).split(":~:")[0]
    await state.store.move(visibleUrl, saved.id, {
      folderId: "research",
      pageTitle: input.pageTitle
    })
    expect(state.find("research")!.children).toEqual([
      expect.objectContaining({ title: input.pageTitle, url: input.pageUrl })
    ])
    expect((await state.store.forPage(input.pageUrl))[0].id).toBe(saved.id)
  })

  it("rejects a stale destination before changing the page", async () => {
    const state = collection([{ id: "research", title: "Research" }])
    await state.store.save(input)
    const [saved] = await state.store.forPage(input.pageUrl)
    const created = state.created.length
    await state.api.remove("research")
    await expect(
      state.store.move(input.pageUrl, saved.id, {
        folderId: "research",
        pageTitle: input.pageTitle
      })
    ).rejects.toThrow("Choose another save location")
    expect(state.created).toHaveLength(created)
    expect(await state.store.forPage(input.pageUrl)).toEqual([saved])
  })
  it("places the original page in the chosen nested folder and keeps passages hidden", async () => {
    const state = collection([
      { id: "research", title: "Research", children: [] }
    ])
    await state.store.save({ ...input, folderId: "research" })
    expect(state.find("research")!.children).toEqual([
      expect.objectContaining({ url: input.pageUrl, parentId: "research" })
    ])
    expect(state.find("other")!.children![0].title).toBe(
      HIGHLIGHTS_FOLDER_TITLE
    )
    expect(await state.store.forPage(input.pageUrl)).toHaveLength(1)
  })

  it("moves the page bookmark when the same passage is saved to a different destination", async () => {
    const state = collection([
      { id: "research", title: "Research", children: [] }
    ])
    await state.store.save(input)
    const original = state
      .find("work")!
      .children!.find((node) => node.url === input.pageUrl)!
    const [saved] = await state.store.forPage(input.pageUrl)
    await state.store.save({ ...input, folderId: "research" })
    await state.store.save({ ...input, folderId: "research" })
    expect(state.find(original.id)).toMatchObject({
      parentId: "research",
      url: input.pageUrl
    })
    expect(state.find("research")!.children).toHaveLength(1)
    expect(state.find("work")!.children!.some((node) => node.url)).toBe(false)
    expect(state.created.filter((node) => node.url)).toHaveLength(2)
    expect(await state.store.forPage(input.pageUrl)).toMatchObject([
      { id: saved.id }
    ])
  })

  it("reuses a page bookmark already at the destination and preserves other manually saved copies", async () => {
    const state = collection([
      {
        id: "research",
        title: "Research",
        children: [
          {
            id: "there",
            parentId: "research",
            title: "My title",
            url: input.pageUrl
          }
        ]
      },
      {
        id: "copy",
        parentId: "work",
        title: "Another copy",
        url: input.pageUrl
      }
    ])
    await state.store.save({ ...input, folderId: "research" })
    const [saved] = await state.store.forPage(input.pageUrl)
    await state.store.move(input.pageUrl, saved.id, {
      folderId: "research",
      pageTitle: input.pageTitle
    })
    expect(state.find("there")).toMatchObject({
      parentId: "research",
      title: "My title"
    })
    expect(state.find("copy")).toMatchObject({
      parentId: "work",
      title: "Another copy"
    })
    expect(state.find("research")!.children).toHaveLength(1)
    expect(
      state.created.filter((node) => node.url === input.pageUrl)
    ).toHaveLength(0)
  })

  it("keeps the original location and highlight unchanged when Chrome rejects a move", async () => {
    const state = collection([
      { id: "research", title: "Research", children: [] }
    ])
    await state.store.save(input)
    const [saved] = await state.store.forPage(input.pageUrl)
    state.api.move = async () => {
      throw new Error("Move failed")
    }
    await expect(
      state.store.move(input.pageUrl, saved.id, {
        folderId: "research",
        pageTitle: input.pageTitle
      })
    ).rejects.toThrow("Move failed")
    expect(state.find("research")!.children).toHaveLength(0)
    expect(
      state.find("work")!.children!.some((node) => node.url === input.pageUrl)
    ).toBe(true)
    expect(await state.store.forPage(input.pageUrl)).toEqual([saved])
  })

  it("rejects a destination deleted since the picker loaded without creating any bookmarks", async () => {
    const state = collection([{ id: "research", title: "Research" }])
    expect(
      (await state.store.destinations(input.pageUrl, "work")).folders.some(
        (folder) => folder.id === "research"
      )
    ).toBe(true)
    await state.api.remove("research")
    await expect(
      state.store.save({ ...input, folderId: "research" })
    ).rejects.toThrow("Choose another save location")
    expect(state.created).toEqual([])
  })

  it("rejects special, managed, bookmark, and root identifiers before any write", async () => {
    const state = collection([
      {
        id: "hidden",
        title: HIGHLIGHTS_FOLDER_TITLE,
        children: [{ id: "inside", title: "Inside" }]
      },
      { id: "managed", title: "Managed", unmodifiable: "managed" },
      { id: "link", title: "Link", url: "https://example.com/" }
    ])
    for (const folderId of [
      "root",
      "other",
      "hidden",
      "inside",
      "managed",
      "link",
      ""
    ]) {
      await expect(state.store.save({ ...input, folderId })).rejects.toThrow(
        "Choose another save location"
      )
    }
    expect(state.created).toEqual([])
  })
})
