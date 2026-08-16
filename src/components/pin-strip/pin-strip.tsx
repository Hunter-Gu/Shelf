import { cn } from "common/lib/utils"
import { useRef } from "react"

import {
  resolveAppendDropTarget,
  useBookmarkDrop,
  type BookmarkZone
} from "~/components/bookmark-dnd"

import { BookmarkChip } from "./bookmark-chip"
import { normalizeBookmarkUrl } from "./bookmark-url"
import { favoriteGridColumnCount } from "./favorite-grid"

type PinStripItem = {
  id: string
  parentId: string
  index: number
  title: string
  url: string
}

type PinStripProps = {
  items: PinStripItem[]
  activeUrl?: string
  onRemove: (url: string) => void
  folderId?: string
  zone: BookmarkZone
}

export function PinStrip({
  items,
  activeUrl,
  onRemove,
  folderId,
  zone
}: PinStripProps) {
  const columnCount = favoriteGridColumnCount(items.length)
  const normalizedActiveUrl = normalizeBookmarkUrl(activeUrl)
  const ref = useRef<HTMLDivElement>(null)
  const { drop, isOver } = useBookmarkDrop(ref, () =>
    resolveAppendDropTarget(zone, folderId ?? "", items.length)
  )
  drop(ref)

  return (
    <div
      ref={ref}
      className={cn(
        "mx-3 grid gap-1.5 rounded-lg",
        items.length === 0 && "hidden",
        isOver &&
          "bg-black/5 ring-1 ring-black/15 dark:bg-white/5 dark:ring-white/20"
      )}
      style={
        columnCount > 0
          ? {
              gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`
            }
          : undefined
      }
      role="list"
      aria-label="Favorites">
      {items.map((item) => (
        <BookmarkChip
          key={item.id}
          id={item.id}
          parentId={item.parentId}
          index={item.index}
          title={item.title}
          url={item.url}
          zone={zone}
          isActive={normalizeBookmarkUrl(item.url) === normalizedActiveUrl}
          onRemove={() => onRemove(item.url)}
        />
      ))}
    </div>
  )
}
