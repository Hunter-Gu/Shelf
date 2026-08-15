import { isFolder, toAllBookmarks, toBaseFolder, type RootTree } from '~/bookmark-model';

import { createWorkspace, WorkspaceType, type Workspace } from './workspace';
import { workspaceName } from './workspace-name';

// check if a workspace still exist
export function proofWorkspaces(tree: RootTree, workspaces: Workspace[]) {
	if (!workspaces.length) {
		return [];
	}
	const { bookmarksBar, otherBookmarks } = toBaseFolder(tree);
	const bookmarksById = new Map(toAllBookmarks(tree).map((item) => [item.id, item]));
	const childrenIds = [...bookmarksById.keys()];
	const potentialWorkspaceId = childrenIds.concat([bookmarksBar.id, otherBookmarks.id]);

	// Filter removed workspaces and hydrate normal workspace profile data from
	// its bookmark folder, which is the source of truth as of data v2.
	return workspaces
		.filter((workspace) => potentialWorkspaceId.includes(workspace.id))
		.map((workspace) => {
			if (workspace.type !== WorkspaceType.Normal) return workspace;

			const folder = bookmarksById.get(workspace.id);
			if (!folder || !isFolder(folder) || !workspaceName.isValid(folder.title)) {
				return workspace;
			}

			return createWorkspace({
				...workspace,
				title: workspaceName.parse(folder.title),
				logo: workspaceName.parseLogo(folder.title),
			});
		});
}
