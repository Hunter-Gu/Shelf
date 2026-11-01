import { browser } from "wxt/browser"

import { currentWorkspaceStorage } from "~/workspace-model/storage/workspace-storage"

import { GET_DESTINATIONS, type DestinationsResult } from "./messages"
import { pageAddress } from "./page-url"
import type { HighlightStore } from "./store"

export function registerBookmarkDestinations(store: HighlightStore) {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== GET_DESTINATIONS) return
    if (
      sender.id !== browser.runtime.id ||
      !sender.tab ||
      !sender.url ||
      !pageAddress(sender.url)
    ) {
      sendResponse({
        ok: false,
        error: "Could not load save locations."
      } satisfies DestinationsResult)
      return
    }
    const pageUrl = sender.url
    void currentWorkspaceStorage
      .getValue()
      .then((workspaceId) => store.destinations(pageUrl, workspaceId))
      .then((result) =>
        sendResponse({ ok: true, ...result } satisfies DestinationsResult)
      )
      .catch(() =>
        sendResponse({
          ok: false,
          error:
            "Could not load save locations. Open the folder picker to retry."
        } satisfies DestinationsResult)
      )
    return true
  })
}
