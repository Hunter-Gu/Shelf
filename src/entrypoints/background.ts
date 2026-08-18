import { browser } from "wxt/browser"
import { defineBackground } from "wxt/utils/define-background"

import { FOCUS_SEARCH_MESSAGE, focusSearchOnOpenStorage } from "~/focus-search"

export default defineBackground(() => {
  void browser.sidePanel.setPanelBehavior({
    openPanelOnActionClick: true
  })

  // sidePanel.open() only succeeds inside a real user gesture, and onInstalled
  // firing right after install doesn't reliably count as one — so the install
  // handler opens a normal tab instead (tabs.create has no such restriction).
  // That tab's own "Open Markit" button is a genuine click, so it can call
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
