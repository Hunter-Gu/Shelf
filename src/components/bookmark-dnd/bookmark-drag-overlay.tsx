import { FolderIcon } from "lucide-react"
import { useDragLayer } from "react-dnd"

import { faviconURL } from "~/utils/favicon"

import {
  BOOKMARK_DND_TYPE,
  isFolderDragItem,
  type BookmarkDragItem
} from "./bookmark-drop"

function useBookmarkDragOverlay() {
  return useDragLayer((monitor) => ({
    isDragging: monitor.isDragging(),
    itemType: monitor.getItemType(),
    item: monitor.getItem<BookmarkDragItem>(),
    offset: monitor.getClientOffset()
  }))
}

export function BookmarkDragOverlay() {
  const { isDragging, itemType, item, offset } = useBookmarkDragOverlay()
  if (!isDragging || itemType !== BOOKMARK_DND_TYPE || !item || !offset) {
    return null
  }

  const width = Math.min(220, window.innerWidth - 16)
  const preferredX = offset.x + 14
  const x =
    preferredX + width <= window.innerWidth - 8
      ? preferredX
      : Math.max(8, offset.x - width - 14)
  const y = Math.min(offset.y + 12, window.innerHeight - 40)

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[9999] flex h-8 items-center overflow-hidden rounded-lg bg-gray-900/90 px-2.5 text-xs text-gray-100 shadow-lg ring-1 ring-white/15 backdrop-blur-sm"
      style={{
        width,
        transform: `translate3d(${x}px, ${y}px, 0)`
      }}>
      {isFolderDragItem(item) ? (
        <FolderIcon className="mr-2 h-4 w-4 shrink-0 text-gray-300" />
      ) : (
        <img
          src={faviconURL(item.url, 32)}
          alt=""
          className="mr-2 h-4 w-4 shrink-0 rounded object-contain"
        />
      )}
      <span className="truncate">{item.title}</span>
    </div>
  )
}
