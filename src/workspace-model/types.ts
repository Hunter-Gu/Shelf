import type { Workspace } from './workspace';

export type WorkspaceState = {
	workspaces: Workspace[];
	current: Workspace;
};
