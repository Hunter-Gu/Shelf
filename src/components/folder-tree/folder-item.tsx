import {
  useFolderState,
  useUpdateFolderState
} from "common/context/folder-states-context"
import { cn } from "common/lib/utils"
import { FolderIcon, FolderOpenIcon } from "lucide-react"
import { useCallback, useState, type KeyboardEvent } from "react"
import type { DropTargetMonitor } from "react-dnd"

import { useAppContext } from "~/app/app-context"
import {
  bookmarkDropClass,
  resolveRowDropTarget,
  useBookmarkDrag,
  useBookmarkDrop,
  useWorkspaceChildCount,
  type BookmarkDragItem
} from "~/components/bookmark-dnd"
import { useEditable } from "~/context/editable-context"
import { useIsFocused } from "~/context/focus-context"
import { useAllyClick } from "~/hooks/use-ally-click"

import { type Folder } from "../../bookmark-model"
import { BookmarkButton } from "../bookmark-button/bookmark-button"
import { clsx } from "../clsx"
import { DeleteConfirmDialog } from "../delete-confirm-dialog"
import { Editable } from "../editable"
import { FolderMenu } from "../menu/folder-menu"
import { MoveToMenu } from "../menu/move-to-menu"
import { FocusedStyle } from "./constants"
import { ItemActionsContainer, ItemContainer } from "./styled"

type FolderItemProps = Folder & { className?: string }

const Item = clsx.div(
  "flex flex-1 items-center justify-between ml-2 text-sm font-semibold text-gray-700 dark:text-gray-200"
)

const Title = clsx.span("line-clamp-1 group-hover:mr-28")

export function FolderItem({ className, ...props }: FolderItemProps) {
  const { bookmarks } = useAppContext()
  const { change, move, removeTree } = bookmarks

  const { id, title } = props
  const updateFolderState = useUpdateFolderState()
  const folderState = useFolderState(id)
  const [isConfirmingDelete, setConfirmingDelete] = useState(false)
  // The dropdown menu closes (and un-sets isFocused) the instant "Delete" is
  // clicked, before the confirmation is resolved — without this, the row
  // loses its highlight and hides its actions while its own delete
  // confirmation is still showing below it.
  const isFocused = useIsFocused() || isConfirmingDelete

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

  const childCount = useWorkspaceChildCount(id)
  const { drag, isDragging } = useBookmarkDrag({
    kind: "folder",
    zone: "workspace",
    id,
    parentId: props.parentId,
    index: props.index,
    title
  })
  const { isOver, edge, drop } = useBookmarkDrop(
    ref,
    (element: HTMLElement, monitor: DropTargetMonitor<BookmarkDragItem>) =>
      resolveRowDropTarget({
        element,
        monitor,
        zone: "workspace",
        item: props,
        childCount,
        allowInside: true
      })
  )
  const connectRowRef = useCallback(
    (node: HTMLDivElement | null) => {
      ref.current = node
      drop(node)
      drag(node)
    },
    [drag, drop, ref]
  )

  const dndStyle = bookmarkDropClass(isOver, edge)
  const isDropInside = isOver && edge === "inside"
  const a11yClick = useAllyClick(() => {
    updateFolderState(id)
  })

  return (
    <ItemContainer
      ref={connectRowRef}
      className={cn(
        isDragging && "opacity-[0.18]",
        dndStyle,
        isFocused && FocusedStyle,
        className
      )}
      {...a11yClick}>
      {folderState || isDropInside ? (
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
              <Title title={title} className={cn(isFocused && "mr-28")}>
                {title}
              </Title>
              <ItemActionsContainer className={cn(isFocused && "visible")}>
                <BookmarkButton id={id} />
                <MoveToMenu
                  onMove={(workspaceId) => move(id, { parentId: workspaceId })}
                />
                <FolderMenu
                  item={props}
                  onRename={() => setEditing(true)}
                  onRequestDelete={() => setConfirmingDelete(true)}
                />
              </ItemActionsContainer>
            </>
          }
          onChange={handleChange}></Editable>
      </Item>

      <DeleteConfirmDialog
        isOpen={isConfirmingDelete}
        folder={props}
        onConfirm={() => {
          setConfirmingDelete(false)
          removeTree(id)
        }}
        onCancel={() => setConfirmingDelete(false)}
      />
    </ItemContainer>
  )
}
