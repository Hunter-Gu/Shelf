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
