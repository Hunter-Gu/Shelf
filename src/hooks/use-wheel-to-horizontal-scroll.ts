import { useEffect, type RefObject } from "react"

// Plain mouse wheels only ever produce vertical delta, so scrolling a
// horizontal-only region normally requires holding Shift. Trackpad two-finger
// horizontal swipes already produce real deltaX and should pass through
// untouched — this only takes over when the gesture is purely vertical.
export function useWheelToHorizontalScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
      if (el.scrollWidth <= el.clientWidth) return

      event.preventDefault()
      el.scrollLeft += event.deltaY
    }

    // React attaches wheel listeners as passive by default, which would
    // silently no-op preventDefault() — a native listener is required to
    // actually take over the scroll.
    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [ref])
}
