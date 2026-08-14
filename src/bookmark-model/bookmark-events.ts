import { apiContentChannel, ChannelAttachAPI } from '~/message-channel';

import type { BookmarkModel } from '.';
import { BookmarkTreeUtils } from './bookmark-tree-utils';
import type { Bookmark, Folder } from './types';

export class BookmarkEvents {
	private get _state() {
		return this.bookmarkModel.state;
	}

	constructor(private bookmarkModel: BookmarkModel) {}

	private _refreshTree() {
		this.bookmarkModel.init();
	}

	private async _refreshSubTree(parentId: string) {
		const children = await chrome.bookmarks.getChildren(parentId);
		this._state.produce((draft) => {
			BookmarkTreeUtils.reorder(draft, {
				id: parentId,
				childIds: children.map((child) => child.id),
			});
		});
	}

	onCreated() {
		return apiContentChannel.attach({ name: ChannelAttachAPI.OnCreated }, ({ bookmark }) => {
			this._state.produce((draft) => {
				BookmarkTreeUtils.add(draft, bookmark as Folder | Bookmark);
			});
			if (bookmark.parentId) {
				this._refreshSubTree(bookmark.parentId);
			}
		});
	}

	onChanged() {
		return apiContentChannel.attach({ name: ChannelAttachAPI.OnChanged }, ({ id, changeInfo }) => {
			this._state.produce((draft) => {
				BookmarkTreeUtils.change(draft, {
					id,
					...changeInfo,
				});
			});
		});
	}

	onChildrenReordered() {
		return apiContentChannel.attach(
			{ name: ChannelAttachAPI.OnChildrenReordered },
			({ id, reorderInfo }) => {
				this._state.produce((draft) => {
					BookmarkTreeUtils.reorder(draft, {
						id: id,
						childIds: reorderInfo.childIds,
					});
				});
			},
		);
	}

	onMoved() {
		return apiContentChannel.attach({ name: ChannelAttachAPI.OnMoved }, () => {
			this._refreshTree();
		});
	}

	onRemoved() {
		return apiContentChannel.attach({ name: ChannelAttachAPI.OnRemoved }, ({ removeInfo }) => {
			this._state.produce((draft) => {
				BookmarkTreeUtils.remove(draft, removeInfo);
			});
			this._refreshSubTree(removeInfo.parentId);
		});
	}
}
