import { browser } from "wxt/browser"
import { storage } from "wxt/utils/storage"

import { createWorkspace, WorkspaceType, type Workspace } from "../workspace"
import { workspaceName } from "../workspace-name"

export type StoredWorkspace = Omit<Workspace, "logo">
type LegacyWorkspaceV1 = Omit<Workspace, "isPinsCollapsed">
type StoredWorkspaceV2 = Omit<StoredWorkspace, "isPinsCollapsed">

// v1 (unversioned — wxt treats a stored value with no recorded version as
// v1): plain Workspace[], logo included.
// v2: logo moved out of storage into the bookmark folder's title (see
// workspaceName.format), so it doesn't need to be duplicated here — it's
// re-derived from the folder title on read (see proof-workspaces.ts).
// v3: each workspace stores whether its pinned bookmarks are collapsed.
const workspaceStorageItem = storage.defineItem<StoredWorkspace[]>(
  "sync:workspaces",
  {
    version: 3,
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
        }))
    },
    fallback: []
  }
)

export const workspaceStorage = {
  async getValue() {
    const stored = await workspaceStorageItem.getValue()
    return stored.map((workspace) => createWorkspace({ ...workspace, logo: "" }))
  },

  setValue(workspaces: Workspace[]) {
    return workspaceStorageItem.setValue(
      workspaces.map(({ logo: _logo, ...rest }) => rest)
    )
  },

  watch(callback: (workspaces: Workspace[]) => void) {
    return workspaceStorageItem.watch((stored) => {
      callback(
        (stored ?? []).map((workspace) => createWorkspace({ ...workspace, logo: "" }))
      )
    })
  }
}
