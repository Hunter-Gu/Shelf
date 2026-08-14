import type { RootTree } from '~/bookmark-model';
import { toAllBookmarks, toBaseFolder } from '~/bookmark-model';

import type { Workspace } from './workspace';

// check if a workspace still exist
export function proofWorkspaces(tree: RootTree, workspaces: Workspace[]) {
	if (!workspaces.length) {
		return [];
	}
	const { bookmarksBar, otherBookmarks } = toBaseFolder(tree);
	const childrenIds = toAllBookmarks(tree).map((item) => item.id);
	const potentialWorkspaceId = childrenIds.concat([bookmarksBar.id, otherBookmarks.id]);

	// filter not existed workspaces
	return workspaces.filter((workspace) => potentialWorkspaceId.includes(workspace.id));
}
