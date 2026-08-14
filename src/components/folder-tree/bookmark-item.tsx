import { cn } from "common/lib/utils"
import { useCallback, useMemo, type KeyboardEvent } from "react"

import { useAppContext } from "~/app/app-context"
import { useEditable } from "~/context/editable-context"
import { useIsFocused } from "~/context/focus-context"

import type { Bookmark } from "../../bookmark-model"
import { useDnD } from "../../context/dnd-context"
import { faviconURL } from "../../utils/favicon"
import { Anchor as _Anchor } from "../anchor"
import { clsx, withClsx } from "../clsx"
import { Editable } from "../editable"
import { BookmarkMenu } from "../menu/bookmark-menu"
import { FocusedStyle, getDnDStyle } from "./constants"
import { ItemActionsContainer, ItemContainer } from "./styled"
import { useItemDrag, useItemDrop } from "./use-dnd"

type BookmarkItemProps = Bookmark & {
  className?: string
}

const Anchor = withClsx(
  _Anchor,
  "text-sm text-left flex-1 text-ellipsis text-nowrap overflow-hidden text-gray-700 dark:text-gray-200 group-hover:mr-10"
)

const Favicon = clsx.img("w-4 h-4 mr-2 rounded")

export function BookmarkItem({ className, ...props }: BookmarkItemProps) {
  const isFocused = useIsFocused()
  const { bookmarks } = useAppContext()
  const { change } = bookmarks

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

  const { isDragging, drag } = useItemDrag(props)
  const { isOver, drop } = useItemDrop(ref, props)
  const { mode } = useDnD()
  drag(drop(ref))

  const dndStyle = getDnDStyle(isOver, mode)

  return (
    <ItemContainer
      ref={ref}
      className={cn(
        isDragging && "opacity-30",
        dndStyle,
        isFocused && FocusedStyle,
        className
      )}>
      <Favicon src={favicon} alt={title} />

      <Editable
        isEditing={isEditing}
        text={title}
        preview={
          <>
            <Anchor
              href={url}
              title={title}
              className={cn(isFocused && "mr-10")}>
              {title}
            </Anchor>
            <ItemActionsContainer className={cn(isFocused && "visible")}>
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
