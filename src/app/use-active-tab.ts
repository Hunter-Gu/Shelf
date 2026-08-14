import { useCallback, useEffect, useRef, useState } from "react"
import { browser } from "wxt/browser"

export function useActiveTab() {
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(null)
  const refreshRequestRef = useRef(0)

  const refresh = useCallback(async () => {
    const requestId = ++refreshRequestRef.current
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true
    })
    if (requestId !== refreshRequestRef.current) return
    setActiveTab(tab ?? null)
  }, [])

  useEffect(() => {
    void refresh()
    browser.tabs.onActivated.addListener(refresh)
    browser.tabs.onUpdated.addListener(refresh)

    return () => {
      browser.tabs.onActivated.removeListener(refresh)
      browser.tabs.onUpdated.removeListener(refresh)
    }
  }, [refresh])

  return { activeTab, refresh }
}
