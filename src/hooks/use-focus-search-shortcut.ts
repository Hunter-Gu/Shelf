import { useEffect, type RefObject } from "react"
import { browser } from "wxt/browser"

import { FOCUS_SEARCH_MESSAGE, focusSearchOnOpenStorage } from "~/focus-search"

export function useFocusSearchShortcut(inputRef: RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const focus = () => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }

    // Cold-open case: the command set this before the panel mounted.
    void focusSearchOnOpenStorage.getValue().then((shouldFocus) => {
      if (!shouldFocus) return
      void focusSearchOnOpenStorage.setValue(false)
      focus()
    })

    // Already-open case: the panel is mounted and listening live.
    const handleMessage = (message: unknown) => {
      if (
        typeof message === "object" &&
        message !== null &&
        "type" in message &&
        message.type === FOCUS_SEARCH_MESSAGE
      ) {
        focus()
      }
    }
    browser.runtime.onMessage.addListener(handleMessage)
    return () => browser.runtime.onMessage.removeListener(handleMessage)
  }, [inputRef])
}
