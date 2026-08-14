import { useEffect, useState } from "react"
import { storage } from "wxt/utils/storage"

const pinHintStorage = storage.defineItem<boolean>("local:hasSeenPinHint", {
  fallback: false
})

export function usePinHint() {
  const [dismissed, setDismissed] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true
    void pinHintStorage.getValue().then((seen) => {
      if (!mounted) return
      setDismissed(seen)
      setReady(true)
    })
    return () => {
      mounted = false
    }
  }, [])

  const dismiss = () => {
    setDismissed(true)
    void pinHintStorage.setValue(true)
  }

  return { isVisible: ready && !dismissed, dismiss }
}
