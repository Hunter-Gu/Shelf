export enum WorkspaceType {
	BookmarksBar,
	OtherBookmarks,
	Normal,
}
export interface IWorkspace {
	id: string;
	logo: string;
	title: string;
	theme?: string;
	windowId?: string;
	type?: WorkspaceType;
}

export type Workspace = Omit<IWorkspace, "type"> & {
	type: WorkspaceType;
};

export function createWorkspace(workspace: IWorkspace): Workspace {
	return {
		id: workspace.id,
		logo: workspace.logo,
		title: workspace.title,
		theme: workspace.theme,
		windowId: workspace.windowId,
		type: workspace.type ?? WorkspaceType.Normal,
	};
}
