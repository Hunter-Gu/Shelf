import { useAppContext } from "~/app/app-context"
import { tabManager } from "~/tabs/actions"

import { type Bookmark } from "../../bookmark-model"
import { Menu, type MenuItems } from "./menu"
import { useMoveToSubmenu } from "./use-move-to-submenu"

type BookmarkMenuProps = {
  onRename?: () => void
  item: Bookmark
}

export function BookmarkMenu({ item, onRename }: BookmarkMenuProps) {
  const { bookmarks, workspace } = useAppContext()
  const { remove, move } = bookmarks
  const { workspaces, currentWorkspace: current } = workspace

  const moveTo = useMoveToSubmenu({
    workspaces,
    current,
    onMove: (workspaceId) => move(item.id, { parentId: workspaceId })
  })

  const mainItems: MenuItems = [
    { label: "Open in New Window", onClick: () => tabManager.createInNewWindow(item.url) },
    {
      label: "Open in Incognito Window",
      onClick: () => tabManager.createInNewWindow(item.url, true)
    },
    { type: "divider" },
    { label: "Rename", onClick: onRename },
    { label: "Copy Link", onClick: () => void navigator.clipboard.writeText(item.url) },
    { type: "divider" },
    moveTo.entry,
    { type: "divider" },
    { label: "Delete", onClick: () => remove(item.id) }
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
