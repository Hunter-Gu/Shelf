import { ChannelCallAPI, type CallHandler } from '~/message-channel';

export class TabAPI {
	[ChannelCallAPI.Query]: CallHandler<ChannelCallAPI.Query> = (params) => {
		return chrome.tabs.query(params);
	};

	[ChannelCallAPI.TabCreate]: CallHandler<ChannelCallAPI.TabCreate> = (params) => {
		return chrome.tabs.create(params);
	};

	[ChannelCallAPI.TabGroup]: CallHandler<ChannelCallAPI.TabGroup> = (params) => {
		return chrome.tabs.group(params);
	};

	[ChannelCallAPI.TabUpdate]: CallHandler<ChannelCallAPI.TabUpdate> = ({ id, data }) => {
		return chrome.tabs.update(id, data);
	};

	[ChannelCallAPI.TabGroupsUpdate]: CallHandler<ChannelCallAPI.TabGroupsUpdate> = ({
		groupId,
		data,
	}) => {
		return chrome.tabGroups.update(groupId, data);
	};

	[ChannelCallAPI.WindowCreate]: CallHandler<ChannelCallAPI.WindowCreate> = (data) => {
		return chrome.windows.create(data);
	};
}
