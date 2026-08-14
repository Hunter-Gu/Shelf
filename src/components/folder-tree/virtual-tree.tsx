import type { Virtualizer } from "@tanstack/react-virtual"
import { useFolderState } from "common/context/folder-states-context"
import { noop } from "common/utils/noop"
import { useCallback, useEffect, useRef } from "react"

import { isFolder, type Bookmark, type Folder } from "~/bookmark-model"
import { BookmarkItem } from "~/components/folder-tree/bookmark-item"
import { FolderItem } from "~/components/folder-tree/folder-item"
import { FocusProvider } from "~/context/focus-context"
import { useVirtualTreeRegister } from "~/context/virtual-tree-context"

import { VirtualList } from "../virtual-list"

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

  const getLeftSpacing = getLeftSpacingCreator(list, foldStatus)
  const { virtualizerRef } = useScrollVirtualTree(list)

  return (
    <VirtualList
      ref={virtualizerRef}
      className={className}
      list={list}
      getItemKey={(item) => item.id}
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
