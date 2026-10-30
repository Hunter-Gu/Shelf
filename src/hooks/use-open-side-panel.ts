import { useEffect, useRef, useState } from "react"
import { browser } from "wxt/browser"

export type OpenState = "idle" | "opening" | "opened" | "error"

/**
 * Opens Shelf's side panel from a click on an extension page.
 * sidePanel.open() only succeeds when called synchronously in direct response
 * to a user gesture, so the window id is fetched ahead of time and open() is
 * the click handler's first call.
 */
export function useOpenSidePanel() {
  const [state, setState] = useState<OpenState>("idle")
  const windowIdRef = useRef<number | null>(null)

  useEffect(() => {
    void browser.windows.getCurrent().then((window) => {
      windowIdRef.current = window.id ?? null
    })
  }, [])

  const open = () => {
    const windowId = windowIdRef.current
    if (windowId === null) {
      setState("error")
      return
    }

    setState("opening")
    browser.sidePanel
      .open({ windowId })
      .then(() => setState("opened"))
      .catch(() => setState("error"))
  }

  return { state, open }
}
