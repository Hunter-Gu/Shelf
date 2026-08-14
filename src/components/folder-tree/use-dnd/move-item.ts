import { isFolder } from "../../../bookmark-model"
import type { Bookmark, Folder } from "../../../bookmark-model"
import { DnDMode, type DnDContextType } from "../../../context/dnd-context"

export function moveItem(
  dragItem: Bookmark | Folder,
  state: DnDContextType,
  {
    move
  }: {
    move: (
      id: string,
      data: { parentId?: string; index?: number }
    ) => Promise<unknown>
  }
) {
  if (
    !state.id ||
    state.mode === DnDMode.None ||
    dragItem.id === state.id ||
    (isFolder(dragItem) && containsItem(dragItem, state.id))
  ) {
    return
  }

  if (state.mode === DnDMode.Insert && isFolder(state)) {
    // move into sub folder
    move(dragItem.id, {
      parentId: state.id
    })
    return
  }

  move(dragItem.id, {
    parentId: state.parentId,
    index: state.mode === DnDMode.Append ? state.index + 1 : state.index
  })
}

function containsItem(folder: Folder, id: string): boolean {
  return (folder.children ?? []).some(
    (item) => item.id === id || (isFolder(item) && containsItem(item, id))
  )
}
