import { browser } from "wxt/browser"

import { registerBookmarkDestinations } from "./destinations-background"
import {
  registerHighlightMutations,
  type RunMutation
} from "./mutation-background"
import { registerHighlightRestore } from "./restore-background"
import { registerSelectionMenu } from "./selection-menu"
import { HighlightStore } from "./store"

export function registerSelectionBookmarks() {
  const store = new HighlightStore(browser.bookmarks)
  let pendingSave = Promise.resolve()
  const run: RunMutation = (operation) => {
    const result = pendingSave.then(operation)
    pendingSave = result.then(
      () => {},
      () => {}
    )
    return result
  }
  registerHighlightRestore(store)
  registerHighlightMutations(store, run)
  registerBookmarkDestinations(store)
  registerSelectionMenu(store, run)
}
