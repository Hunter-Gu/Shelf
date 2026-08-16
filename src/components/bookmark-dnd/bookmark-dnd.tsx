import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type PropsWithChildren,
  type RefObject
} from "react"
import {
  useDrag,
  useDrop,
  type ConnectDragSource,
  type ConnectDropTarget,
  type DropTargetMonitor
} from "react-dnd"

import { useAppContext } from "~/app/app-context"
import { isFolder, type Bookmark, type Folder } from "~/bookmark-model"

import { applyBookmarkDrop } from "./apply-bookmark-drop"
import {
  BOOKMARK_DND_TYPE,
  type BookmarkDragItem,
  type BookmarkDropEdge,
  type BookmarkDropTarget,
  type BookmarkZone
} from "./bookmark-drop"

type BookmarkDndContextValue = {
  applyDrop: (
    source: BookmarkDragItem,
    target: BookmarkDropTarget
  ) => Promise<void>
  getWorkspaceChildCount: (folderId: string) => number
  workspaceRoot: Folder | null
}

const BookmarkDndContext = createContext<BookmarkDndContextValue | null>(null)

function findFolderById(folder: Folder | null, id: string): Folder | null {
  if (!folder) return null
  if (folder.id === id) return folder

  for (const child of folder.children ?? []) {
    if (!isFolder(child)) continue
    const match = findFolderById(child, id)
    if (match) return match
  }
  return null
}

export function BookmarkDndProvider({
  workspaceTree,
  children
}: PropsWithChildren<{ workspaceTree: Folder | null }>) {
  const { bookmarks, pins } = useAppContext()
  const getWorkspaceChildCount = useCallback(
    (folderId: string) =>
      findFolderById(workspaceTree, folderId)?.children?.length ?? 0,
    [workspaceTree]
  )

  const applyDrop = useCallback(
    (source: BookmarkDragItem, target: BookmarkDropTarget) =>
      applyBookmarkDrop({
        source,
        target,
        workspaceTree,
        operations: {
          createBookmark: bookmarks.create,
          moveBookmark: bookmarks.move,
          movePin: pins.movePin,
          moveFavorite: pins.moveFavorite,
          placePin: pins.placePin,
          placeFavorite: pins.placeFavorite,
          removePinsByUrl: pins.removePinsByUrl,
          removeFavoritesByUrl: pins.removeFavoritesByUrl
        }
      }),
    [bookmarks.create, bookmarks.move, pins, workspaceTree]
  )

  return (
    <BookmarkDndContext.Provider
      value={{
        applyDrop,
        getWorkspaceChildCount,
        workspaceRoot: workspaceTree
      }}>
      {children}
    </BookmarkDndContext.Provider>
  )
}

export function useWorkspaceChildCount(folderId: string) {
  return useBookmarkDndContext().getWorkspaceChildCount(folderId)
}

export function useWorkspaceRootDrop(ref: RefObject<HTMLElement | null>) {
  const { workspaceRoot } = useBookmarkDndContext()
  const target = resolveAppendDropTarget(
    "workspace",
    workspaceRoot?.id ?? "",
    workspaceRoot?.children?.length ?? 0
  )
  const targetRef = useRef(target)
  targetRef.current = target
  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: BOOKMARK_DND_TYPE,
      canDrop: () => !!ref.current && !!targetRef.current.parentId,
      drop(_item, monitor) {
        if (monitor.didDrop() || !ref.current) return undefined
        return targetRef.current
      },
      // The root only renders a hover treatment. In particular, do not
      // collect canDrop here: changing it at drag start used to rerender the
      // virtualized workspace while its source row was being picked up.
      collect: (monitor) => ({ isOver: monitor.isOver({ shallow: true }) })
    }),
    [ref]
  )

  return { drop, isOver }
}

function useBookmarkDndContext() {
  const value = useContext(BookmarkDndContext)
  if (!value) {
    throw new Error(
      "Bookmark DnD hooks must be used inside BookmarkDndProvider"
    )
  }
  return value
}

export function useBookmarkDrag(source: BookmarkDragItem): {
  drag: ConnectDragSource
  isDragging: boolean
} {
  const { applyDrop } = useBookmarkDndContext()
  const applyDropRef = useRef(applyDrop)
  applyDropRef.current = applyDrop
  const sourceRef = useRef(source)
  sourceRef.current = source
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: BOOKMARK_DND_TYPE,
      item: () => sourceRef.current,
      end(item, monitor) {
        const target = monitor.getDropResult<BookmarkDropTarget>()
        if (!target) return
        void applyDropRef.current(item, target).catch((error: unknown) => {
          console.error("Failed to apply bookmark drop", error)
        })
      },
      collect: (monitor) => ({ isDragging: monitor.isDragging() })
    }),
    []
  )

  return { drag, isDragging }
}

type ResolveDropTarget = (
  element: HTMLElement,
  monitor: DropTargetMonitor<BookmarkDragItem>
) => BookmarkDropTarget

export function useBookmarkDrop(
  ref: RefObject<HTMLElement | null>,
  resolveTarget: ResolveDropTarget
): {
  drop: ConnectDropTarget
  isOver: boolean
  canDrop: boolean
  edge?: BookmarkDropEdge
} {
  const resolveTargetRef = useRef(resolveTarget)
  resolveTargetRef.current = resolveTarget
  const [{ isOver, canDrop, edge }, drop] = useDrop(
    () => ({
      accept: BOOKMARK_DND_TYPE,
      canDrop(_item, monitor) {
        return (
          !!ref.current &&
          !!resolveTargetRef.current(ref.current, monitor).parentId
        )
      },
      drop(_item, monitor) {
        if (monitor.didDrop() || !ref.current) return undefined
        return resolveTargetRef.current(ref.current, monitor)
      },
      collect(monitor) {
        const isOver = monitor.isOver({ shallow: true })
        const canDrop = monitor.canDrop()
        const target =
          isOver && ref.current
            ? resolveTargetRef.current(ref.current, monitor)
            : undefined
        return { isOver, canDrop, edge: target?.edge }
      }
    }),
    [ref, resolveTargetRef]
  )

  return { drop, isOver, canDrop, edge }
}

export function resolveRowDropTarget({
  element,
  monitor,
  zone,
  item,
  childCount = 0,
  axis = "vertical",
  allowInside = false
}: {
  element: HTMLElement
  monitor: DropTargetMonitor<BookmarkDragItem>
  zone: BookmarkZone
  item: Bookmark | Folder
  childCount?: number
  axis?: "horizontal" | "vertical"
  allowInside?: boolean
}): BookmarkDropTarget {
  const rect = element.getBoundingClientRect()
  const pointer = monitor.getClientOffset()
  const position = axis === "horizontal" ? (pointer?.x ?? 0) : (pointer?.y ?? 0)
  const start = axis === "horizontal" ? rect.left : rect.top
  const size = axis === "horizontal" ? rect.width : rect.height
  const ratio = size > 0 ? (position - start) / size : 0

  if (allowInside && isFolder(item) && ratio >= 0.25 && ratio <= 0.75) {
    return {
      zone,
      parentId: item.id,
      index: childCount,
      edge: "inside"
    }
  }

  const isAfter = ratio > 0.5
  return {
    zone,
    parentId: item.parentId,
    index: item.index + (isAfter ? 1 : 0),
    edge: isAfter ? "after" : "before"
  }
}

export function resolveAppendDropTarget(
  zone: BookmarkZone,
  parentId: string,
  index: number
): BookmarkDropTarget {
  return { zone, parentId, index, edge: "append" }
}
