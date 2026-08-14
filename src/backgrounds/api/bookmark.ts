import { ChannelCallAPI, type CallHandler } from '~/message-channel';

export class BookmarkAPI {
	[ChannelCallAPI.GetTree]: CallHandler<ChannelCallAPI.GetTree> = () => {
		return chrome.bookmarks.getTree();
	};

	[ChannelCallAPI.Get]: CallHandler<ChannelCallAPI.Get> = async (id: string) => {
		const [bookmark] = await chrome.bookmarks.get(id);
		return bookmark;
	};

	[ChannelCallAPI.Search]: CallHandler<ChannelCallAPI.Search> = async (query: string) => {
		return chrome.bookmarks.search(query);
	};

	[ChannelCallAPI.Create]: CallHandler<ChannelCallAPI.Create> = (param) => {
		return chrome.bookmarks.create(param);
	};

	[ChannelCallAPI.Change]: CallHandler<ChannelCallAPI.Change> = ({
		id,
		data,
	}: {
		id: string;
		data: chrome.bookmarks.BookmarkChangesArg;
	}) => {
		return chrome.bookmarks.update(id, data);
	};

	[ChannelCallAPI.Move]: CallHandler<ChannelCallAPI.Move> = ({
		id,
		data,
	}: {
		id: string;
		data: chrome.bookmarks.BookmarkDestinationArg;
	}) => {
		return chrome.bookmarks.move(id, data);
	};

	[ChannelCallAPI.Remove]: CallHandler<ChannelCallAPI.Remove> = (id: string) => {
		return chrome.bookmarks.remove(id);
	};

	[ChannelCallAPI.RemoveTree]: CallHandler<ChannelCallAPI.RemoveTree> = async (id: string) => {
		return chrome.bookmarks.removeTree(id);
	};
}
