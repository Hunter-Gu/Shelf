import { cn } from "common/lib/utils"
import { useRef } from "react"

import {
  BookmarkDropPlaceholder,
  resolveAppendDropTarget,
  useBookmarkDndPreview,
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
  const normalizedActiveUrl = normalizeBookmarkUrl(activeUrl)
  const preview = useBookmarkDndPreview()
  const previewTarget =
    preview?.target.zone === zone && preview.target.edge !== "inside"
      ? preview.target
      : null
  const targetItemCount =
    items.length + (previewTarget && preview?.source.zone !== zone ? 1 : 0)
  const columnCount = favoriteGridColumnCount(targetItemCount)
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
        items.length === 0 && !previewTarget && "hidden",
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
      {items.flatMap((item) => {
        const chip = (
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
        )
        const placeholder = previewTarget?.anchorId === item.id && (
          <BookmarkDropPlaceholder
            key={`drop-${zone}-${previewTarget.parentId}-${previewTarget.index}`}
            target={previewTarget}
            variant="grid"
          />
        )

        if (!placeholder) return [chip]
        return previewTarget.edge === "before"
          ? [placeholder, chip]
          : [chip, placeholder]
      })}
      {previewTarget?.edge === "append" && !previewTarget.anchorId ? (
        <BookmarkDropPlaceholder
          key={`drop-${zone}-${previewTarget.parentId}-${previewTarget.index}`}
          target={previewTarget}
          variant="grid"
        />
      ) : null}
    </div>
  )
}
