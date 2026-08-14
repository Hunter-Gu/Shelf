import { Button } from "@astryxdesign/core/Button"
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog"
import { Layout, LayoutContent, LayoutFooter } from "@astryxdesign/core/Layout"
import {
  useState,
  type PropsWithChildren
} from "react"

import { useAppContext } from "~/app/app-context"
import { useSetEditableId } from "~/context/editable-context"
import { useVirtualTree } from "~/context/virtual-tree-context"
import { useNextTick } from "~/hooks/use-next-tick"
import { tabManager } from "~/tabs/actions"
import type { Workspace } from "~/workspace-model"

import { isFolder, type Bookmark, type Folder } from "../../bookmark-model"
import { Menu, type MenuItems } from "./menu"

type MenuItemProps = {
  onRename?: () => void
  onEdit?: (workspace: Workspace) => void
  item: Pick<Folder, "id" | "title" | "children">
}

export function SpaceMenu({ item, onRename, onEdit }: MenuItemProps) {
  const { bookmarks, workspace } = useAppContext()
  const { create } = bookmarks
  const { currentWorkspace: currentSpace, remove } = workspace

  const { id, children } = item
  const { scrollToId } = useVirtualTree()
  const nextTick = useNextTick()
  const setEditableId = useSetEditableId()
  const [open, setOpen] = useState(false)

  const handleDelete = () => {
    setOpen(false)
    remove(item.id)
  }

  const menuItems: MenuItems = [
    {
      label: "Open All",
      onClick: () =>
        tabManager.create(
          (children || [])
            .filter((item) => !isFolder(item))
            .map((item) => (item as Bookmark).url)
        )
    },
    {
      label: "Open All in New Tab Group",
      onClick: () =>
        tabManager.createInGroup(
          currentSpace.title,
          (item.children || [])
            .filter((item) => !isFolder(item))
            .map((item) => (item as Bookmark).url)
        )
    },
    {
      label: "Open All in New Window",
      onClick: () =>
        tabManager.createInNewWindow(
          (item.children || [])
            .filter((item) => !isFolder(item))
            .map((item) => (item as Bookmark).url)
        )
    },
    {
      label: "Open All in Incognito Window",
      onClick: () =>
        tabManager.createInNewWindow(
          (item.children || [])
            .filter((item) => !isFolder(item))
            .map((item) => (item as Bookmark).url),
          true
        )
    },
    { type: "divider" },
    { label: "Rename", onClick: onRename },
    {
      label: "Edit Workspace Profile",
      onClick: () => onEdit?.(currentSpace)
    },
    {
      label: "New Nested Folder",
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
        if (item.children?.length) setOpen(true)
        else handleDelete()
      }
    }
  ]

  return (
    <>
      <Menu items={menuItems} />

      <ConfirmDelete
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleDelete}></ConfirmDelete>
    </>
  )
}

function ConfirmDelete({
  open,
  onOpenChange,
  onConfirm
}: PropsWithChildren<{
  open: boolean
  onOpenChange?: (open: boolean) => void
  onConfirm?: () => void
}>) {
  return (
    <Dialog isOpen={open} onOpenChange={onOpenChange ?? (() => {})} purpose="form" width={360}>
      <Layout
        header={<DialogHeader title="Delete Workspace?" onOpenChange={onOpenChange} />}
        content={
          <LayoutContent>
            This can't be undone. This will permanently delete folders and bookmarks in this workspace.
          </LayoutContent>
        }
        footer={
          <LayoutFooter>
            <div className="flex justify-end gap-2">
              <Button label="Cancel" variant="ghost" onClick={() => onOpenChange?.(false)} />
              <Button label="Delete" variant="destructive" onClick={onConfirm} />
            </div>
          </LayoutFooter>
        }
      />
    </Dialog>
  )
}
