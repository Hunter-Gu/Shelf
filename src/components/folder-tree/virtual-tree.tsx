import { EmptyState } from "@astryxdesign/core/EmptyState"
import type { Virtualizer } from "@tanstack/react-virtual"
import { useFolderState } from "common/context/folder-states-context"
import { noop } from "common/utils/noop"
import { BookmarkPlus } from "lucide-react"
import { useCallback, useEffect, useRef } from "react"

import { isFolder, type Bookmark, type Folder } from "~/bookmark-model"
import {
  BookmarkDropPlaceholder,
  useBookmarkDndPreview,
  type BookmarkDropTarget
} from "~/components/bookmark-dnd"
import { BookmarkItem } from "~/components/folder-tree/bookmark-item"
import { FolderItem } from "~/components/folder-tree/folder-item"
import { FocusProvider } from "~/context/focus-context"
import { useVirtualTreeRegister } from "~/context/virtual-tree-context"

import { VIRTUAL_ROW_HEIGHT, VirtualList } from "../virtual-list"

function tree2List(tree: Folder, foldStatus: Record<string, boolean>) {
  const arr: Array<Folder | Bookmark> = []
  tree.children?.forEach((child) => {
    arr.push(child)
    if (isFolder(child) && foldStatus[child.id]) {
      arr.push(...tree2List(child, foldStatus))
    }
  })

  return arr
}

function getPaddingLeft(
  list: Array<Folder | Bookmark>,
  foldStatus: Record<string, boolean>,
  parentId?: string
) {
  let left = 0

  while (parentId && foldStatus[parentId]) {
    left += 1
    // ancestor id
    parentId = list.find((item) => item.id === parentId)?.parentId
  }

  switch (left) {
    case 1:
      return "ml-3"
    case 2:
      return "ml-6"
    case 3:
      return "ml-9"
    case 4:
      return "ml-12"
    case 5:
      return "ml-15"
    case 6:
      return "ml-18"
    case 7:
      return "ml-21"
    default:
      return ""
  }
}

const getLeftSpacingCreator = (
  list: Array<Folder | Bookmark>,
  foldStatus: Record<string, boolean>
) => {
  const cache: Record<string, string> = {}
  return function (parentId: string) {
    if (!(parentId in cache)) {
      const cls = getPaddingLeft(list, foldStatus, parentId)
      cache[parentId] = cls
    }
    return cache[parentId]
  }
}

// Where a preview target's placeholder should land in `list`'s own
// (pre-drag, unmodified) indexing — same boundary math the old
// array-splice version used, just no longer used to splice anything.
function resolveInsertionIndex(
  list: Array<Folder | Bookmark>,
  target: BookmarkDropTarget
) {
  if (!target.anchorId) return list.length

  const anchorIndex = list.findIndex((item) => item.id === target.anchorId)
  if (anchorIndex === -1) return null

  let insertionIndex = anchorIndex
  if (target.edge === "after") {
    insertionIndex += 1
    const anchor = list[anchorIndex]
    if (isFolder(anchor)) {
      const parents = new Map(list.map((item) => [item.id, item.parentId]))
      const isDescendant = (item: Folder | Bookmark) => {
        let parentId: string | undefined = item.parentId
        while (parentId) {
          if (parentId === anchor.id) return true
          parentId = parents.get(parentId)
        }
        return false
      }
      while (
        insertionIndex < list.length &&
        isDescendant(list[insertionIndex])
      ) {
        insertionIndex += 1
      }
    }
  }
  return insertionIndex
}

export function useScrollVirtualTree(list: Array<Folder | Bookmark>) {
  const register = useVirtualTreeRegister()
  const listRef = useRef(list)
  listRef.current = list
  const pendingScrollIdRef = useRef<string | null>(null)

  const virtualizerRef = useRef<Virtualizer<Element, Element>>(null)
  const scrollToId = useCallback((id: string) => {
    const index = listRef.current.findIndex((item) => item.id === id)
    if (index < 0) {
      pendingScrollIdRef.current = id
      return
    }

    pendingScrollIdRef.current = null
    virtualizerRef.current?.scrollToIndex(index, {
      align: "center"
    })
  }, [])

  useEffect(() => {
    const id = pendingScrollIdRef.current
    if (!id) return

    const index = list.findIndex((item) => item.id === id)
    if (index < 0) return

    pendingScrollIdRef.current = null
    virtualizerRef.current?.scrollToIndex(index, {
      align: "center"
    })
  }, [list])

  useEffect(() => {
    register({ scrollToId })
    return () => {
      register({ scrollToId: noop })
    }
  }, [register, scrollToId])

  return {
    scrollToId,
    virtualizerRef
  }
}

export function VirtualTree({
  tree,
  className
}: {
  tree: Folder
  className?: string
}) {
  const foldStatus = useFolderState()
  const list = tree2List(tree, foldStatus)
  const preview = useBookmarkDndPreview()
  const getLeftSpacing = getLeftSpacingCreator(list, foldStatus)
  const { virtualizerRef } = useScrollVirtualTree(list)

  if (list.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          isCompact
          icon={
            <BookmarkPlus className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          }
          title="No bookmarks yet"
          description="Drag a link in, or use the + button above to save the page you're on."
        />
      </div>
    )
  }

  // `list` itself never changes shape during a drag — the virtualizer's
  // item count and keys stay stable, so it never has to remeasure/remount
  // rows mid-drag. The landing slot is purely visual: rows at or past the
  // insertion point slide down (getItemOffset) and the dashed slot itself
  // is a stable overlay/drop target positioned by simple index arithmetic,
  // not a spliced-in list entry. When a row moves away from the pointer, the
  // slot keeps the resolved target alive instead of letting the root append
  // target take over the newly opened gap.
  const target = preview?.target
  const showPreview =
    !!target && target.zone === "workspace" && target.edge !== "inside"
  const insertionIndex = showPreview
    ? resolveInsertionIndex(list, target)
    : null

  return (
    <VirtualList
      ref={virtualizerRef}
      className={className}
      list={list}
      getItemKey={(item) => item.id}
      getItemOffset={(_item, index) =>
        insertionIndex !== null && index >= insertionIndex
          ? VIRTUAL_ROW_HEIGHT
          : 0
      }
      overlay={
        insertionIndex !== null && target ? (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: `${VIRTUAL_ROW_HEIGHT}px`,
              transform: `translateY(${insertionIndex * VIRTUAL_ROW_HEIGHT}px)`
            }}>
            <BookmarkDropPlaceholder
              target={target}
              className={getLeftSpacing(target.parentId)}
            />
          </div>
        ) : null
      }
      Row={(item) => {
        const leftSpacingClsx = getLeftSpacing(item.parentId)
        return (
          <FocusProvider>
            {isFolder(item) ? (
              <FolderItem key={item.id} {...item} className={leftSpacingClsx} />
            ) : (
              <BookmarkItem
                key={item.id}
                {...item}
                className={leftSpacingClsx}
              />
            )}
          </FocusProvider>
        )
      }}
    />
  )
}
