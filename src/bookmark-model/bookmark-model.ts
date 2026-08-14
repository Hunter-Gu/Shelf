import { apiContentChannel, ChannelCallAPI, type CallAPI } from '~/message-channel';
import { WorkspaceType, type Workspace } from '~/workspace-model';

import { Model, read, State } from '../state';
import { toBaseFolder, treeToWorkspace } from './bookmark-workspace';
import { buildSearchTree } from './build-search-tree';
import { type Bookmark, type Folder, type RootTree, type SearchState } from './types';

export class BookmarkModel extends Model {
	public state = new State<RootTree | null>(null);
	public searchState = new State<SearchState | null>(null);

	init = async () => {
		const tree = await this._getAllBookmarks();

		this.state.refresh(tree);
	};

	private async _getAllBookmarks() {
		return (await apiContentChannel.call({ name: ChannelCallAPI.GetTree }))[0] as RootTree;
	}

	get(id: string) {
		return apiContentChannel.call({ name: ChannelCallAPI.Get, body: id });
	}

	getTreeByWorkspaceId = ({
		workspaces,
		currentWorkspace,
		tree,
	}: {
		currentWorkspace: Workspace;
		workspaces: Workspace[];
		tree: RootTree;
	}) => {
		if (!currentWorkspace.id) {
			return;
		}

		if (currentWorkspace.type === WorkspaceType.Normal) {
			return treeToWorkspace(currentWorkspace.id, tree);
		}

		const { bookmarksBar, otherBookmarks } = toBaseFolder(tree);
		const workspaceIds = workspaces.map((workspace) => workspace.id);

		if (currentWorkspace.type === WorkspaceType.BookmarksBar) {
			// find all free bookmarks, mostly created outside our product
			return this._findFreeBookmarks(bookmarksBar, workspaceIds);
		} else {
			return this._findFreeBookmarks(otherBookmarks, workspaceIds);
		}
	};

	// find all free bookmarks, mostly created outside our product
	private _findFreeBookmarks(baseFolder: Folder, workspaceIds: string[]) {
		return {
			...baseFolder,
			children: baseFolder.children?.filter((item) => !workspaceIds.includes(item.id)),
		};
	}

	search = async (query: string) => {
		const searchResult = await this._search(query);

		const tree = read(this.state);
		if (!tree || !searchResult) {
			return;
		}

		this.searchState.refresh({
			tree: buildSearchTree(tree, searchResult),
			text: query,
		});
	};

	private _search(query: string) {
		return apiContentChannel.call({ name: ChannelCallAPI.Search, body: query }) as Promise<
			Array<Folder | Bookmark>
		>;
	}

	create(item: Omit<Bookmark, 'id' | 'index'> | Omit<Folder, 'id' | 'index'>) {
		return apiContentChannel.call({ name: ChannelCallAPI.Create, body: item });
	}

	change(id: string, data: CallAPI[ChannelCallAPI.Change]['Req']['data']) {
		return apiContentChannel.call({ name: ChannelCallAPI.Change, body: { id, data } });
	}

	move(id: string, data: CallAPI[ChannelCallAPI.Move]['Req']['data']) {
		return apiContentChannel.call({ name: ChannelCallAPI.Move, body: { id, data } });
	}

	// TODO count down when remove
	remove(id: string) {
		return apiContentChannel.call({ name: ChannelCallAPI.Remove, body: id });
	}

	removeTree(id: string) {
		return apiContentChannel.call({ name: ChannelCallAPI.RemoveTree, body: id });
	}
}
