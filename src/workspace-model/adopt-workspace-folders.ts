import { isFolder, toAllBookmarks, toBaseFolder, type RootTree } from '~/bookmark-model';

import { createWorkspace, WorkspaceType, type Workspace } from './workspace';
import { workspaceName } from './workspace-name';

// Folders carrying the workspace title format are the source of truth for which
// workspaces exist, so a device holding the folders but not the stored list (a
// fresh install that syncs bookmarks first) still finds them, as does one whose
// stored entry was lost. Any folder left under Other Bookmarks by an older
// version moves up to the Bookmarks Bar, since Other Bookmarks now renders as
// part of Home instead of as a workspace of its own.
export async function adoptWorkspaceFolders(
	tree: RootTree,
	workspaces: Workspace[],
	moveBookmark: (id: string, details: { parentId: string }) => Promise<unknown>,
) {
	const { bookmarksBar, otherBookmarks } = toBaseFolder(tree);
	const folders = toAllBookmarks(tree).filter(isFolder);
	const claimedIds = new Set(workspaces.map((workspace) => workspace.id));
	const storedHome = workspaces.find((workspace) => workspace.type === WorkspaceType.BookmarksBar);
	let adoptedHome: Workspace | undefined;
	const adopted: Workspace[] = [];

	for (const folder of folders) {
		if (claimedIds.has(folder.id) || !workspaceName.isValid(folder.title)) continue;

		if (workspaceName.isHome(folder.title)) {
			if (storedHome || adoptedHome) continue;
			adoptedHome = createWorkspace({
				id: folder.id,
				title: workspaceName.parse(folder.title),
				logo: workspaceName.parseLogo(folder.title),
				type: WorkspaceType.BookmarksBar,
			});
			continue;
		}

		adopted.push(
			createWorkspace({
				id: folder.id,
				title: workspaceName.parse(folder.title),
				logo: workspaceName.parseLogo(folder.title),
			}),
		);
	}

	// Home always exists. Until its profile is edited it owns no folder and
	// simply points at the Bookmarks Bar root.
	const next = storedHome
		? [...workspaces, ...adopted]
		: [
				adoptedHome ??
					createWorkspace({
						id: bookmarksBar.id,
						title: workspaceName.home,
						logo: '',
						type: WorkspaceType.BookmarksBar,
					}),
				...workspaces,
				...adopted,
			];

	const foldersById = new Map(folders.map((folder) => [folder.id, folder]));
	for (const workspace of next) {
		if (foldersById.get(workspace.id)?.parentId === otherBookmarks.id) {
			// A folder can disappear between reading the tree and moving it (another
			// window, another device), which must not leave the panel stuck loading.
			await moveBookmark(workspace.id, { parentId: bookmarksBar.id }).catch(
				(error: unknown) => {
					console.error('Failed to move a workspace folder to the Bookmarks Bar', error);
				},
			);
		}
	}

	return next;
}
