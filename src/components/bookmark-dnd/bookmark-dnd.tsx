import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type RefObject
} from "react"
import {
  useDrag,
  useDragDropManager,
  useDrop,
  type ConnectDragSource,
  type ConnectDropTarget,
  type DropTargetMonitor
} from "react-dnd"
import { getEmptyImage } from "react-dnd-html5-backend"

import { useAppContext } from "~/app/app-context"
import { isFolder, type Bookmark, type Folder } from "~/bookmark-model"

import { applyBookmarkDrop } from "./apply-bookmark-drop"
import { BookmarkDragOverlay } from "./bookmark-drag-overlay"
import {
  BOOKMARK_DND_TYPE,
  canDropBookmarkItem,
  findFolderById,
  isSameDropPosition,
  ownChildCount,
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
  canDropAt: (source: BookmarkDragItem, target: BookmarkDropTarget) => boolean
  updatePreview: (source: BookmarkDragItem, target: BookmarkDropTarget) => void
  clearPreview: () => void
}

const BookmarkDndContext = createContext<BookmarkDndContextValue | null>(null)

export type BookmarkDndPreview = {
  source: BookmarkDragItem
  target: BookmarkDropTarget
}

const BookmarkDndPreviewContext = createContext<BookmarkDndPreview | null>(null)

function samePreview(
  current: BookmarkDndPreview | null,
  source: BookmarkDragItem,
  target: BookmarkDropTarget
) {
  return (
    current?.source.id === source.id &&
    current.source.zone === source.zone &&
    current.target.zone === target.zone &&
    current.target.parentId === target.parentId &&
    current.target.index === target.index &&
    current.target.edge === target.edge &&
    current.target.anchorId === target.anchorId
  )
}

function useBookmarkDndPreviewState() {
  const [preview, setPreview] = useState<BookmarkDndPreview | null>(null)
  const updatePreview = useCallback(
    (source: BookmarkDragItem, target: BookmarkDropTarget) => {
      setPreview((current) => {
        // The source row already occupies both boundaries immediately around
        // itself, so opening another slot there would promise a move that is
        // actually a no-op.
        if (source.zone === target.zone && isSameDropPosition(source, target)) {
          return null
        }
        return samePreview(current, source, target)
          ? current
          : { source, target }
      })
    },
    []
  )
  const clearPreview = useCallback(() => setPreview(null), [])

  return { preview, updatePreview, clearPreview }
}

function useClearPreviewOutsideDropTargets(
  hasPreview: boolean,
  clearPreview: () => void
) {
  const manager = useDragDropManager()
  const hasPreviewRef = useRef(hasPreview)
  hasPreviewRef.current = hasPreview

  useEffect(() => {
    const monitor = manager.getMonitor()
    let clearTimer: ReturnType<typeof setTimeout> | null = null
    const cancelScheduledClear = () => {
      if (clearTimer === null) return
      clearTimeout(clearTimer)
      clearTimer = null
    }

    const unsubscribe = monitor.subscribeToStateChange(() => {
      if (!monitor.isDragging() || !hasPreviewRef.current) {
        cancelScheduledClear()
        return
      }

      const hasValidTarget = monitor
        .getTargetIds()
        .some((targetId) => monitor.canDropOnTarget(targetId))
      if (hasValidTarget) {
        cancelScheduledClear()
        return
      }

      // Structural placeholders unregister one target and register its
      // replacement during the same visual update. Clearing synchronously in
      // that gap made the placeholder repeatedly disappear and reappear even
      // while the pointer had not crossed another insertion boundary.
      if (clearTimer !== null) return
      clearTimer = setTimeout(() => {
        clearTimer = null
        if (!monitor.isDragging() || !hasPreviewRef.current) return
        const stillHasValidTarget = monitor
          .getTargetIds()
          .some((targetId) => monitor.canDropOnTarget(targetId))
        if (!stillHasValidTarget) clearPreview()
      }, 64)
    })

    return () => {
      cancelScheduledClear()
      unsubscribe()
    }
  }, [clearPreview, manager])
}

export function BookmarkDndProvider({
  workspaceTree,
  children
}: PropsWithChildren<{ workspaceTree: Folder | null }>) {
  const { bookmarks, pins } = useAppContext()
  const { preview, updatePreview, clearPreview } = useBookmarkDndPreviewState()
  useClearPreviewOutsideDropTargets(preview !== null, clearPreview)
  const getWorkspaceChildCount = useCallback(
    (folderId: string) =>
      findFolderById(workspaceTree, folderId)?.children?.length ?? 0,
    [workspaceTree]
  )
  const canDropAt = useCallback(
    (source: BookmarkDragItem, target: BookmarkDropTarget) =>
      canDropBookmarkItem(source, target, workspaceTree),
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

  const contextValue = useMemo(
    () => ({
      applyDrop,
      canDropAt,
      getWorkspaceChildCount,
      workspaceRoot: workspaceTree,
      updatePreview,
      clearPreview
    }),
    [
      applyDrop,
      canDropAt,
      clearPreview,
      getWorkspaceChildCount,
      updatePreview,
      workspaceTree
    ]
  )

  return (
    <BookmarkDndContext.Provider value={contextValue}>
      <BookmarkDndPreviewContext.Provider value={preview}>
        {children}
        <BookmarkDragOverlay />
      </BookmarkDndPreviewContext.Provider>
    </BookmarkDndContext.Provider>
  )
}

export function useBookmarkDndPreview() {
  return useContext(BookmarkDndPreviewContext)
}

export function useWorkspaceChildCount(folderId: string) {
  return useBookmarkDndContext().getWorkspaceChildCount(folderId)
}

export function useWorkspaceRootDrop(ref: RefObject<HTMLElement | null>) {
  const { canDropAt, workspaceRoot, updatePreview } = useBookmarkDndContext()
  const target = resolveAppendDropTarget(
    "workspace",
    workspaceRoot?.id ?? "",
    ownChildCount(workspaceRoot)
  )
  const targetRef = useRef(target)
  targetRef.current = target
  const [{ isOver }, drop] = useDrop<
    BookmarkDragItem,
    BookmarkDropTarget,
    { isOver: boolean }
  >(
    () => ({
      accept: BOOKMARK_DND_TYPE,
      canDrop: (item) => !!ref.current && canDropAt(item, targetRef.current),
      hover(item, monitor) {
        if (
          !ref.current ||
          !targetRef.current.parentId ||
          !monitor.isOver({ shallow: true })
        ) {
          return
        }
        if (canDropAt(item, targetRef.current)) {
          updatePreview(item, targetRef.current)
        }
      },
      drop(item, monitor) {
        if (
          monitor.didDrop() ||
          !ref.current ||
          !canDropAt(item, targetRef.current)
        ) {
          return undefined
        }
        return targetRef.current
      },
      // The root only renders a hover treatment. In particular, do not
      // collect canDrop here: changing it at drag start used to rerender the
      // virtualized workspace while its source row was being picked up.
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }) && monitor.canDrop()
      })
    }),
    [canDropAt, ref, updatePreview]
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
  const { applyDrop, clearPreview } = useBookmarkDndContext()
  const applyDropRef = useRef(applyDrop)
  applyDropRef.current = applyDrop
  const sourceRef = useRef(source)
  sourceRef.current = source
  const [{ isDragging }, drag, dragPreview] = useDrag<
    BookmarkDragItem,
    BookmarkDropTarget,
    { isDragging: boolean }
  >(
    () => ({
      type: BOOKMARK_DND_TYPE,
      item: () => sourceRef.current,
      end(item, monitor) {
        const target = monitor.getDropResult<BookmarkDropTarget>()
        clearPreview()
        if (!target) return
        void applyDropRef.current(item, target).catch((error: unknown) => {
          console.error("Failed to apply bookmark drop", error)
        })
      },
      collect: (monitor) => ({ isDragging: monitor.isDragging() })
    }),
    [clearPreview]
  )

  useEffect(() => {
    dragPreview(getEmptyImage(), { captureDraggingState: true })
  }, [dragPreview])

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
  const { canDropAt, updatePreview } = useBookmarkDndContext()
  const resolveTargetRef = useRef(resolveTarget)
  resolveTargetRef.current = resolveTarget
  const [{ isOver, canDrop, edge }, drop] = useDrop<
    BookmarkDragItem,
    BookmarkDropTarget,
    {
      isOver: boolean
      canDrop: boolean
      edge?: BookmarkDropEdge
    }
  >(
    () => ({
      accept: BOOKMARK_DND_TYPE,
      canDrop(item, monitor) {
        if (!ref.current) return false
        return canDropAt(item, resolveTargetRef.current(ref.current, monitor))
      },
      hover(item, monitor) {
        if (!ref.current || !monitor.isOver({ shallow: true })) return
        const target = resolveTargetRef.current(ref.current, monitor)
        if (!canDropAt(item, target)) return
        updatePreview(item, target)
      },
      drop(item, monitor) {
        if (monitor.didDrop() || !ref.current) return undefined
        const target = resolveTargetRef.current(ref.current, monitor)
        return canDropAt(item, target) ? target : undefined
      },
      collect(monitor) {
        const canDrop = monitor.canDrop()
        const isOver = monitor.isOver({ shallow: true }) && canDrop
        const target =
          isOver && ref.current
            ? resolveTargetRef.current(ref.current, monitor)
            : undefined
        return { isOver, canDrop, edge: target?.edge }
      }
    }),
    [canDropAt, ref, updatePreview]
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
      edge: "inside",
      anchorId: item.id
    }
  }

  const isAfter = ratio > 0.5
  return {
    zone,
    parentId: item.parentId,
    index: item.index + (isAfter ? 1 : 0),
    edge: isAfter ? "after" : "before",
    anchorId: item.id
  }
}

export function resolveAppendDropTarget(
  zone: BookmarkZone,
  parentId: string,
  index: number
): BookmarkDropTarget {
  return { zone, parentId, index, edge: "append" }
}
