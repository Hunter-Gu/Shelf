export type AttachHandler<CallName extends keyof AttachAPI> = (
	arg: AttachAPI[CallName]['Req'],
	sendResponse: (resp: AttachAPI[CallName]['Res']) => void,
) => () => void;

/**
 * !! enum's key should equal to value !!
 */
export enum ChannelAttachAPI {
	OnCreated = 'OnCreated',
	OnChanged = 'OnChanged',
	OnChildrenReordered = 'OnChildrenReordered',
	OnMoved = 'OnMoved',
	OnRemoved = 'OnRemoved',
	// tabs
	OnTabActivatedOrUpdated = 'OnTabActivatedOrUpdated',
}

export type AttachAPI = {
	[ChannelAttachAPI.OnCreated]: {
		Req: void;
		Res: {
			id: string;
			bookmark: chrome.bookmarks.BookmarkTreeNode;
		};
	};
	[ChannelAttachAPI.OnChanged]: {
		Req: void;
		Res: {
			id: string;
			changeInfo: chrome.bookmarks.BookmarkChangeInfo;
		};
	};
	[ChannelAttachAPI.OnChildrenReordered]: {
		Req: void;
		Res: {
			id: string;
			reorderInfo: chrome.bookmarks.BookmarkReorderInfo;
		};
	};
	[ChannelAttachAPI.OnMoved]: {
		Req: void;
		Res: {
			id: string;
			moveInfo: chrome.bookmarks.BookmarkMoveInfo & chrome.bookmarks.BookmarkTreeNode;
		};
	};
	[ChannelAttachAPI.OnRemoved]: {
		Req: void;
		Res: {
			id: string;
			removeInfo: chrome.bookmarks.BookmarkRemoveInfo;
		};
	};
	[ChannelAttachAPI.OnTabActivatedOrUpdated]: {
		Req: void;
		Res: chrome.tabs.Tab;
	};
};

export enum ChannelAttach {}

export type Attach = {};
