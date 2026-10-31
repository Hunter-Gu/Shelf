import { browser } from "wxt/browser"
import { defineContentScript } from "wxt/utils/define-content-script"

import {
  GET_HIGHLIGHTS,
  REFRESH_HIGHLIGHTS,
  type PageHighlights,
  type SavedHighlight
} from "~/selection-bookmarks/messages"
import { pageAddress } from "~/selection-bookmarks/page-url"
import {
  clearHighlights,
  paintHighlights,
  type PaintedHighlight
} from "~/selection-bookmarks/paint-highlights"
import { selectionPreferencesStorage } from "~/selection-bookmarks/preferences-storage"
import { installHighlightToolbar } from "~/selection-bookmarks/toolbar-controller"

import "./style.css"

export default defineContentScript({
  // Top frames only: embedded frames (ads, players) would each load the
  // panel, and text inside them can still be saved from the right-click menu.
  matches: ["http://*/*", "https://*/*"],
  main(ctx) {
    let highlights: SavedHighlight[] = []
    let painted: PaintedHighlight[] = []
    let currentUrl = location.href
    let generation = 0
    let stopped = false
    let paintTimer: ReturnType<typeof setTimeout> | undefined

    const paintNow = () => {
      clearTimeout(paintTimer)
      paintTimer = undefined
      if (!stopped) painted = paintHighlights(highlights)
    }
    // Pages that keep changing (feeds, chats) are searched again at most
    // once a second.
    const paintSoon = () => {
      paintTimer ??= setTimeout(paintNow, 1000)
    }

    const refresh = async () => {
      const request = ++generation
      const navigated = pageAddress(currentUrl) !== pageAddress(location.href)
      currentUrl = location.href
      if (navigated) {
        toolbar.close()
        highlights = []
        painted = []
        clearHighlights()
      }
      try {
        const result: PageHighlights = await browser.runtime.sendMessage({
          type: GET_HIGHLIGHTS
        })
        if (
          stopped ||
          request !== generation ||
          result.page !== pageAddress(location.href)
        )
          return
        highlights = result.highlights
        paintNow()
      } catch {
        // The extension can be reloaded while an existing tab is still open.
      }
    }

    const observer = new MutationObserver(() => {
      if (location.href !== currentUrl) void refresh()
      else if (highlights.length) paintSoon()
    })
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      characterData: true
    })

    const onMessage = (message: { type?: string }) => {
      if (message?.type === REFRESH_HIGHLIGHTS) void refresh()
    }
    browser.runtime.onMessage.addListener(onMessage)
    const toolbar = installHighlightToolbar(ctx, () => painted, refresh)
    void selectionPreferencesStorage.getValue().then(toolbar.setPreferences)
    const unwatchPreferences = selectionPreferencesStorage.watch(
      toolbar.setPreferences
    )
    ctx.addEventListener(window, "popstate", () => void refresh())
    ctx.addEventListener(window, "hashchange", () => void refresh())
    ctx.addEventListener(window, "pageshow", () => void refresh())
    ctx.onInvalidated(() => {
      stopped = true
      unwatchPreferences()
      observer.disconnect()
      clearTimeout(paintTimer)
      browser.runtime.onMessage.removeListener(onMessage)
      clearHighlights()
    })
    void refresh()
  }
})
