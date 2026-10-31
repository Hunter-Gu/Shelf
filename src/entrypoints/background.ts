import { browser } from "wxt/browser"
import { defineBackground } from "wxt/utils/define-background"

import { FOCUS_SEARCH_MESSAGE, focusSearchOnOpenStorage } from "~/focus-search"
import { registerSelectionBookmarks } from "~/selection-bookmarks/background"

const FILLED_ICON = {
  16: "icon/16.png",
  32: "icon/32.png",
  48: "icon/48.png",
  128: "icon/128.png"
}
const STROKE_ICON = {
  16: "icon/stroke/16.png",
  32: "icon/stroke/32.png",
  48: "icon/stroke/48.png",
  128: "icon/stroke/128.png"
}

// Toolbar icon mirrors the same fill/stroke language as the in-panel bookmark
// button: filled once the current tab's URL is saved, stroke otherwise.
async function updateActionIcon(tabId: number, url: string | undefined) {
  if (!url || !/^https?:/.test(url)) {
    await browser.action.setIcon({ tabId, path: STROKE_ICON })
    return
  }

  const matches = await browser.bookmarks.search({ url })
  await browser.action.setIcon({
    tabId,
    path: matches.length > 0 ? FILLED_ICON : STROKE_ICON
  })
}

async function refreshActiveTabIcons() {
  const tabs = await browser.tabs.query({ active: true })
  await Promise.all(
    tabs
      .filter((tab): tab is typeof tab & { id: number } => tab.id !== undefined)
      .map((tab) => updateActionIcon(tab.id, tab.url))
  )
}

const UNINSTALL_URL = "https://usecarrel.app/shelf/uninstalled"

export default defineBackground(() => {
  registerSelectionBookmarks()

  void browser.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  })
  // Tells whoever removes Shelf that their bookmarks are still in Chrome, and
  // asks why; the version tells which release the answer is about.
  void browser.runtime.setUninstallURL(
    `${UNINSTALL_URL}?v=${browser.runtime.getManifest().version}`
  )

  browser.tabs.onActivated.addListener(({ tabId }) => {
    void browser.tabs.get(tabId).then((tab) => updateActionIcon(tabId, tab.url))
  })
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url === undefined && changeInfo.status !== "complete") return
    void updateActionIcon(tabId, tab.url)
  })
  browser.bookmarks.onCreated.addListener(() => void refreshActiveTabIcons())
  browser.bookmarks.onChanged.addListener(() => void refreshActiveTabIcons())
  browser.bookmarks.onMoved.addListener(() => void refreshActiveTabIcons())
  browser.bookmarks.onRemoved.addListener(() => void refreshActiveTabIcons())

  // sidePanel.open() only succeeds inside a real user gesture, and onInstalled
  // firing right after install doesn't reliably count as one — so the install
  // handler opens a normal tab instead (tabs.create has no such restriction).
  // That tab's own "Open Shelf" button is a genuine click, so it can call
  // sidePanel.open() itself.
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason !== "install") return
    void browser.tabs.create({ url: chrome.runtime.getURL("/welcome.html") })
  })

  // Keyboard shortcut (chrome://extensions/shortcuts) to open the panel and
  // jump straight into search — a command's callback is a real user gesture,
  // but only for as long as no `await` runs before sidePanel.open() is
  // called. `windows.getCurrent()` was an async call sitting in front of it,
  // which broke the gesture chain and made Chrome reject the call with
  // "sidePanel.open() may only be called in response to a user gesture."
  // The command's own `tab` argument already carries the window id
  // synchronously, so open() can fire as the listener's first statement.
  browser.commands.onCommand.addListener((command, tab) => {
    if (command !== "open-panel") return
    if (tab?.windowId === undefined) return

    void browser.sidePanel.open({ windowId: tab.windowId }).then(() => {
      // Covers the panel being closed (about to mount fresh, will read this
      // on mount) and already open (won't remount, so it needs the live
      // message below instead) — see focus-search.ts for why both are
      // needed.
      void focusSearchOnOpenStorage.setValue(true)
      void browser.runtime
        .sendMessage({ type: FOCUS_SEARCH_MESSAGE })
        .catch(() => {})
    })
  })
})
