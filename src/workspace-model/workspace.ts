// Values are persisted, so they stay pinned: 1 was OtherBookmarks, dropped when
// Other Bookmarks was folded into Home's view, and Normal must keep reading
// back as 2 for workspaces stored before that.
export enum WorkspaceType {
  BookmarksBar = 0,
  Normal = 2
}

// Astryx's categorical hue palette (theme-neutral's --color-{background,border,icon,text}-{hue}
// tokens) — each space picks one so its accent stays correct in both light and dark mode.
export const WORKSPACE_HUES = [
  "gray",
  "red",
  "orange",
  "yellow",
  "green",
  "teal",
  "cyan",
  "blue",
  "purple",
  "pink"
] as const
export type WorkspaceHue = (typeof WORKSPACE_HUES)[number]

export interface IWorkspace {
  id: string
  logo: string
  title: string
  color?: WorkspaceHue
  windowId?: string
  isPinsCollapsed?: boolean
  type?: WorkspaceType
}

export type Workspace = Omit<IWorkspace, "isPinsCollapsed" | "type"> & {
  isPinsCollapsed: boolean
  type: WorkspaceType
}

const HOME_DEFAULT_LOGO = "🏠"

export function createWorkspace(workspace: IWorkspace): Workspace {
  const type = workspace.type ?? WorkspaceType.Normal

  return {
    id: workspace.id,
    logo:
      type === WorkspaceType.BookmarksBar && !workspace.logo.trim()
        ? HOME_DEFAULT_LOGO
        : workspace.logo,
    title: workspace.title,
    color: workspace.color,
    windowId: workspace.windowId,
    isPinsCollapsed: workspace.isPinsCollapsed ?? false,
    type
  }
}
