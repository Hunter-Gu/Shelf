import { browser } from "wxt/browser"
import { defineBackground } from "wxt/utils/define-background"

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
})
