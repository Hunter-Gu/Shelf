import { useCallback, useEffect, useRef, useState, type RefObject } from "react"

export type DockScrollDirection = -1 | 1

const HOVER_DELAY_MS = 250
const HOVER_SPEED_PX_PER_SECOND = 42
const CLICK_DISTANCE_PX = 96
const CLICK_COOLDOWN_MS = 2000
const EDGE_EPSILON_PX = 1

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function useDockEdgeScroll(
  ref: RefObject<HTMLElement | null>,
  itemCount: number
) {
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const hoverDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clickCooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef<number | null>(null)
  const hoveredDirectionRef = useRef<DockScrollDirection | null>(null)

  const updateEdges = useCallback(() => {
    const el = ref.current
    if (!el) return

    const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth)
    setCanScrollLeft(el.scrollLeft > EDGE_EPSILON_PX)
    setCanScrollRight(el.scrollLeft < maxScrollLeft - EDGE_EPSILON_PX)
  }, [ref])

  const cancelScheduledScroll = useCallback(() => {
    if (hoverDelayRef.current !== null) {
      clearTimeout(hoverDelayRef.current)
      hoverDelayRef.current = null
    }
    if (clickCooldownRef.current !== null) {
      clearTimeout(clickCooldownRef.current)
      clickCooldownRef.current = null
    }
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    lastFrameTimeRef.current = null
  }, [])

  const stopHoverScroll = useCallback(() => {
    hoveredDirectionRef.current = null
    cancelScheduledScroll()
  }, [cancelScheduledScroll])

  const runHoverScroll = useCallback(
    (direction: DockScrollDirection) => {
      if (prefersReducedMotion()) return

      const scrollFrame = (time: number) => {
        const el = ref.current
        if (!el || hoveredDirectionRef.current !== direction) {
          stopHoverScroll()
          return
        }

        const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth)
        if (
          (direction === -1 && el.scrollLeft <= EDGE_EPSILON_PX) ||
          (direction === 1 && el.scrollLeft >= maxScrollLeft - EDGE_EPSILON_PX)
        ) {
          el.scrollLeft = direction === -1 ? 0 : maxScrollLeft
          updateEdges()
          stopHoverScroll()
          return
        }

        if (lastFrameTimeRef.current !== null) {
          const elapsedSeconds = Math.min(
            (time - lastFrameTimeRef.current) / 1000,
            0.05
          )
          el.scrollLeft +=
            direction * HOVER_SPEED_PX_PER_SECOND * elapsedSeconds
        }
        lastFrameTimeRef.current = time
        animationFrameRef.current = requestAnimationFrame(scrollFrame)
      }

      lastFrameTimeRef.current = null
      animationFrameRef.current = requestAnimationFrame(scrollFrame)
    },
    [ref, stopHoverScroll, updateEdges]
  )

  const startHoverScroll = useCallback(
    (direction: DockScrollDirection) => {
      hoveredDirectionRef.current = direction
      cancelScheduledScroll()
      if (prefersReducedMotion()) return

      hoverDelayRef.current = setTimeout(() => {
        hoverDelayRef.current = null
        if (hoveredDirectionRef.current === direction) {
          runHoverScroll(direction)
        }
      }, HOVER_DELAY_MS)
    },
    [cancelScheduledScroll, runHoverScroll]
  )

  const scrollOnce = useCallback(
    (direction: DockScrollDirection) => {
      cancelScheduledScroll()
      ref.current?.scrollBy({
        left: direction * CLICK_DISTANCE_PX,
        behavior: prefersReducedMotion() ? "auto" : "smooth"
      })

      if (
        hoveredDirectionRef.current === direction &&
        !prefersReducedMotion()
      ) {
        clickCooldownRef.current = setTimeout(() => {
          clickCooldownRef.current = null
          if (hoveredDirectionRef.current === direction) {
            runHoverScroll(direction)
          }
        }, CLICK_COOLDOWN_MS)
      }
    },
    [cancelScheduledScroll, ref, runHoverScroll]
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return

    updateEdges()
    el.addEventListener("scroll", updateEdges, { passive: true })
    const resizeObserver = new ResizeObserver(updateEdges)
    resizeObserver.observe(el)

    return () => {
      el.removeEventListener("scroll", updateEdges)
      resizeObserver.disconnect()
      stopHoverScroll()
    }
  }, [ref, stopHoverScroll, updateEdges])

  useEffect(() => {
    const animationFrame = requestAnimationFrame(updateEdges)
    return () => cancelAnimationFrame(animationFrame)
  }, [itemCount, updateEdges])

  return {
    canScrollLeft,
    canScrollRight,
    scrollOnce,
    startHoverScroll,
    stopHoverScroll
  }
}
