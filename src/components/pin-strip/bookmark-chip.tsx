import { cn } from "common/lib/utils"
import { XIcon } from "lucide-react"
import { useRef } from "react"
import type { DropTargetMonitor } from "react-dnd"

import type { Bookmark } from "~/bookmark-model"
import {
  bookmarkDropClass,
  resolveRowDropTarget,
  useBookmarkDndPreview,
  useBookmarkDrag,
  useBookmarkDrop,
  type BookmarkDragItem,
  type BookmarkZone
} from "~/components/bookmark-dnd"
import { faviconURL } from "~/utils/favicon"

import { Anchor } from "../anchor"

type BookmarkChipProps = {
  id: string
  parentId: string
  index: number
  title: string
  url: string
  zone: BookmarkZone
  isActive: boolean
  onRemove: () => void
}

export function BookmarkChip({
  id,
  parentId,
  index,
  title,
  url,
  zone,
  isActive,
  onRemove
}: BookmarkChipProps) {
  const ref = useRef<HTMLDivElement>(null)
  const item: Bookmark = { id, parentId, index, title, url }
  const preview = useBookmarkDndPreview()
  const { drag, isDragging } = useBookmarkDrag({ zone, ...item })
  const vacatesGrid = isDragging && preview?.target.zone === zone
  const { drop, isOver, edge } = useBookmarkDrop(
    ref,
    (element: HTMLElement, monitor: DropTargetMonitor<BookmarkDragItem>) =>
      resolveRowDropTarget({
        element,
        monitor,
        zone,
        item,
        axis: "horizontal"
      })
  )
  drag(drop(ref))

  return (
    <div
      ref={ref}
      className={cn(
        "group min-w-0",
        vacatesGrid
          ? "pointer-events-none absolute h-10 w-10 opacity-0"
          : "relative",
        isDragging && !vacatesGrid && "opacity-[0.18]",
        bookmarkDropClass(isOver, edge, "horizontal")
      )}
      role="listitem">
      <Anchor
        href={url}
        title={title}
        aria-label={title}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex h-10 w-full items-center justify-center rounded-lg outline-none transition-[background-color,box-shadow] duration-150 focus-visible:ring-2 motion-reduce:transition-none",
          isActive
            ? "bg-black/[0.13] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.55)] ring-2 ring-black/20 hover:bg-black/[0.16] dark:bg-white/[0.5] dark:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)] dark:ring-white/65 dark:hover:bg-white/[0.56]"
            : "bg-black/[0.045] ring-black/15 hover:bg-black/[0.075] hover:shadow-sm dark:bg-white/[0.07] dark:ring-white/20 dark:hover:bg-white/[0.11]"
        )}>
        <img
          src={faviconURL(url, 64)}
          alt=""
          draggable={false}
          className="h-5 w-5 rounded object-contain"
        />
      </Anchor>
      <button
        type="button"
        aria-label={`Remove ${title}`}
        onClick={(event) => {
          event.stopPropagation()
          onRemove()
        }}
        className="group/remove absolute right-0 top-0 flex h-6 w-6 items-start justify-end rounded-md p-0.5 text-white opacity-0 outline-none transition-opacity focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-black/30 group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none dark:text-gray-950">
        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black/55 group-hover/remove:bg-black/75 dark:bg-white/70 dark:group-hover/remove:bg-white">
          <XIcon className="h-2 w-2" />
        </span>
      </button>
    </div>
  )
}
