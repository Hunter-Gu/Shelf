import { motion } from "framer-motion"
import { Trash2Icon } from "lucide-react"
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react"
import { createPortal } from "react-dom"

type Rect = { top: number; left: number; width: number }

type DeleteConfirmChipProps = {
  label: string
  anchorRef: RefObject<HTMLElement | null>
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmChip({
  label,
  anchorRef,
  onConfirm,
  onCancel
}: DeleteConfirmChipProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const [rect, setRect] = useState<Rect | null>(null)

  // Portaled + measured against the anchor's real screen position instead of
  // position:absolute in place — the folder tree is a virtualized list where
  // every row sits in its own translateY stacking context, so a z-index set
  // on a chip nested inside one row can't out-stack a sibling row's content.
  useLayoutEffect(() => {
    const updateRect = () => {
      const anchor = anchorRef.current
      if (!anchor) return
      const bounds = anchor.getBoundingClientRect()
      setRect({ top: bounds.bottom, left: bounds.left, width: bounds.width })
    }
    updateRect()

    window.addEventListener("resize", updateRect)
    document.addEventListener("scroll", updateRect, true)
    return () => {
      window.removeEventListener("resize", updateRect)
      document.removeEventListener("scroll", updateRect, true)
    }
  }, [anchorRef])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) onCancel()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel()
    }
    document.addEventListener("pointerdown", handlePointerDown, true)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [onCancel])

  if (!rect) return null

  return createPortal(
    <motion.button
      ref={ref}
      type="button"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      onClick={(event) => {
        event.stopPropagation()
        onConfirm()
      }}
      style={{
        position: "fixed",
        top: rect.top + 6,
        left: rect.left,
        width: rect.width,
        backgroundColor: "var(--color-background-red)",
        color: "var(--color-text-red)"
      }}
      className="z-50 flex items-center gap-2 overflow-hidden rounded-2xl px-3 py-2 text-left text-sm shadow-lg transition-colors hover:brightness-95 active:scale-[0.99]">
      <Trash2Icon
        className="h-3.5 w-3.5 shrink-0"
        style={{ color: "var(--color-icon-red)" }}
      />
      <span className="min-w-0 flex-1 truncate font-semibold">{label}</span>
      <span className="shrink-0 text-xs opacity-70">Tap to confirm</span>
    </motion.button>,
    document.body
  )
}
