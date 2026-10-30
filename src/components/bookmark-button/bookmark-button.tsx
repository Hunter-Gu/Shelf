import { IconButton } from "@astryxdesign/core/IconButton"
import { cn } from "common/lib/utils"
import type { MouseEvent } from "react"

import { useAppContext } from "~/app/app-context"
import { useCurrentTabBookmark } from "~/context/tab-bookmark-context"
import { useAutoAbort } from "~/hooks/use-auto-abort"

import { BookmarkIcon } from "./styled"

type BookmarkButtonProps = {
  // should be the id of a folder
  id: string
  onSaved?: (bookmark: { id: string; url: string; parentId: string }) => void
}

/**
 * Folder-level relationship of the current page to this folder:
 * - not bookmarked: gray outline, click to save here
 * - bookmarked elsewhere: amber outline, click to move here
 * - bookmarked in this folder: amber filled, click to remove
 *
 * Hidden for favorited pages. A pinned page is only actionable when its
 * source lives in another workspace: moving it here also unpins it.
 */
export function BookmarkButton({ id, onSaved }: BookmarkButtonProps) {
  const { bookmarks, pins, workspace } = useAppContext()
  const { create, remove, move } = bookmarks
  const { currentTab, bookmark, workspaceId } = useCurrentTabBookmark()
  const switchFn = useAutoAbort()

  if (!id) {
    return null
  }

  const currentUrl = currentTab?.url
  const isFavorited = !!currentUrl && pins.isFavorite(currentUrl)
  const isPinned = !!currentUrl && pins.isPinned(currentUrl)

  if (isFavorited) {
    return null
  }

  if (isPinned) {
    const isSameWorkspace = workspaceId === workspace.currentWorkspace.id
    if (isSameWorkspace || !bookmark || !currentUrl) {
      return null
    }

    return (
      <IconButton
        label="Move current page"
        tooltip="Move current page"
        variant="ghost"
        icon={<BookmarkIcon fill="none" className={cn("text-amber-500")} />}
        onClick={(evt: MouseEvent<HTMLButtonElement>) => {
          evt.stopPropagation()
          switchFn(async () => {
            await move(bookmark.id, { parentId: id })
            await pins.unpin(currentUrl)
          })
        }}
      />
    )
  }

  if (!bookmark) {
    return (
      <IconButton
        label="Save current page"
        tooltip="Save current page"
        variant="ghost"
        icon={
          <BookmarkIcon
            fill="none"
            className={cn("text-gray-500 dark:text-gray-400")}
          />
        }
        onClick={async (evt: MouseEvent<HTMLButtonElement>) => {
          evt.stopPropagation()
          const { url, title = "" } = currentTab || {}
          if (!url) {
            return
          }
          const created = await switchFn(() =>
            create({
              title,
              url,
              parentId: id
            })
          )
          onSaved?.({ id: created.id, url, parentId: id })
        }}
      />
    )
  }

  if (bookmark.parentId === id) {
    return (
      <IconButton
        label="Remove current page"
        tooltip="Remove current page"
        variant="ghost"
        icon={
          <BookmarkIcon fill="currentColor" className={cn("text-amber-500")} />
        }
        onClick={(evt: MouseEvent<HTMLButtonElement>) => {
          evt.stopPropagation()

          switchFn(() => remove(bookmark.id))
        }}
      />
    )
  }

  return (
    <IconButton
      label="Move current page"
      tooltip="Move current page"
      variant="ghost"
      icon={<BookmarkIcon fill="none" className={cn("text-amber-500")} />}
      onClick={(evt: MouseEvent<HTMLButtonElement>) => {
        evt.stopPropagation()

        switchFn(() =>
          move(bookmark.id, {
            parentId: id
          })
        )
      }}
    />
  )
}
