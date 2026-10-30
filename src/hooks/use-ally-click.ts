import { useCallback, useRef, type KeyboardEvent, type MouseEvent } from "react"

export function useAllyClick(handler: () => void) {
  const handlerRef = useRef<(e: MouseEvent | KeyboardEvent) => void>(handler)
  handlerRef.current = handler

  const handleClick = useCallback((e: MouseEvent) => {
    handlerRef.current(e)
  }, [])
  const handleKeydown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      handlerRef.current(e)
    }
  }, [])

  return {
    role: "button",
    tabIndex: 0,
    onClick: handleClick,
    onKeyDown: handleKeydown
  }
}
