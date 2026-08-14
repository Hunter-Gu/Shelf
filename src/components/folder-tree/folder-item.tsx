import {
  useFolderState,
  useUpdateFolderState
} from "common/context/folder-states-context"
import { cn } from "common/lib/utils"
import { FolderIcon, FolderOpenIcon } from "lucide-react"
import { useCallback, type KeyboardEvent } from "react"

import { useAppContext } from "~/app/app-context"
import { useEditable } from "~/context/editable-context"
import { useIsFocused } from "~/context/focus-context"
import { useAllyClick } from "~/hooks/use-ally-click"

import { type Folder } from "../../bookmark-model"
import { useDnD } from "../../context/dnd-context"
import { BookmarkButton } from "../bookmark-button/bookmark-button"
import { clsx } from "../clsx"
import { Editable } from "../editable"
import { FolderMenu } from "../menu/folder-menu"
import { FocusedStyle, getDnDStyle } from "./constants"
import { ItemActionsContainer, ItemContainer } from "./styled"
import { useItemDrag, useItemDrop } from "./use-dnd"

type FolderItemProps = Folder & { className?: string }

const Item = clsx.div(
  "flex flex-1 items-center justify-between ml-2 text-sm font-semibold text-gray-700 dark:text-gray-200"
)

const Title = clsx.span("line-clamp-1 group-hover:mr-20")

export function FolderItem({ className, ...props }: FolderItemProps) {
  const isFocused = useIsFocused()
  const { bookmarks } = useAppContext()
  const { change } = bookmarks

  const { id, title } = props
  const updateFolderState = useUpdateFolderState()
  const folderState = useFolderState(id)

  const confirmChange = useCallback(
    (e: KeyboardEvent<Element>, newTitle: string) => {
      e.stopPropagation()
      change(id, {
        title: newTitle
      })
    },
    [change, id]
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
  const a11yClick = useAllyClick(() => {
    updateFolderState(id)
  })

  return (
    <ItemContainer
      ref={ref}
      className={cn(
        isDragging && "opacity-30",
        dndStyle,
        isFocused && FocusedStyle,
        className
      )}
      {...a11yClick}>
      {folderState ? (
        <FolderOpenIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      ) : (
        <FolderIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      )}

      <Item>
        <Editable
          isEditing={isEditing}
          text={title}
          preview={
            <>
              <Title title={title} className={cn(isFocused && "mr-20")}>
                {title}
              </Title>
              <ItemActionsContainer className={cn(isFocused && "visible")}>
                <BookmarkButton id={id} />
                <FolderMenu
                  item={props}
                  onRename={() => setEditing(true)}></FolderMenu>
              </ItemActionsContainer>
            </>
          }
          onChange={handleChange}></Editable>
      </Item>
    </ItemContainer>
  )
}
