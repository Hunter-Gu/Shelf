export enum WorkspaceType {
	BookmarksBar,
	OtherBookmarks,
	Normal,
}

// Astryx's categorical hue palette (theme-neutral's --color-{background,border,icon,text}-{hue}
// tokens) — each space picks one so its accent stays correct in both light and dark mode.
export const WORKSPACE_HUES = [
	"gray", "red", "orange", "yellow", "green", "teal", "cyan", "blue", "purple", "pink",
] as const;
export type WorkspaceHue = (typeof WORKSPACE_HUES)[number];

export interface IWorkspace {
	id: string;
	logo: string;
	title: string;
	color?: WorkspaceHue;
	windowId?: string;
	isPinsCollapsed?: boolean;
	type?: WorkspaceType;
}

export type Workspace = Omit<IWorkspace, "isPinsCollapsed" | "type"> & {
	isPinsCollapsed: boolean;
	type: WorkspaceType;
};

export function createWorkspace(workspace: IWorkspace): Workspace {
	return {
		id: workspace.id,
		logo: workspace.logo,
		title: workspace.title,
		color: workspace.color,
		windowId: workspace.windowId,
		isPinsCollapsed: workspace.isPinsCollapsed ?? false,
		type: workspace.type ?? WorkspaceType.Normal,
	};
}
