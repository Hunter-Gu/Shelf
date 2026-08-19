import { IconButton as AstryxIconButton } from "@astryxdesign/core/IconButton"
import { cn } from "common/lib/utils"
import { PinIcon } from "lucide-react"
import { useMemo, useRef } from "react"
import type { DropTargetMonitor } from "react-dnd"

import { useAppContext } from "~/app/app-context"
import { collectTreeUrls, type Bookmark, type Folder } from "~/bookmark-model"
import { Anchor } from "~/components/anchor"
import {
  bookmarkDropClass,
  BookmarkDropPlaceholder,
  resolveAppendDropTarget,
  resolveRowDropTarget,
  useBookmarkDndPreview,
  useBookmarkDrag,
  useBookmarkDrop,
  type BookmarkDragItem
} from "~/components/bookmark-dnd"
import {
  ItemActionsContainer,
  ItemContainer
} from "~/components/folder-tree/styled"
import { faviconURL } from "~/utils/favicon"

import { normalizeBookmarkUrl } from "./bookmark-url"

function PinnedItem({
  item,
  hue,
  isActive,
  onUnpin
}: {
  item: Bookmark
  hue: string
  isActive: boolean
  onUnpin: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { drag, isDragging } = useBookmarkDrag({ zone: "pin", ...item })
  const { drop, isOver, edge } = useBookmarkDrop(
    ref,
    (element: HTMLElement, monitor: DropTargetMonitor<BookmarkDragItem>) =>
      resolveRowDropTarget({
        element,
        monitor,
        zone: "pin",
        item
      })
  )
  drag(drop(ref))

  return (
    <ItemContainer
      ref={ref}
      role="listitem"
      className={cn(
        isActive && "bg-black/10 dark:bg-white/10",
        isDragging && "opacity-[0.18]",
        bookmarkDropClass(isOver, edge)
      )}>
      <img
        src={faviconURL(item.url)}
        alt={item.title}
        draggable={false}
        className="mr-2 h-4 w-4 rounded"
      />
      <Anchor
        href={item.url}
        title={item.title}
        aria-label={item.title}
        aria-current={isActive ? "page" : undefined}
        className="flex-1 overflow-hidden text-ellipsis text-nowrap text-left text-sm text-gray-700 group-hover:mr-10 dark:text-gray-200">
        {item.title}
      </Anchor>
      <ItemActionsContainer>
        <AstryxIconButton
          label="Unpin"
          tooltip="Unpin"
          variant="ghost"
          icon={
            <PinIcon
              className="h-4 w-4"
              fill="currentColor"
              style={{ color: `var(--color-icon-${hue})` }}
            />
          }
          onClick={onUnpin}
        />
      </ItemActionsContainer>
    </ItemContainer>
  )
}

// Pin copies live in one flat, global "Pins (Shelf)" folder — which
// workspace a pin belongs to isn't stored anywhere, it's read off wherever
// the *source* bookmark currently lives. So scoping to the current
// workspace means intersecting the global pin list against this
// workspace's own tree, not filtering the pin folder itself.
export function PinnedStrip({ tree }: { tree: Folder }) {
  const { pins, tabs, workspace } = useAppContext()
  const hue = workspace.currentWorkspace.color ?? "gray"
  const workspaceUrls = useMemo(() => collectTreeUrls(tree), [tree])
  const items = pins.pinnedItems.filter((item) => workspaceUrls.has(item.url))
  const activeUrl = normalizeBookmarkUrl(tabs.activeTab?.url)
  const preview = useBookmarkDndPreview()
  const previewTarget =
    preview?.target.zone === "pin" && preview.target.edge !== "inside"
      ? preview.target
      : null
  const ref = useRef<HTMLDivElement>(null)
  const { drop, isOver } = useBookmarkDrop(ref, () =>
    resolveAppendDropTarget(
      "pin",
      pins.pinsFolderId ?? "",
      pins.pinnedItems.length
    )
  )
  drop(ref)

  return (
    <div
      ref={ref}
      className={cn(
        "mx-3 rounded-lg",
        items.length === 0 && !previewTarget && "hidden",
        isOver &&
          "bg-black/5 ring-1 ring-black/15 dark:bg-white/5 dark:ring-white/20"
      )}
      role="list"
      aria-label="Pinned bookmarks">
      {items.flatMap((item) => {
        const isActive = normalizeBookmarkUrl(item.url) === activeUrl
        const pinnedItem = (
          <PinnedItem
            key={item.id}
            item={item}
            hue={hue}
            isActive={isActive}
            onUnpin={() => void pins.unpin(item.url)}
          />
        )
        const placeholder = previewTarget?.anchorId === item.id && (
          <BookmarkDropPlaceholder
            key={`drop-pin-${previewTarget.parentId}-${previewTarget.index}`}
            target={previewTarget}
          />
        )

        if (!placeholder) return [pinnedItem]
        return previewTarget.edge === "before"
          ? [placeholder, pinnedItem]
          : [pinnedItem, placeholder]
      })}
      {previewTarget?.edge === "append" && !previewTarget.anchorId ? (
        <BookmarkDropPlaceholder
          key={`drop-pin-${previewTarget.parentId}-${previewTarget.index}`}
          target={previewTarget}
        />
      ) : null}
    </div>
  )
}
