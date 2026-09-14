import { browser } from "wxt/browser"
import { storage } from "wxt/utils/storage"

import { createWorkspace, WorkspaceType, type Workspace } from "../workspace"
import { workspaceName } from "../workspace-name"

export type StoredWorkspace = Workspace
type LegacyWorkspaceV1 = Omit<Workspace, "isPinsCollapsed">
type StoredWorkspaceV2 = Omit<Workspace, "isPinsCollapsed" | "logo">
type StoredWorkspaceV3 = Omit<Workspace, "logo">

// v1 (unversioned — wxt treats a stored value with no recorded version as
// v1): plain Workspace[], logo included.
// v2: logo moved out of storage into the bookmark folder's title (see
// workspaceName.format) for Normal workspaces — re-derived from the folder
// title on read (see proof-workspaces.ts), so it didn't need to be
// duplicated here.
// v3: each workspace stores whether its pinned bookmarks are collapsed.
// v4: logo restored to storage. Home and the since-removed Other pseudo-
// workspaces had no bookmark folder of their own to encode a logo into, so v2
// silently dropped any emoji set on them the next time storage was read — the
// sidepanel remounting was enough to trigger it. Workspaces backed by a folder
// treat its title as authoritative (proofWorkspaces overwrites logo/title from
// it when present); storing logo here still covers Home before its first
// profile edit, which is when it gets a folder of its own.
const workspaceStorageItem = storage.defineItem<StoredWorkspace[]>(
  "sync:workspaces",
  {
    version: 4,
    migrations: {
      2: async (legacyWorkspaces: LegacyWorkspaceV1[]) => {
        for (const workspace of legacyWorkspaces) {
          if (workspace.type !== WorkspaceType.Normal || !workspace.logo) continue

          const [folder] = await browser.bookmarks
            .get(workspace.id)
            .catch(() => [])
          if (!folder) continue

          const nextTitle = workspaceName.format(workspace.title, workspace.logo)
          if (folder.title !== nextTitle) {
            await browser.bookmarks.update(workspace.id, { title: nextTitle })
          }
        }

        return legacyWorkspaces.map(({ logo: _logo, ...rest }) => rest)
      },
      3: (workspaces: StoredWorkspaceV2[]) =>
        workspaces.map((workspace) => ({
          ...workspace,
          isPinsCollapsed: false
        })),
      4: (workspaces: StoredWorkspaceV3[]) =>
        workspaces.map((workspace) => ({
          ...workspace,
          logo: ""
        }))
    },
    fallback: []
  }
)

export const workspaceStorage = {
  async getValue() {
    const stored = await workspaceStorageItem.getValue()
    return stored.map((workspace) => createWorkspace(workspace))
  },

  setValue(workspaces: Workspace[]) {
    return workspaceStorageItem.setValue(workspaces.map(createWorkspace))
  },

  watch(callback: (workspaces: Workspace[]) => void) {
    return workspaceStorageItem.watch((stored) => {
      callback((stored ?? []).map((workspace) => createWorkspace(workspace)))
    })
  }
}

// The active workspace is a device-local preference, unlike the workspace
// list itself (which is synced), so it lives in `local` rather than `sync`.
const currentWorkspaceIdItem = storage.defineItem<string>(
  "local:currentWorkspaceId",
  { fallback: "" }
)

export const currentWorkspaceStorage = {
  getValue() {
    return currentWorkspaceIdItem.getValue()
  },
  setValue(id: string) {
    return currentWorkspaceIdItem.setValue(id)
  }
}
