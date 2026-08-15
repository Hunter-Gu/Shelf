import { useEffect, type RefObject } from "react"

// Plain mouse wheels only ever produce vertical delta, so scrolling a
// horizontal-only region normally requires holding Shift. Trackpad two-finger
// horizontal swipes already produce real deltaX and should pass through
// untouched — this only takes over when the gesture is purely vertical.
export function useWheelToHorizontalScroll(
  ref: RefObject<HTMLElement | null>,
  // Raw deltaY per wheel tick varies a lot by OS/mouse (some jump 100+px),
  // which reads as a too-long scroll per tick — scaled down so the amount
  // moved feels proportionate to the gesture instead of 1:1 with it.
  speed = 0.2
) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
      if (el.scrollWidth <= el.clientWidth) return

      event.preventDefault()
      el.scrollLeft += event.deltaY * speed
    }

    // React attaches wheel listeners as passive by default, which would
    // silently no-op preventDefault() — a native listener is required to
    // actually take over the scroll.
    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [ref, speed])
}
