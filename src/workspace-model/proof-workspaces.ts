import { isFolder, toAllBookmarks, toBaseFolder, type Folder, type RootTree } from '~/bookmark-model';

import { createWorkspace, WorkspaceType, type Workspace } from './workspace';
import { workspaceName } from './workspace-name';

function matchesWorkspace(folder: Folder, workspace: Workspace) {
	if (!workspaceName.isValid(folder.title)) return false;

	return workspace.type === WorkspaceType.BookmarksBar
		? workspaceName.isHome(folder.title)
		: !workspaceName.isHome(folder.title) && workspaceName.parse(folder.title) === workspace.title;
}

// Check if a workspace still exists, and hydrate its profile data from its
// bookmark folder, which is the source of truth as of data v2.
export function proofWorkspaces(tree: RootTree, workspaces: Workspace[]) {
	if (!workspaces.length) {
		return [];
	}
	const { bookmarksBar } = toBaseFolder(tree);
	const folders = toAllBookmarks(tree).filter(isFolder);
	const foldersById = new Map(folders.map((folder) => [folder.id, folder]));
	// Only folders still carrying the workspace format are spoken for. An id
	// that resolves to some unrelated folder (ids are per-profile, so a synced
	// one can land on anything) must not lock that folder away from the
	// workspace whose title actually matches it.
	const claimedIds = new Set(
		workspaces
			.map((workspace) => workspace.id)
			.filter((id) => workspaceName.isValid(foldersById.get(id)?.title ?? '')),
	);

	return workspaces.flatMap((workspace) => {
		// Drops the Other Bookmarks workspace stored by older versions, now that
		// its content is rendered as part of Home.
		if (workspace.type !== WorkspaceType.Normal && workspace.type !== WorkspaceType.BookmarksBar) {
			return [];
		}

		// Chrome's node ids are local to a profile, so a synced workspace can come
		// back with an id that resolves to nothing — or to an entirely unrelated
		// folder. Re-adopt by title in both cases instead of dropping the
		// workspace and leaving its folder behind looking like a loose one; only
		// fall back to the id when nothing carries the expected title, which is
		// what keeps a workspace whose folder was renamed out of format.
		const byId = foldersById.get(workspace.id);
		let folder = byId && workspaceName.isValid(byId.title) ? byId : undefined;
		if (!folder) {
			folder = folders.find(
				(candidate) => !claimedIds.has(candidate.id) && matchesWorkspace(candidate, workspace),
			);
			if (folder) claimedIds.add(folder.id);
			else folder = byId;
		}

		// Home owns a folder only once its profile has been edited, and it has to
		// survive that folder being deleted or arriving late from bookmark sync,
		// so it falls back to the Bookmarks Bar root rather than disappearing.
		if (!folder) {
			return workspace.type === WorkspaceType.BookmarksBar
				? [createWorkspace({ ...workspace, id: bookmarksBar.id })]
				: [];
		}

		const hasFormattedTitle = workspaceName.isValid(folder.title);

		return [
			createWorkspace({
				...workspace,
				id: folder.id,
				title: hasFormattedTitle ? workspaceName.parse(folder.title) : workspace.title,
				logo: hasFormattedTitle ? workspaceName.parseLogo(folder.title) : workspace.logo,
			}),
		];
	});
}
