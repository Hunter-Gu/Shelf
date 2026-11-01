import { browser } from "wxt/browser"

import type { BookmarkNode } from "./folder"
import {
  GET_HIGHLIGHTS,
  REFRESH_HIGHLIGHTS,
  type PageHighlights
} from "./messages"
import { pageAddress } from "./page-url"
import type { HighlightStore } from "./store"

// Saved passages are the only bookmarks whose address carries a text directive.
function hasPassage(node?: BookmarkNode): boolean {
  if (!node) return false
  if (node.url) return node.url.includes(":~:")
  return !!node.children?.some(hasPassage)
}

function refreshTab(tabId: number) {
  return browser.tabs
    .sendMessage(tabId, { type: REFRESH_HIGHLIGHTS })
    .catch(() => {})
}

export function registerHighlightRestore(store: HighlightStore) {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (
      message?.type !== GET_HIGHLIGHTS ||
      sender.id !== browser.runtime.id ||
      !sender.tab
    )
      return
    const page = sender.url ? pageAddress(sender.url) : null
    if (!page) {
      sendResponse({
        page: null,
        highlights: []
      } satisfies PageHighlights)
      return
    }
    void store
      .forPage(page)
      .then((highlights) =>
        sendResponse({ page, highlights } satisfies PageHighlights)
      )
      .catch((error: unknown) => {
        console.error("Failed to load page highlights", error)
        sendResponse({ page, highlights: [] } satisfies PageHighlights)
      })
    // Chrome 116 needs an explicit open channel for asynchronous responses.
    return true
  })

  let refreshTimer: ReturnType<typeof setTimeout> | undefined
  const refreshTabs = () => {
    clearTimeout(refreshTimer)
    refreshTimer = setTimeout(() => {
      void browser.tabs
        .query({})
        .then((tabs) =>
          Promise.all(
            tabs.flatMap((tab) =>
              tab.id === undefined ? [] : [refreshTab(tab.id)]
            )
          )
        )
        .catch(() => {})
    }, 100)
  }
  // Any change may move the Highlights folder, but only one that involves a
  // passage changes what open pages show.
  const changed = (passage: boolean) => {
    store.invalidate()
    if (passage) refreshTabs()
  }
  const changedById = (id: string) =>
    void browser.bookmarks
      .getSubTree(id)
      .then(([node]) => changed(hasPassage(node as BookmarkNode)))
      .catch(() => changed(true))
  browser.bookmarks.onCreated.addListener((_, node) =>
    changed(hasPassage(node as BookmarkNode))
  )
  browser.bookmarks.onChanged.addListener((id, { url }) =>
    url === undefined ? changedById(id) : changed(url.includes(":~:"))
  )
  browser.bookmarks.onMoved.addListener(changedById)
  browser.bookmarks.onRemoved.addListener((_, { node }) =>
    changed(hasPassage(node as BookmarkNode))
  )
  browser.bookmarks.onImportEnded.addListener(() => changed(true))

  browser.tabs.onUpdated.addListener((tabId, change) => {
    if (change.url) void refreshTab(tabId)
  })
}
