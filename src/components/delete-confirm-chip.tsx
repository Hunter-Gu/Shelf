import { cn } from "common/lib/utils"
import { motion } from "framer-motion"
import { Trash2Icon } from "lucide-react"
import { useEffect, useRef } from "react"

type DeleteConfirmChipProps = {
  label: string
  onConfirm: () => void
  onCancel: () => void
  className?: string
}

export function DeleteConfirmChip({
  label,
  onConfirm,
  onCancel,
  className
}: DeleteConfirmChipProps) {
  const ref = useRef<HTMLButtonElement>(null)

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

  return (
    <motion.button
      ref={ref}
      type="button"
      initial={{ opacity: 0, y: -6, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -6, height: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      onClick={(event) => {
        event.stopPropagation()
        onConfirm()
      }}
      style={{
        backgroundColor: "var(--color-background-red)",
        color: "var(--color-text-red)"
      }}
      // visible overrides the invisible/group-hover:visible some ancestors
      // (e.g. ItemActionsContainer) use to hide row actions until hovered —
      // this needs to stay visible on its own once it's shown.
      className={cn(
        "visible absolute inset-x-0 top-full z-10 mt-1.5 flex items-center gap-2 overflow-hidden rounded-2xl px-3 py-2 text-left text-sm transition-colors hover:brightness-95 active:scale-[0.99]",
        className
      )}>
      <Trash2Icon
        className="h-3.5 w-3.5 shrink-0"
        style={{ color: "var(--color-icon-red)" }}
      />
      <span className="min-w-0 flex-1 truncate font-semibold">{label}</span>
      <span className="shrink-0 text-xs opacity-70">Tap to confirm</span>
    </motion.button>
  )
}
