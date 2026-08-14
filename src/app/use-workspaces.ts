import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { browser } from "wxt/browser"
import { storage } from "wxt/utils/storage"

import {
  isFolder,
  toBaseFolder,
  toWorkspaceParentId,
  type Folder,
  type RootTree
} from "~/bookmark-model"
import { proofWorkspaces } from "~/workspace-model/proof-workspaces"
import {
  createWorkspace,
  WorkspaceType,
  type IWorkspace,
  type Workspace
} from "~/workspace-model/workspace"
import { workspaceName } from "~/workspace-model/workspace-name"

const workspaceStorage = storage.defineItem<Workspace[]>("sync:workspaces", {
  fallback: []
})

function sameWorkspaces(left: Workspace[], right: Workspace[]) {
  return (
    left.length === right.length &&
    left.every((workspace, index) => {
      const other = right[index]
      return (
        workspace.id === other?.id &&
        workspace.title === other.title &&
        workspace.logo === other.logo &&
        workspace.theme === other.theme &&
        workspace.windowId === other.windowId &&
        workspace.type === other.type
      )
    })
  )
}

function workspaceSnapshotKey(workspaces: Workspace[]) {
  return JSON.stringify(workspaces)
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
        const next = saved.map(createWorkspace)
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
        const saved = await workspaceStorage.getValue()
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
                    logo: ""
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
      workspacesRef.current = next
      setWorkspaces(next)
      setCurrentWorkspace(
        (current) =>
          next.find((workspace) => workspace.id === current.id) ?? current
      )
      await persist(next)
    },
    [persist]
  )

  const create = useCallback(
    async ({ title, ...rest }: Omit<IWorkspace, "id">) => {
      if (!initializedRef.current || !workspaceParentId) return null

      const folder = await createBookmark({
        parentId: workspaceParentId,
        title: workspaceName.format(title)
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
      theme = ""
    }: {
      id: string
      parentId: string
      title: string
      theme?: string
    }) => {
      if (!initializedRef.current) return

      const nextTitle = title.trim() || "Untitled"
      await changeBookmark(id, { title: workspaceName.format(nextTitle) })
      if (parentId !== workspaceParentId) {
        await moveBookmark(id, { parentId: workspaceParentId })
      }
      if (workspacesRef.current.some((workspace) => workspace.id === id)) {
        await update(id, (workspace) => {
          workspace.title = nextTitle
          workspace.theme = theme
          workspace.type = WorkspaceType.Normal
        })
      } else {
        const workspace = createWorkspace({
          id,
          title: nextTitle,
          logo: "",
          theme,
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

  const remove = useCallback(
    async (id: string) => {
      if (!initializedRef.current) return

      const current = workspacesRef.current
      const target = current.find((workspace) => workspace.id === id)
      if (!target) return

      const next = current.filter((workspace) => workspace.id !== id)
      workspacesRef.current = next
      setWorkspaces(next)
      setCurrentWorkspace((current) =>
        current.id === id
          ? (next[next.length - 1] ??
            createWorkspace({ id: "", title: "", logo: "" }))
          : current
      )

      if (target.type === WorkspaceType.Normal) {
        await removeBookmarkTree(id)
      } else if (treeRef.current) {
        const { bookmarksBar, otherBookmarks } = toBaseFolder(treeRef.current)
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
    if (next) setCurrentWorkspace(next)
  }, [])

  return useMemo(
    () => ({
      workspaces,
      currentWorkspace,
      ready,
      update,
      create,
      turnToSpace,
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
      remove,
      reorder,
      switchTo
    ]
  )
}
