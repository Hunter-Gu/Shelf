import { AnimatePresence } from "framer-motion"
import { useState, type RefObject } from "react"

import { useAppContext } from "~/app/app-context"
import { useSetEditableId } from "~/context/editable-context"
import { useVirtualTree } from "~/context/virtual-tree-context"
import { useNextTick } from "~/hooks/use-next-tick"
import { tabManager } from "~/tabs/actions"
import type { Workspace } from "~/workspace-model"

import { isFolder, type Bookmark, type Folder } from "../../bookmark-model"
import { DeleteConfirmChip } from "../delete-confirm-chip"
import { Menu, type MenuItems } from "./menu"

type MenuItemProps = {
  onRename?: () => void
  onEdit?: (workspace: Workspace) => void
  item: Pick<Folder, "id" | "title" | "children">
  anchorRef: RefObject<HTMLElement | null>
}

export function SpaceMenu({ item, onRename, onEdit, anchorRef }: MenuItemProps) {
  const { bookmarks, workspace } = useAppContext()
  const { create } = bookmarks
  const { currentWorkspace: currentSpace, remove } = workspace

  const { id, children } = item
  const urls = (children || [])
    .filter((item) => !isFolder(item))
    .map((item) => (item as Bookmark).url)
  const isEmpty = urls.length === 0
  const { scrollToId } = useVirtualTree()
  const nextTick = useNextTick()
  const setEditableId = useSetEditableId()
  const [isConfirmingDelete, setConfirmingDelete] = useState(false)

  const handleDelete = () => {
    setConfirmingDelete(false)
    remove(item.id)
  }

  const menuItems: MenuItems = [
    {
      label: "Open All",
      isDisabled: isEmpty,
      onClick: () => tabManager.create(urls)
    },
    {
      label: "Open All in New Tab Group",
      isDisabled: isEmpty,
      onClick: () => tabManager.createInGroup(currentSpace.title, urls)
    },
    {
      label: "Open All in New Window",
      isDisabled: isEmpty,
      onClick: () => tabManager.createInNewWindow(urls)
    },
    {
      label: "Open All in Incognito Window",
      isDisabled: isEmpty,
      onClick: () => tabManager.createInNewWindow(urls, true)
    },
    { type: "divider" },
    { label: "Rename", onClick: onRename },
    {
      label: "Edit Workspace Profile",
      onClick: () => onEdit?.(currentSpace)
    },
    {
      label: "New Folder",
      onClick: async () => {
        const folder = await create({ title: "Untitled", parentId: id })
        nextTick(() => {
          scrollToId(folder.id)
          setEditableId(folder.id)
        })
      }
    },
    { type: "divider" },
    {
      label: "Delete",
      onClick: () => {
        if (item.children?.length) setConfirmingDelete(true)
        else handleDelete()
      }
    }
  ]

  return (
    <>
      <Menu items={menuItems} />
      <AnimatePresence>
        {isConfirmingDelete && (
          <DeleteConfirmChip
            key="confirm-delete"
            label={`Delete "${currentSpace.title}"`}
            anchorRef={anchorRef}
            onConfirm={handleDelete}
            onCancel={() => setConfirmingDelete(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
