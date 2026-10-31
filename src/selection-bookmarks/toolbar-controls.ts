import { useRef, type MouseEvent, type PointerEvent } from "react"

export function useToolbarAction(action: () => void) {
  const handled = useRef(false)
  return {
    onPointerDown(event: PointerEvent<HTMLButtonElement>) {
      if (event.button !== 0 || event.currentTarget.disabled) return
      event.preventDefault()
      event.stopPropagation()
      handled.current = true
      action()
    },
    onKeyDown() {
      handled.current = false
    },
    onClick(event: MouseEvent<HTMLButtonElement>) {
      event.preventDefault()
      event.stopPropagation()
      if (handled.current) handled.current = false
      else action()
    }
  }
}
