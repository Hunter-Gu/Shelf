import { browser } from "wxt/browser"

import {
  isHighlightMutation,
  MOVE_HIGHLIGHT,
  RECOLOR_HIGHLIGHT,
  REMOVE_HIGHLIGHT,
  SAVE_HIGHLIGHT,
  type MutationResult
} from "./messages"
import { pageAddress } from "./page-url"
import { selectionBookmark } from "./selection-bookmark"
import type { HighlightStore } from "./store"

export type RunMutation = <T>(operation: () => Promise<T>) => Promise<T>

export function registerHighlightMutations(
  store: HighlightStore,
  run: RunMutation
) {
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (
      ![
        SAVE_HIGHLIGHT,
        RECOLOR_HIGHLIGHT,
        MOVE_HIGHLIGHT,
        REMOVE_HIGHLIGHT
      ].includes(message?.type)
    )
      return
    if (
      sender.id !== browser.runtime.id ||
      !sender.tab ||
      !sender.url ||
      !pageAddress(sender.url) ||
      !isHighlightMutation(message)
    ) {
      sendResponse({
        ok: false,
        error: "Could not update this highlight."
      } satisfies MutationResult)
      return
    }
    const pageUrl = sender.url
    void run(async (): Promise<MutationResult> => {
      if (message.type === SAVE_HIGHLIGHT) {
        const saved = await store.save({
          text: message.text,
          pageTitle: message.title,
          pageUrl,
          folderId: message.folderId,
          color: message.color
        })
        if (!saved) throw new Error("Select some text and try again.")
        const expected = selectionBookmark(message.text, pageUrl)
        const fragment = expected
          ? new URL(expected.url).hash.split(":~:")[0]
          : ""
        const highlight = (await store.forPage(pageUrl)).find(
          (item) => item.fragment === fragment
        )
        if (!highlight)
          throw new Error(
            "Chrome did not return the saved highlight. Try again."
          )
        return { ok: true, highlight }
      }
      if (message.type === RECOLOR_HIGHLIGHT) {
        await store.recolor(pageUrl, message.id, message.color)
      } else if (message.type === MOVE_HIGHLIGHT) {
        await store.move(pageUrl, message.id, {
          folderId: message.folderId,
          pageTitle: message.title
        })
      } else {
        await store.remove(pageUrl, message.id)
      }
      return { ok: true }
    })
      .then((result) => sendResponse(result))
      .catch((error: unknown) => {
        console.error("Failed to update highlight", error)
        sendResponse({
          ok: false,
          error:
            error instanceof Error
              ? error.message
              : "Could not update this highlight. Try again."
        } satisfies MutationResult)
      })
    return true
  })
}
