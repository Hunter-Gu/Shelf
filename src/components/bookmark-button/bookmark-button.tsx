import { cn } from "common/lib/utils"
import { IconButton } from "@astryxdesign/core/IconButton"
import type { MouseEvent } from "react"

import { useAppContext } from "~/app/app-context"
import { useCurrentTabBookmark } from "~/context/tab-bookmark-context"
import { useAutoAbort } from "~/hooks/use-auto-abort"

import {
  BookmarkCheckIcon,
  BookmarkPlusIcon,
  FileInputIcon
} from "./styled"

type BookmarkButtonProps = {
  // should be the id of a folder
  id: string
}

/**
 * 1. show add button: add current page to current folder
 * 2. show remove button: remove current page from current folder
 * 3. show move button: move current page from other folder to current folder
 */
export function BookmarkButton({ id }: BookmarkButtonProps) {
  const { bookmarks } = useAppContext()
  const { create, remove, move } = bookmarks
  const { currentTab, bookmark } = useCurrentTabBookmark()
  const switchFn = useAutoAbort()

  if (!id) {
    return null
  }

  if (!bookmark) {
    return (
      <IconButton
        label="Save current page"
        tooltip="Save current page"
        variant="ghost"
        icon={<BookmarkPlusIcon className={cn("text-gray-500 dark:text-gray-400")} />}
        onClick={async (evt: MouseEvent<HTMLButtonElement>) => {
          evt.stopPropagation()
          const { url, title = "" } = currentTab || {}
          if (!url) {
            return
          }
          switchFn(() =>
            create({
              title,
              url,
              parentId: id
            })
          )
        }} />
    )
  }

  if (bookmark.parentId === id) {
    return (
      <IconButton
        label="Remove current page"
        tooltip="Remove current page"
        variant="ghost"
        icon={<BookmarkCheckIcon className={cn("text-amber-500")} />}
        onClick={(evt: MouseEvent<HTMLButtonElement>) => {
          evt.stopPropagation()

          switchFn(() => remove(bookmark.id))
        }} />
    )
  }

  return (
    <IconButton
      label="Move current page"
      tooltip="Move current page"
      variant="ghost"
      icon={<FileInputIcon className={cn("text-amber-500")} />}
      onClick={(evt: MouseEvent<HTMLButtonElement>) => {
        evt.stopPropagation()

        switchFn(() =>
          move(bookmark.id, {
            parentId: id
          })
        )
      }} />
  )
}
