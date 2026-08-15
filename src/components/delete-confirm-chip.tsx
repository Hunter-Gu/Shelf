import { cn } from "common/lib/utils"
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
    <button
      ref={ref}
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onConfirm()
      }}
      // visible overrides the invisible/group-hover:visible some ancestors
      // (e.g. ItemActionsContainer) use to hide row actions until hovered —
      // this chip needs to stay visible on its own once it's shown.
      className={cn(
        "visible absolute top-full right-0 z-10 mt-1.5 whitespace-nowrap rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-lg transition-transform hover:bg-red-700 active:scale-95",
        className
      )}>
      {label}
      <span className="absolute -top-1 right-4 h-2 w-2 rotate-45 bg-red-600" />
    </button>
  )
}
