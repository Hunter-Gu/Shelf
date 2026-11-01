import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Browser } from "wxt/browser"

import { collection, input } from "./__tests__/bookmarks-api"
import { registerBookmarkDestinations } from "./destinations-background"
import {
  GET_DESTINATIONS,
  GET_HIGHLIGHTS,
  MOVE_HIGHLIGHT,
  SAVE_HIGHLIGHT
} from "./messages"
import { registerHighlightMutations } from "./mutation-background"
import { registerHighlightRestore } from "./restore-background"

type Listener = (
  message: unknown,
  sender: Browser.runtime.MessageSender,
  reply: (value: unknown) => void
) => unknown
const bus = vi.hoisted(() => ({ listeners: [] as Listener[] }))
vi.mock("wxt/browser", () => {
  const event = () => ({ addListener: () => {} })
  return {
    browser: {
      runtime: {
        id: "shelf-test",
        onMessage: {
          addListener: (listener: Listener) => bus.listeners.push(listener)
        }
      },
      tabs: {
        query: async () => [],
        sendMessage: async () => {},
        onUpdated: event()
      },
      bookmarks: {
        onCreated: event(),
        onChanged: event(),
        onMoved: event(),
        onRemoved: event(),
        onImportEnded: event()
      }
    }
  }
})
vi.mock("~/workspace-model/storage/workspace-storage", () => ({
  currentWorkspaceStorage: { getValue: async () => "work" }
}))

function request(
  message: unknown,
  sender: Browser.runtime.MessageSender = {
    id: "shelf-test",
    url: input.pageUrl,
    tab: {
      id: 1,
      index: 0,
      pinned: false,
      highlighted: false,
      active: true,
      incognito: false,
      selected: true,
      discarded: false,
      autoDiscardable: true,
      groupId: -1,
      windowId: 1,
      frozen: false,
      lastAccessed: 0
    }
  }
) {
  return new Promise<unknown>((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("No background response")),
      1000
    )
    const reply = (result: unknown) => {
      clearTimeout(timeout)
      resolve(result)
    }
    let asynchronous = false
    for (const listener of bus.listeners) {
      if (listener(message, sender, reply) === true) asynchronous = true
    }
    if (!asynchronous) {
      clearTimeout(timeout)
      resolve(undefined)
    }
  })
}

beforeEach(() => {
  bus.listeners = []
})

describe("highlight persistence through background messages", () => {
  it("persists a destination change from the existing-highlight editor without selected text", async () => {
    const state = collection([
      { id: "research", title: "Research", children: [] }
    ])
    await state.store.save(input)
    const [saved] = await state.store.forPage(input.pageUrl)
    registerHighlightMutations(state.store, (operation) => operation())
    expect(
      await request({
        type: MOVE_HIGHLIGHT,
        id: saved.id,
        folderId: "research",
        title: input.pageTitle
      })
    ).toEqual({ ok: true })
    expect(state.find("research")!.children![0].url).toBe(input.pageUrl)
    expect(await state.store.forPage(input.pageUrl)).toMatchObject([
      { id: saved.id }
    ])
    expect(
      state.find("work")!.children!.some((node) => node.url === input.pageUrl)
    ).toBe(false)
    expect(await state.store.destinations(input.pageUrl, "work")).toMatchObject(
      { destinationId: "research" }
    )
  })
  it("loads eligible folders and routes a chosen destination through the real save handler", async () => {
    const state = collection([
      { id: "research", title: "Research", children: [] }
    ])
    registerBookmarkDestinations(state.store)
    registerHighlightRestore(state.store)
    registerHighlightMutations(state.store, (operation) => operation())
    expect(await request({ type: GET_DESTINATIONS })).toMatchObject({
      ok: true,
      destinationId: "work",
      folders: expect.arrayContaining([
        expect.objectContaining({ id: "research", path: "Work / Research" })
      ])
    })
    expect(
      await request({
        type: SAVE_HIGHLIGHT,
        text: input.text,
        title: input.pageTitle,
        folderId: "research",
        color: "pink"
      })
    ).toMatchObject({ ok: true })
    expect(state.find("research")!.children![0].url).toBe(input.pageUrl)
    expect(await state.store.forPage(input.pageUrl)).toHaveLength(1)
  })
  it("routes a palette save through both registered listeners and acknowledges persisted bookmarks", async () => {
    const state = collection()
    registerHighlightRestore(state.store)
    registerHighlightMutations(state.store, (operation) => operation())
    expect(await request({ type: GET_HIGHLIGHTS })).toEqual({
      page: input.pageUrl,
      highlights: []
    })
    expect(
      await request({
        type: SAVE_HIGHLIGHT,
        text: input.text,
        title: input.pageTitle,
        folderId: "work",
        color: "pink"
      })
    ).toMatchObject({
      ok: true,
      highlight: { id: expect.any(String), color: "pink" }
    })
    expect(state.find("work")!.children).toHaveLength(1)
    const highlights = await state.store.forPage(input.pageUrl)
    expect(highlights).toHaveLength(1)
    expect(await request({ type: GET_HIGHLIGHTS })).toEqual({
      page: input.pageUrl,
      highlights
    })
  })

  it("returns a storage failure instead of acknowledging a save", async () => {
    const state = collection()
    state.api.create = async () => {
      throw new Error("Bookmark write failed")
    }
    registerHighlightMutations(state.store, (operation) => operation())
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    try {
      expect(
        await request({
          type: SAVE_HIGHLIGHT,
          text: input.text,
          title: input.pageTitle,
          folderId: "work",
          color: "pink"
        })
      ).toEqual({ ok: false, error: "Bookmark write failed" })
      expect(state.created).toEqual([])
    } finally {
      log.mockRestore()
    }
  })

  it("does not acknowledge a passage that cannot be read back from bookmarks", async () => {
    const state = collection()
    const create = state.api.create
    state.api.create = async (details) =>
      details.url?.includes(":~:text=")
        ? { ...details, id: "unpersisted" }
        : create(details)
    registerHighlightMutations(state.store, (operation) => operation())
    const log = vi.spyOn(console, "error").mockImplementation(() => {})
    try {
      expect(
        await request({
          type: SAVE_HIGHLIGHT,
          text: input.text,
          title: input.pageTitle,
          folderId: "work",
          color: "pink"
        })
      ).toEqual({
        ok: false,
        error: "Chrome did not return the saved highlight. Try again."
      })
    } finally {
      log.mockRestore()
    }
  })
})
