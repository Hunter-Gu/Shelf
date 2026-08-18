import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { browser } from "wxt/browser"

import {
  isFolder,
  toBaseFolder,
  toWorkspaceParentId,
  type Folder,
  type RootTree
} from "~/bookmark-model"
import { proofWorkspaces } from "~/workspace-model/proof-workspaces"
import {
  currentWorkspaceStorage,
  workspaceStorage
} from "~/workspace-model/storage/workspace-storage"
import {
  createWorkspace,
  WorkspaceType,
  type IWorkspace,
  type Workspace,
  type WorkspaceHue
} from "~/workspace-model/workspace"
import { workspaceName } from "~/workspace-model/workspace-name"

function sameWorkspaces(left: Workspace[], right: Workspace[]) {
  return (
    left.length === right.length &&
    left.every((workspace, index) => {
      const other = right[index]
      return (
        workspace.id === other?.id &&
        workspace.title === other.title &&
        workspace.logo === other.logo &&
        workspace.color === other.color &&
        workspace.windowId === other.windowId &&
        workspace.isPinsCollapsed === other.isPinsCollapsed &&
        workspace.type === other.type
      )
    })
  )
}

function workspaceSnapshotKey(workspaces: Workspace[]) {
  // Storage used to always report logo as "" (see workspace-storage.ts), so
  // this excluded it to keep persist()'s pre-write key comparable to
  // watch()'s post-write key. Now that logo round-trips through storage for
  // every workspace type, both sides include real values symmetrically.
  return JSON.stringify(workspaces.map(createWorkspace))
}

export function useWorkspaces({
  tree,
  createBookmark,
  changeBookmark,
  moveBookmark,
  removeBookmark,
  removeBookmarkTree
}: {
  tree: RootTree | null
  createBookmark: (
    details: Parameters<typeof browser.bookmarks.create>[0]
  ) => Promise<{ id: string }>
  changeBookmark: (
    id: string,
    details: Parameters<typeof browser.bookmarks.update>[1]
  ) => Promise<unknown>
  moveBookmark: (
    id: string,
    details: Parameters<typeof browser.bookmarks.move>[1]
  ) => Promise<unknown>
  removeBookmark: (id: string) => Promise<void>
  removeBookmarkTree: (id: string) => Promise<void>
}) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>(() =>
    createWorkspace({ id: "", title: "", logo: "" })
  )
  const [ready, setReady] = useState(false)
  const workspacesRef = useRef(workspaces)
  const treeRef = useRef(tree)
  const initializedRef = useRef(false)
  const initializingRef = useRef(false)
  const pendingStorageRef = useRef<Workspace[] | null>(null)
  const localStorageWritesRef = useRef<string[]>([])
  const persistQueueRef = useRef(Promise.resolve())
  workspacesRef.current = workspaces
  treeRef.current = tree

  const persist = useCallback((nextWorkspaces: Workspace[]) => {
    const snapshot = nextWorkspaces.map(createWorkspace)
    const key = workspaceSnapshotKey(snapshot)
    if (!localStorageWritesRef.current.includes(key)) {
      localStorageWritesRef.current.push(key)
      if (localStorageWritesRef.current.length > 32) {
        localStorageWritesRef.current.shift()
      }
    }

    const write = persistQueueRef.current.then(() =>
      workspaceStorage.setValue(snapshot)
    )
    persistQueueRef.current = write.catch(() => {})
    return write
  }, [])

  useEffect(
    () =>
      workspaceStorage.watch((saved) => {
        const restored = saved.map(createWorkspace)
        const next = treeRef.current
          ? proofWorkspaces(treeRef.current, restored)
          : restored
        const key = workspaceSnapshotKey(next)
        const localWriteIndex = localStorageWritesRef.current.indexOf(key)
        if (localWriteIndex !== -1) {
          localStorageWritesRef.current.splice(localWriteIndex, 1)
          return
        }

        if (!initializedRef.current) {
          pendingStorageRef.current = next
          return
        }

        if (sameWorkspaces(workspacesRef.current, next)) return

        workspacesRef.current = next
        setWorkspaces(next)
        setCurrentWorkspace(
          (active) =>
            next.find((workspace) => workspace.id === active.id) ??
            next[next.length - 1] ??
            createWorkspace({ id: "", title: "", logo: "" })
        )
      }),
    []
  )

  const workspaceParentId = tree ? toWorkspaceParentId(tree) : ""

  const initialize = useCallback(async () => {
    const currentTree = treeRef.current
    if (!currentTree) return

    if (!initializedRef.current) {
      if (initializingRef.current) return
      initializingRef.current = true

      try {
        const saved = await workspaceStorage.getValue().catch((error: unknown) => {
          // Never let a bad stored value hang the app in "not ready" forever
          // — fall back to re-deriving workspaces from the bookmark tree below.
          console.error("Failed to read workspace storage", error)
          return []
        })
        const savedCurrentId = await currentWorkspaceStorage
          .getValue()
          .catch(() => "")
        const latestTree = treeRef.current
        if (!latestTree) return

        let next = pendingStorageRef.current
          ? pendingStorageRef.current
          : proofWorkspaces(latestTree, saved.map(createWorkspace))
        pendingStorageRef.current = null
        if (!next.length) {
          const { bookmarksBar, otherBookmarks } = toBaseFolder(latestTree)
          next = [
            createWorkspace({
              id: bookmarksBar.id,
              title: workspaceName.home,
              logo: "",
              type: WorkspaceType.BookmarksBar
            }),
            createWorkspace({
              id: otherBookmarks.id,
              title: workspaceName.other,
              logo: "",
              type: WorkspaceType.OtherBookmarks
            }),
            ...[bookmarksBar, otherBookmarks].flatMap((baseFolder) =>
              (baseFolder.children ?? [])
                .filter(
                  (item) => isFolder(item) && workspaceName.isValid(item.title)
                )
                .map((item) =>
                  createWorkspace({
                    id: item.id,
                    title: workspaceName.parse(item.title),
                    logo: workspaceName.parseLogo(item.title)
                  })
                )
            )
          ]
          await persist(next)
        }

        if (pendingStorageRef.current) {
          next = pendingStorageRef.current
          pendingStorageRef.current = null
        }

        workspacesRef.current = next
        setWorkspaces(next)
        setCurrentWorkspace(
          (current) =>
            next.find((workspace) => workspace.id === savedCurrentId) ??
            next.find((workspace) => workspace.id === current.id) ??
            next[0] ??
            createWorkspace({ id: "", title: "", logo: "" })
        )
        initializedRef.current = true
        setReady(true)
      } finally {
        initializingRef.current = false
      }
      return
    }

    const current = workspacesRef.current
    const next = proofWorkspaces(currentTree, current)
    if (sameWorkspaces(current, next)) return

    workspacesRef.current = next
    setWorkspaces(next)
    setCurrentWorkspace(
      (active) =>
        next.find((workspace) => workspace.id === active.id) ??
        next[next.length - 1] ??
        createWorkspace({ id: "", title: "", logo: "" })
    )
    await persist(next)
  }, [persist])

  useEffect(() => {
    void initialize()
  }, [initialize, tree])

  const update = useCallback(
    async (id: string, updater: (workspace: Workspace) => void) => {
      if (!initializedRef.current) return

      const current = workspacesRef.current
      if (!current.some((workspace) => workspace.id === id)) return

      const next = current.map((workspace) => {
        if (workspace.id !== id) return workspace
        const copy = createWorkspace(workspace)
        updater(copy)
        return copy
      })
      const previous = current.find((workspace) => workspace.id === id)!
      const changed = next.find((workspace) => workspace.id === id)!
      if (
        changed.type === WorkspaceType.Normal &&
        (previous.type !== WorkspaceType.Normal ||
          changed.title !== previous.title ||
          changed.logo !== previous.logo)
      ) {
        await changeBookmark(id, {
          title: workspaceName.format(changed.title, changed.logo)
        })
      }
      workspacesRef.current = next
      setWorkspaces(next)
      setCurrentWorkspace(
        (current) =>
          next.find((workspace) => workspace.id === current.id) ?? current
      )
      await persist(next)
    },
    [changeBookmark, persist]
  )

  const create = useCallback(
    async ({ title, ...rest }: Omit<IWorkspace, "id">) => {
      if (!initializedRef.current || !workspaceParentId) return null

      const folder = await createBookmark({
        parentId: workspaceParentId,
        title: workspaceName.format(title, rest.logo)
      })
      const workspace = createWorkspace({ id: folder.id, title, ...rest })
      const next = [...workspacesRef.current, workspace]
      workspacesRef.current = next
      setWorkspaces(next)
      setCurrentWorkspace(workspace)
      await persist(next)
      return workspace
    },
    [createBookmark, persist, workspaceParentId]
  )

  const turnToSpace = useCallback(
    async ({
      id,
      parentId,
      title,
      color
    }: {
      id: string
      parentId: string
      title: string
      color?: WorkspaceHue
    }) => {
      if (!initializedRef.current) return

      const nextTitle = title.trim() || "Untitled"
      if (parentId !== workspaceParentId) {
        await moveBookmark(id, { parentId: workspaceParentId })
      }
      if (workspacesRef.current.some((workspace) => workspace.id === id)) {
        await update(id, (workspace) => {
          workspace.title = nextTitle
          workspace.color = color
          workspace.type = WorkspaceType.Normal
        })
      } else {
        await changeBookmark(id, { title: workspaceName.format(nextTitle) })
        const workspace = createWorkspace({
          id,
          title: nextTitle,
          logo: "",
          color,
          type: WorkspaceType.Normal
        })
        const next = [...workspacesRef.current, workspace]
        workspacesRef.current = next
        setWorkspaces(next)
        setCurrentWorkspace(workspace)
        await persist(next)
      }
    },
    [changeBookmark, moveBookmark, persist, update, workspaceParentId]
  )

  const moveOutOfSpace = useCallback(
    async (id: string, targetWorkspaceId: string) => {
      if (!initializedRef.current) return

      const target = workspacesRef.current.find(
        (workspace) => workspace.id === id
      )
      if (!target || target.type !== WorkspaceType.Normal) return
      if (
        !workspacesRef.current.some(
          (workspace) => workspace.id === targetWorkspaceId
        )
      ) {
        return
      }
      if (targetWorkspaceId === id) return

      await moveBookmark(id, { parentId: targetWorkspaceId })
      await changeBookmark(id, { title: target.title })

      const next = workspacesRef.current.filter(
        (workspace) => workspace.id !== id
      )
      workspacesRef.current = next
      setWorkspaces(next)
      setCurrentWorkspace((current) =>
        current.id === id
          ? (next.find((workspace) => workspace.id === targetWorkspaceId) ??
            next[0] ??
            createWorkspace({ id: "", title: "", logo: "" }))
          : current
      )
      await persist(next)
    },
    [changeBookmark, moveBookmark, persist]
  )

  const remove = useCallback(
    async (id: string) => {
      if (!initializedRef.current) return

      const current = workspacesRef.current
      const target = current.find((workspace) => workspace.id === id)
      if (!target) return

      try {
        if (target.type === WorkspaceType.Normal) {
          await removeBookmarkTree(id)
        } else if (treeRef.current) {
          const { bookmarksBar, otherBookmarks } = toBaseFolder(
            treeRef.current
          )
          const baseFolder =
            target.type === WorkspaceType.BookmarksBar
              ? bookmarksBar
              : otherBookmarks
          const workspaceIds = new Set(current.map((workspace) => workspace.id))
          await Promise.all(
            (baseFolder.children ?? [])
              .filter((item) => !workspaceIds.has(item.id))
              .map((item) =>
                isFolder(item)
                  ? removeBookmarkTree(item.id)
                  : removeBookmark(item.id)
              )
          )
        }
      } catch (error) {
        // The underlying bookmark folder may already be gone (e.g. deleted
        // from another window/device just before this ran). Leave local
        // state and storage untouched rather than dropping the workspace
        // from the UI while the deletion itself never went through.
        console.error("Failed to delete workspace bookmarks", error)
        return
      }

      const next = current.filter((workspace) => workspace.id !== id)
      workspacesRef.current = next
      setWorkspaces(next)
      setCurrentWorkspace((active) =>
        active.id === id
          ? (next[next.length - 1] ??
            createWorkspace({ id: "", title: "", logo: "" }))
          : active
      )
      await persist(next)
    },
    [persist, removeBookmark, removeBookmarkTree]
  )

  const reorder = useCallback(
    async (next: Workspace[]) => {
      if (!initializedRef.current) return

      workspacesRef.current = next
      setWorkspaces(next)
      await persist(next)
    },
    [persist]
  )

  const switchTo = useCallback((id: string) => {
    const next = workspacesRef.current.find((workspace) => workspace.id === id)
    if (next) {
      setCurrentWorkspace(next)
      void currentWorkspaceStorage.setValue(id).catch(() => {})
    }
  }, [])

  return useMemo(
    () => ({
      workspaces,
      currentWorkspace,
      ready,
      update,
      create,
      turnToSpace,
      moveOutOfSpace,
      remove,
      reorder,
      switch: switchTo
    }),
    [
      workspaces,
      currentWorkspace,
      ready,
      update,
      create,
      turnToSpace,
      moveOutOfSpace,
      remove,
      reorder,
      switchTo
    ]
  )
}
