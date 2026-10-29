import { AlertDialog } from "@astryxdesign/core/AlertDialog"

import { BookmarkTreeUtils, isFolder, type Folder } from "~/bookmark-model"

function countBookmarks(folder: Pick<Folder, "children">) {
  let count = 0
  BookmarkTreeUtils.walk(folder as Folder, (item) => {
    if (!isFolder(item)) count += 1
  })
  return count
}

type DeleteConfirmDialogProps = {
  isOpen: boolean
  folder: Pick<Folder, "title" | "children">
  /** What the folder is called in the question, e.g. a space's own name. */
  name?: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmDialog({
  isOpen,
  folder,
  name = folder.title,
  onConfirm,
  onCancel
}: DeleteConfirmDialogProps) {
  const count = countBookmarks(folder)

  return (
    <AlertDialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
      width="min(360px, calc(100vw - 32px))"
      title={`Delete "${name}"?`}
      description={`The folder${
        count ? ` and its ${count} bookmark${count === 1 ? "" : "s"}` : ""
      } will be removed from Chrome. This can't be undone.`}
      actionLabel="Delete"
      onAction={onConfirm}
    />
  )
}
