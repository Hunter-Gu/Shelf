import { BookmarkChip } from "./bookmark-chip"
import { normalizeBookmarkUrl } from "./bookmark-url"
import { favoriteGridColumnCount } from "./favorite-grid"

type PinStripItem = { id: string; title: string; url: string }

type PinStripProps = {
  items: PinStripItem[]
  activeUrl?: string
  onRemove: (url: string) => void
}

export function PinStrip({ items, activeUrl, onRemove }: PinStripProps) {
  if (items.length === 0) return null
  const columnCount = favoriteGridColumnCount(items.length)
  const normalizedActiveUrl = normalizeBookmarkUrl(activeUrl)

  return (
    <div
      className="mx-3 mt-3 grid gap-1.5"
      style={{
        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`
      }}
      role="list"
      aria-label="Favorites">
      {items.map((item) => (
        <BookmarkChip
          key={item.id}
          title={item.title}
          url={item.url}
          isActive={normalizeBookmarkUrl(item.url) === normalizedActiveUrl}
          onRemove={() => onRemove(item.url)}
        />
      ))}
    </div>
  )
}
