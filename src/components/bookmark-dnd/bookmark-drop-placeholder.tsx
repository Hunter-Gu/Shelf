import { cn } from "common/lib/utils"
import { FolderIcon } from "lucide-react"
import { useRef } from "react"

import { faviconURL } from "~/utils/favicon"

import { useBookmarkDndPreview, useBookmarkDrop } from "./bookmark-dnd"
import { isFolderDragItem, type BookmarkDropTarget } from "./bookmark-drop"

export function BookmarkDropPlaceholder({
  target,
  variant = "row",
  className
}: {
  target: BookmarkDropTarget
  variant?: "row" | "grid"
  className?: string
}) {
  const preview = useBookmarkDndPreview()
  const ref = useRef<HTMLDivElement>(null)
  const { drop } = useBookmarkDrop(ref, () => target)
  drop(ref)

  if (!preview) return null

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn(
        "relative min-w-0",
        // A row occupies the full virtual row height, including its 4px
        // spacing. Keeping that spacing inside the hit box prevents a tiny
        // dead strip where the workspace root could steal the drop.
        variant === "grid" ? "h-10" : "h-9 pb-1",
        className
      )}>
      <div
        className={cn(
          "flex h-full min-w-0 items-center overflow-hidden rounded-lg border border-dashed border-gray-500/45 bg-black/[0.035] text-gray-500 dark:border-gray-300/40 dark:bg-white/[0.055] dark:text-gray-300",
          variant === "grid" ? "justify-center" : "px-2 text-sm"
        )}>
        {isFolderDragItem(preview.source) ? (
          <FolderIcon className="mr-2 h-4 w-4 shrink-0 opacity-40" />
        ) : (
          <img
            src={faviconURL(preview.source.url, variant === "grid" ? 64 : 32)}
            alt=""
            draggable={false}
            className={cn(
              "shrink-0 rounded object-contain opacity-40 grayscale-[0.35]",
              variant === "grid" ? "h-5 w-5" : "mr-2 h-4 w-4"
            )}
          />
        )}
        {variant === "row" ? (
          <span className="truncate opacity-45">{preview.source.title}</span>
        ) : null}
      </div>
    </div>
  )
}
