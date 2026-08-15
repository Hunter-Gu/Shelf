import { useAppContext } from "~/app/app-context"
import { useUpdateFolderState } from "common/context/folder-states-context"
import { useSetEditableId } from "~/context/editable-context"
import { useVirtualTree } from "~/context/virtual-tree-context"
import { useNextTick } from "~/hooks/use-next-tick"
import { tabManager } from "~/tabs/actions"

import { isFolder, type Bookmark, type Folder } from "../../bookmark-model"
import { Menu, type MenuItems } from "./menu"
import { useMoveToSubmenu } from "./use-move-to-submenu"

type MenuItemProps = {
  onRename?: () => void
  onRequestDelete: () => void
  item: Folder
}

export function FolderMenu({ item, onRename, onRequestDelete }: MenuItemProps) {
  const { id, title, parentId } = item
  const updateFolderState = useUpdateFolderState()
  const { scrollToId } = useVirtualTree()
  const nextTick = useNextTick()
  const { bookmarks, workspace } = useAppContext()
  const { create, move, removeTree } = bookmarks
  const { currentWorkspace: current, workspaces, turnToSpace } = workspace
  const setEditableId = useSetEditableId()
  const turnToSpaceTitle = `Turn '${title}' into Space`
  const urls = (item.children || [])
    .filter((child) => !isFolder(child))
    .map((child) => (child as Bookmark).url)

  const moveTo = useMoveToSubmenu({
    workspaces,
    current,
    onMove: (workspaceId) => move(id, { parentId: workspaceId })
  })

  const mainItems: MenuItems = [
    { label: "Open All", onClick: () => tabManager.create(urls) },
    { label: "Open All in New Tab Group", onClick: () => tabManager.createInGroup(title, urls) },
    { label: "Open All in New Window", onClick: () => tabManager.createInNewWindow(urls) },
    { label: "Open All in Incognito Window", onClick: () => tabManager.createInNewWindow(urls, true) },
    { type: "divider" },
    { label: "Rename", onClick: onRename },
    {
      label: "New Nested Folder",
      onClick: async () => {
        const folder = await create({ parentId: id, title: "Untitled" })
        updateFolderState(id, true)
        nextTick(() => {
          scrollToId(folder.id)
          setEditableId(folder.id)
        })
      }
    },
    { type: "divider" },
    { label: turnToSpaceTitle, onClick: () => turnToSpace({ id, parentId, title }) },
    { type: "divider" },
    { label: "Move to", onClick: moveTo.open },
    { type: "divider" },
    {
      label: "Delete",
      onClick: () => {
        if (item.children?.length) onRequestDelete()
        else removeTree(id)
      }
    }
  ]

  return (
    <Menu
      items={moveTo.isOpen ? moveTo.items : mainItems}
      onOpenChange={(open) => {
        if (!open) moveTo.reset()
      }}
    />
  )
}
