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

export class Workspace implements IWorkspace {
	// in fact, it is folder id
	id = '';

	logo = '';

	title = '';

	theme: string | undefined = '';

	windowId: string | undefined = undefined;

	type = WorkspaceType.Normal;

	static from(workspace: IWorkspace) {
		const newWorkspace = new Workspace();
		newWorkspace.logo = workspace.logo;
		newWorkspace.id = workspace.id;
		newWorkspace.title = workspace.title;
		newWorkspace.theme = workspace.theme;
		newWorkspace.windowId = workspace.windowId;
		newWorkspace.type = workspace.type ?? WorkspaceType.Normal;

		return newWorkspace;
	}

	static updateProfile(draft: Workspace, { name, theme }: { name: string; theme: string }) {
		draft.title = name;
		draft.theme = theme;
	}
}
