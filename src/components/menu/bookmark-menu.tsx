import { useAppContext } from "~/app/app-context"
import { tabManager } from "~/tabs/actions"

import { type Bookmark } from "../../bookmark-model"
import { Menu, type MenuItems } from "./menu"

type BookmarkMenuProps = {
  onRename?: () => void
  item: Bookmark
}

export function BookmarkMenu({ item, onRename }: BookmarkMenuProps) {
  const { bookmarks, workspace } = useAppContext()
  const { remove, move } = bookmarks
  const { workspaces, currentWorkspace: current } = workspace

  const items: MenuItems = [
    { label: "Open in New Window", onClick: () => tabManager.createInNewWindow(item.url) },
    {
      label: "Open in Incognito Window",
      onClick: () => tabManager.createInNewWindow(item.url, true)
    },
    { type: "divider" },
    { label: "Rename", onClick: onRename },
    { label: "Copy Link", onClick: () => void navigator.clipboard.writeText(item.url) },
    { type: "divider" },
    {
      type: "section",
      title: "Move to",
      items: workspaces.map((space) => ({
        id: space.id,
        label: space.title,
        isDisabled: current.id === space.id,
        onClick: () => {
          if (current.id !== space.id) move(item.id, { parentId: space.id })
        }
      }))
    },
    { type: "divider" },
    { label: "Delete", onClick: () => remove(item.id) }
  ]

  return <Menu items={items} />
}
