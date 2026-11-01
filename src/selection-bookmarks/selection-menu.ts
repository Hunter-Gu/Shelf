import { browser } from "wxt/browser"

import { REFRESH_HIGHLIGHTS } from "./messages"
import type { RunMutation } from "./mutation-background"
import { pageAddress } from "./page-url"
import { selectionPreferencesStorage } from "./preferences-storage"
import {
  registerSelectionMenuTree,
  SELECTION_DESTINATION_PREFIX
} from "./selection-menu-tree"
import type { HighlightStore } from "./store"

async function showResult(
  tabId: number,
  success: boolean,
  failureTitle = "Could not save selection. Try again."
) {
  await Promise.all([
    browser.action.setBadgeText({ tabId, text: success ? "✓" : "!" }),
    browser.action.setBadgeBackgroundColor({
      tabId,
      color: success ? "#15803d" : "#b91c1c"
    }),
    browser.action.setTitle({
      tabId,
      title: success ? "Saved selection to Shelf" : failureTitle
    })
  ])
  setTimeout(() => {
    void Promise.all([
      browser.action.setBadgeText({ tabId, text: "" }),
      browser.action.setTitle({ tabId, title: "Open Shelf" })
    ]).catch(() => {})
  }, 3000)
}

export function registerSelectionMenu(store: HighlightStore, run: RunMutation) {
  registerSelectionMenuTree()

  browser.contextMenus.onClicked.addListener((info, tab) => {
    const folderId =
      typeof info.menuItemId === "string" &&
      info.menuItemId.startsWith(SELECTION_DESTINATION_PREFIX)
        ? info.menuItemId.slice(SELECTION_DESTINATION_PREFIX.length)
        : undefined
    if (!folderId || !info.selectionText) return
    const pageUrl = info.frameUrl ?? info.pageUrl
    if (!pageUrl || !pageAddress(pageUrl)) return
    const text = info.selectionText
    void run(async () => {
      try {
        const preferences = await selectionPreferencesStorage.getValue()
        if (!preferences.enabled) return
        const saved = await store.save({
          text,
          pageUrl,
          pageTitle: tab?.title ?? "",
          folderId,
          color: preferences.defaultColor
        })
        if (saved && tab?.id !== undefined) {
          await browser.tabs
            .sendMessage(
              tab.id,
              { type: REFRESH_HIGHLIGHTS },
              { frameId: info.frameId ?? 0 }
            )
            .catch(() => {})
          await showResult(tab.id, true).catch(() => {})
        }
      } catch (error) {
        console.error("Failed to save selected text", error)
        if (tab?.id !== undefined)
          await showResult(tab.id, false).catch(() => {})
      }
    })
  })
}
