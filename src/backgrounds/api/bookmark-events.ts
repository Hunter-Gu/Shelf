import { ChannelAttachAPI, type AttachHandler } from '~/message-channel';

export class ChromeBookmarkEvents {
	[ChannelAttachAPI.OnCreated]: AttachHandler<ChannelAttachAPI.OnCreated> = (
		data,
		sendResponse,
	) => {
		const handler = (id: string, bookmark: chrome.bookmarks.BookmarkTreeNode) => {
			sendResponse({ id, bookmark });
		};
		chrome.bookmarks.onCreated.addListener(handler);
		return () => chrome.bookmarks.onCreated.removeListener(handler);
	};

	[ChannelAttachAPI.OnChanged]: AttachHandler<ChannelAttachAPI.OnChanged> = (
		data,
		sendResponse,
	) => {
		const handler = (id: string, changeInfo: chrome.bookmarks.BookmarkChangeInfo) => {
			sendResponse({ id, changeInfo });
		};
		chrome.bookmarks.onChanged.addListener(handler);
		return () => chrome.bookmarks.onChanged.removeListener(handler);
	};

	[ChannelAttachAPI.OnChildrenReordered]: AttachHandler<ChannelAttachAPI.OnChildrenReordered> = (
		data,
		sendResponse,
	) => {
		const handler = (id: string, reorderInfo: chrome.bookmarks.BookmarkReorderInfo) => {
			sendResponse({ id, reorderInfo });
		};
		chrome.bookmarks.onChildrenReordered.addListener(handler);
		return () => chrome.bookmarks.onChildrenReordered.removeListener(handler);
	};

	[ChannelAttachAPI.OnMoved]: AttachHandler<ChannelAttachAPI.OnMoved> = (data, sendResponse) => {
		const handler = async (id: string, moveInfo: chrome.bookmarks.BookmarkMoveInfo) => {
			const [bookmark] = await chrome.bookmarks.get(id);
			sendResponse({
				id,
				moveInfo: {
					...bookmark,
					...moveInfo,
				},
			});
		};
		chrome.bookmarks.onMoved.addListener(handler);
		return () => chrome.bookmarks.onMoved.removeListener(handler);
	};

	[ChannelAttachAPI.OnRemoved]: AttachHandler<ChannelAttachAPI.OnRemoved> = (
		data,
		sendResponse,
	) => {
		const handler = (id: string, removeInfo: chrome.bookmarks.BookmarkRemoveInfo) => {
			sendResponse({ id, removeInfo });
		};
		chrome.bookmarks.onRemoved.addListener(handler);
		return () => chrome.bookmarks.onRemoved.removeListener(handler);
	};

	onSync() {
		// TODO
		chrome.bookmarks.onImportBegan;

		chrome.bookmarks.onImportEnded;
	}
}
