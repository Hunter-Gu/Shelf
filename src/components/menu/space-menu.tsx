import { Button } from "common/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "common/ui/dialog"
import { MenubarItem, MenubarSeparator } from "common/ui/menubar"
import {
  useState,
  type MouseEvent,
  type MouseEventHandler,
  type PropsWithChildren
} from "react"

import { useAppContext } from "~/app/app-context"
import { useSetEditableId } from "~/context/editable-context"
import { useVirtualTree } from "~/context/virtual-tree-context"
import { useNextTick } from "~/hooks/use-next-tick"
import { tabManager } from "~/tabs/actions"
import type { Workspace } from "~/workspace-model"

import { isFolder, type Bookmark, type Folder } from "../../bookmark-model"
import { Menu } from "./menu"

type MenuItemProps = {
  onRename?: MouseEventHandler
  onEdit?: (evt: MouseEvent, workspace: Workspace) => void
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

  return (
    <>
      <Menu>
        <MenubarItem
          onClick={() => {
            tabManager.create(
              (children || [])
                .filter((item) => !isFolder(item))
                .map((item) => (item as Bookmark).url)
            )
          }}>
          Open All
        </MenubarItem>
        <MenubarItem
          onClick={() => {
            tabManager.createInGroup(
              currentSpace.title,
              (item.children || [])
                .filter((item) => !isFolder(item))
                .map((item) => (item as Bookmark).url)
            )
          }}>
          Open All in New Tab Group
        </MenubarItem>
        <MenubarItem
          onClick={() => {
            tabManager.createInNewWindow(
              (item.children || [])
                .filter((item) => !isFolder(item))
                .map((item) => (item as Bookmark).url)
            )
          }}>
          Open All in New Window
        </MenubarItem>
        <MenubarItem
          onClick={() => {
            tabManager.createInNewWindow(
              (item.children || [])
                .filter((item) => !isFolder(item))
                .map((item) => (item as Bookmark).url),
              true
            )
          }}>
          Open All in Incognito Window
        </MenubarItem>

        <MenubarSeparator />

        <MenubarItem onClick={onRename}>Rename</MenubarItem>
        <MenubarItem onClick={(e) => onEdit?.(e, currentSpace)}>
          Edit Workspace Profile
        </MenubarItem>

        <MenubarItem
          onClick={async () => {
            const folder = await create({
              title: "Untitled",
              // spaceId is also folderId
              parentId: id
            })
            nextTick(() => {
              scrollToId(folder.id)
              setEditableId(folder.id)
            })
          }}>
          New Nested Folder
        </MenubarItem>

        <MenubarSeparator />

        <MenubarItem
          onClick={() => {
            if (item.children?.length) {
              setOpen(true)
            } else {
              handleDelete()
            }
          }}>
          Delete
        </MenubarItem>
      </Menu>

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Workspace?</DialogTitle>
          <DialogDescription>
            This can't be undone. This will permanently delete folders and
            bookmarks in this workspace.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
          <Button type="submit" variant="destructive" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
