import { describe, expect, it } from "vitest"

import { passageUrl } from "~/bookmark-model/passage-url"

import { collection, input } from "./__tests__/bookmarks-api"
import { COLOR_LABELS, HIGHLIGHT_COLORS } from "./colors"
import { HIGHLIGHTS_FOLDER_TITLE } from "./folder"

describe("highlight colors and removal", () => {
  it("persists every palette color in a bookmark folder without modifying passage URLs", async () => {
    for (const color of HIGHLIGHT_COLORS) {
      const state = collection()
      await state.store.save({ ...input, color })
      const [saved] = await state.store.forPage(input.pageUrl)
      const bookmark = state.find(saved.id)!
      expect(saved.color).toBe(color)
      expect(state.find(bookmark.parentId!)?.title).toBe(COLOR_LABELS[color])
      expect(bookmark.url).toBe(passageUrl(input.text, input.pageUrl))
      expect(saved.fragment).toBe(new URL(bookmark.url!).hash.split(":~:")[0])
      expect(state.find("work")!.children).toHaveLength(1)
    }
  })

  it("changes color in place and does not duplicate a selection saved again", async () => {
    const state = collection()
    await state.store.save({ ...input, color: "pink" })
    const [first] = await state.store.forPage(input.pageUrl)
    const original = structuredClone(state.find(first.id))
    await state.store.save({ ...input, color: "green" })
    expect(await state.store.forPage(input.pageUrl)).toEqual([
      { ...first, color: "green" }
    ])
    expect(state.find(first.id)).toMatchObject({
      id: original!.id,
      title: original!.title,
      url: original!.url
    })
    const created = state.created.length
    await state.store.recolor(input.pageUrl, first.id, "green")
    expect(state.created).toHaveLength(created)
  })

  it("removes only the selected passage and preserves other passages and the ordinary page", async () => {
    const state = collection()
    await state.store.save({ ...input, color: "pink" })
    await state.store.save({
      ...input,
      text: "keep this passage",
      color: "blue"
    })
    const before = await state.store.forPage(input.pageUrl)
    const pageBefore = structuredClone(state.find("work")!.children)
    await state.store.remove(input.pageUrl, before[0].id)
    expect(state.find(before[0].id)).toBeUndefined()
    expect(await state.store.forPage(input.pageUrl)).toEqual([before[1]])
    expect(state.find("work")!.children).toEqual(pageBefore)
  })

  it("rejects mutations of ordinary bookmarks and highlights belonging to another page", async () => {
    const state = collection()
    await state.store.save(input)
    const [saved] = await state.store.forPage(input.pageUrl)
    await expect(
      state.store.remove(input.pageUrl, "created-0")
    ).rejects.toThrow()
    await expect(
      state.store.remove("https://other.example/article", saved.id)
    ).rejects.toThrow()
    await expect(
      state.store.recolor("https://other.example/article", saved.id, "blue")
    ).rejects.toThrow()
    expect((await state.store.forPage(input.pageUrl))[0]).toEqual(saved)
    expect(state.find("work")!.children).toHaveLength(1)
  })

  it("manages duplicate synced copies as a single highlight", async () => {
    const state = collection()
    await state.store.save(input)
    const [saved] = await state.store.forPage(input.pageUrl)
    const bookmark = state.find(saved.id)!
    state.find("other")!.children!.push({
      id: "synced-root",
      title: HIGHLIGHTS_FOLDER_TITLE,
      children: [{ ...bookmark, id: "duplicate", parentId: "synced-root" }]
    })
    state.store.invalidate()
    expect(await state.store.forPage(input.pageUrl)).toHaveLength(1)
    await state.store.recolor(input.pageUrl, saved.id, "green")
    expect(state.find("duplicate")?.parentId).toBe(
      state.find(saved.id)?.parentId
    )
    await state.store.remove(input.pageUrl, saved.id)
    expect(state.find("duplicate")).toBeUndefined()
    expect(await state.store.forPage(input.pageUrl)).toEqual([])
  })
})
