export type CallHandler<CallName extends keyof CallAPI> = (
	arg: CallAPI[CallName]['Req'],
) => CallAPI[CallName]['Res'];

/**
 * !! enum's key should equal to value !!
 */
export enum ChannelCallAPI {
	GetTree = 'GetTree',
	Get = 'Get',
	Search = 'Search',
	Create = 'Create',
	Change = 'Change',
	Move = 'Move',
	Remove = 'Remove',
	RemoveTree = 'RemoveTree',
	// tab
	Query = 'Query',
	TabCreate = 'TabCreate',
	TabGroup = 'TabGroup',
	TabUpdate = 'TabUpdate',
	// tab groups
	TabGroupsUpdate = 'TabGroupsUpdate',
	// windows
	WindowCreate = 'WindowCreate',
}

export type CallAPI = {
	[ChannelCallAPI.GetTree]: {
		Req: void;
		Res: Promise<chrome.bookmarks.BookmarkTreeNode[]>;
	};
	[ChannelCallAPI.Get]: {
		Req: string;
		Res: Promise<chrome.bookmarks.BookmarkTreeNode>;
	};
	[ChannelCallAPI.Search]: {
		Req: string;
		Res: Promise<chrome.bookmarks.BookmarkTreeNode[]>;
	};
	[ChannelCallAPI.Create]: {
		Req: chrome.bookmarks.BookmarkCreateArg;
		Res: Promise<chrome.bookmarks.BookmarkTreeNode>;
	};
	[ChannelCallAPI.Change]: {
		Req: {
			id: string;
			data: chrome.bookmarks.BookmarkChangesArg;
		};
		Res: Promise<chrome.bookmarks.BookmarkTreeNode>;
	};
	[ChannelCallAPI.Move]: {
		Req: {
			id: string;
			data: chrome.bookmarks.BookmarkDestinationArg;
		};
		Res: Promise<chrome.bookmarks.BookmarkTreeNode>;
	};
	[ChannelCallAPI.Remove]: {
		Req: string;
		Res: Promise<void>;
	};
	[ChannelCallAPI.RemoveTree]: {
		Req: string;
		Res: Promise<void>;
	};
	// tab
	[ChannelCallAPI.Query]: {
		Req: chrome.tabs.QueryInfo;
		Res: Promise<chrome.tabs.Tab[]>;
	};
	[ChannelCallAPI.TabCreate]: {
		Req: chrome.tabs.CreateProperties;
		Res: Promise<chrome.tabs.Tab>;
	};
	[ChannelCallAPI.TabGroup]: {
		Req: chrome.tabs.GroupOptions;
		Res: Promise<number>;
	};
	[ChannelCallAPI.TabUpdate]: {
		Req: {
			id: number;
			data: chrome.tabs.UpdateProperties;
		};
		Res: Promise<chrome.tabs.Tab>;
	};
	[ChannelCallAPI.TabGroupsUpdate]: {
		Req: {
			groupId: number;
			data: chrome.tabGroups.UpdateProperties;
		};
		Res: Promise<chrome.tabGroups.TabGroup>;
	};
	// windows
	[ChannelCallAPI.WindowCreate]: {
		Req: chrome.windows.CreateData;
		Res: Promise<chrome.windows.Window>;
	};
};

export enum ChannelCall {}

export type Call = {};
