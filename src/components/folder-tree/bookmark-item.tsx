import { IconButton as AstryxIconButton } from "@astryxdesign/core/IconButton"
import { cn } from "common/lib/utils"
import { ExternalLink } from "lucide-react"
import { useCallback, useMemo, type KeyboardEvent } from "react"
import type { DropTargetMonitor } from "react-dnd"

import { useAppContext } from "~/app/app-context"
import {
  bookmarkDropClass,
  resolveRowDropTarget,
  useBookmarkDrag,
  useBookmarkDrop,
  type BookmarkDragItem
} from "~/components/bookmark-dnd"
import { useEditable } from "~/context/editable-context"
import { useIsFocused } from "~/context/focus-context"
import { tabManager } from "~/tabs/actions"

import type { Bookmark } from "../../bookmark-model"
import { faviconURL } from "../../utils/favicon"
import { Anchor as _Anchor } from "../anchor"
import { clsx, withClsx } from "../clsx"
import { Editable } from "../editable"
import { BookmarkMenu } from "../menu/bookmark-menu"
import { MoveToMenu } from "../menu/move-to-menu"
import { PinFavoriteMenu } from "../menu/pin-favorite-menu"
import { FocusedStyle } from "./constants"
import { ItemActionsContainer, ItemContainer } from "./styled"

type BookmarkItemProps = Bookmark & {
  className?: string
}

// Reserves room for the four row actions (open in new tab, pin/favorite,
// move to, more) that reveal on hover so the icons don't overlap the title.
const Anchor = withClsx(
  _Anchor,
  "text-sm text-left flex-1 text-ellipsis text-nowrap overflow-hidden text-gray-700 dark:text-gray-200 group-hover:mr-44"
)

const Favicon = clsx.img("w-4 h-4 mr-2 rounded")

export function BookmarkItem({ className, ...props }: BookmarkItemProps) {
  const isFocused = useIsFocused()
  const { bookmarks } = useAppContext()
  const { change, move } = bookmarks

  const { id, title, url } = props
  const favicon = useMemo(() => faviconURL(url), [url])

  const confirmChange = useCallback(
    (e: KeyboardEvent<Element>, newTitle: string) => {
      change(id, {
        title: newTitle
      })
    },
    [id, change]
  )
  const { ref, isEditing, setEditing, handleChange } = useEditable(
    id,
    confirmChange
  )

  const source: BookmarkDragItem = { zone: "workspace", ...props }
  const { isDragging, drag } = useBookmarkDrag(source)
  const { isOver, edge, drop } = useBookmarkDrop(
    ref,
    (element: HTMLElement, monitor: DropTargetMonitor<BookmarkDragItem>) =>
      resolveRowDropTarget({
        element,
        monitor,
        zone: "workspace",
        item: props
      })
  )
  // Virtual rows are mounted and recycled as the list scrolls. Connect DnD
  // to the concrete node through a callback ref instead of handing both
  // connectors the click-outside ref object: this makes every replacement
  // row reconnect immediately and prevents the source from remaining bound
  // to a previously virtualized node.
  const connectRowRef = useCallback(
    (node: HTMLDivElement | null) => {
      ref.current = node
      drop(node)
      drag(node)
    },
    [drag, drop, ref]
  )

  const dndStyle = bookmarkDropClass(isOver, edge)

  return (
    <ItemContainer
      ref={connectRowRef}
      className={cn(
        isDragging && "opacity-[0.18]",
        dndStyle,
        isFocused && FocusedStyle,
        className
      )}>
      <Favicon src={favicon} alt={title} draggable={false} />

      <Editable
        isEditing={isEditing}
        text={title}
        preview={
          <>
            <Anchor
              href={url}
              title={title}
              className={cn(isFocused && "mr-44")}>
              {title}
            </Anchor>
            <ItemActionsContainer className={cn(isFocused && "visible")}>
              <AstryxIconButton
                label="Open in New Tab"
                tooltip="Open in New Tab"
                variant="ghost"
                icon={<ExternalLink className="h-4 w-4" />}
                onClick={() => void tabManager.create({ url, active: true })}
              />
              <PinFavoriteMenu item={{ title, url }} />
              <MoveToMenu
                onMove={(workspaceId) => move(id, { parentId: workspaceId })}
              />
              <BookmarkMenu
                item={props}
                onRename={() => setEditing(true)}></BookmarkMenu>
            </ItemActionsContainer>
          </>
        }
        onChange={handleChange}></Editable>
    </ItemContainer>
  )
}
