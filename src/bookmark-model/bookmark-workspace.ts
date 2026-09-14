import type { Folder, RootTree } from '~/bookmark-model';

export function toBaseFolder(tree: RootTree) {
	const [bookmarksBar, otherBookmarks] = tree.children || [];

	return {
		bookmarksBar,
		otherBookmarks,
	};
}

// set bookmarks bar as default folder
export function toWorkspaceParentId(tree: RootTree) {
	const { bookmarksBar } = toBaseFolder(tree);

	return bookmarksBar.id;
}

export function toAllBookmarks(tree: RootTree) {
	const { bookmarksBar, otherBookmarks } = toBaseFolder(tree);

	return (bookmarksBar.children || []).concat(otherBookmarks.children || []);
}

export function treeToWorkspace(workspaceId: number | string, tree: RootTree) {
	const bookmarks = toAllBookmarks(tree);

	return bookmarks.find((item) => item.id === workspaceId) as Folder | null;
}

// Home shows everything that isn't filed under a workspace: the contents of its
// own folder once it has one, plus whatever sits loose in either root. Other
// Bookmarks has no space of its own — it renders here.
export function toHomeTree(tree: RootTree, homeId: string, hiddenIds: Set<string>): Folder {
	const { bookmarksBar, otherBookmarks } = toBaseFolder(tree);
	const homeFolder = treeToWorkspace(homeId, tree);
	const loose = (folder: Folder) =>
		(folder.children ?? []).filter((item) => !hiddenIds.has(item.id));

	return {
		...(homeFolder ?? bookmarksBar),
		children: [...(homeFolder?.children ?? []), ...loose(bookmarksBar), ...loose(otherBookmarks)],
	};
}
