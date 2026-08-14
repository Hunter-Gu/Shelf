import { BookmarkTreeUtils } from './bookmark-tree-utils';
import { toBaseFolder } from './bookmark-workspace';
import { isFolder, type Bookmark, type Folder, type RootTree } from './types';

function buildMap(tree: RootTree) {
	const map = new Map<string, string>();

	BookmarkTreeUtils.walk(tree, (item) => {
		map.set(item.id, item.parentId);
	});

	return map;
}
function buildSearchMap(searchResult: Array<Folder | Bookmark>, bookmarksMap: Map<string, string>) {
	const map = new Map<string, boolean>();

	searchResult.forEach((item) => {
		let id: string | undefined = item.id;

		while (id) {
			map.set(id, true);
			const parentId = bookmarksMap.get(id);
			id = parentId;
		}
	});

	return map;
}

function buildTree(tree: RootTree, searchMap: Map<string, boolean>): RootTree {
	const buildBaseFolder = (baseFolder: Folder | Bookmark) => {
		const item = { ...baseFolder };

		if (isFolder(item)) {
			item.children = item.children
				?.filter((child) => {
					return searchMap.has(child.id);
				})
				.map((child) => buildBaseFolder(child));
		}

		return item;
	};

	const { bookmarksBar, otherBookmarks } = toBaseFolder(tree);

	return {
		...tree,
		children: [buildBaseFolder(bookmarksBar), buildBaseFolder(otherBookmarks)],
	};
}

export function buildSearchTree(tree: RootTree, searchResult: Array<Folder | Bookmark>) {
	const bookmarksMap = buildMap(tree);
	const searchMap = buildSearchMap(searchResult, bookmarksMap);
	return buildTree(tree, searchMap);
}
