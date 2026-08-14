import { ChannelAttachAPI, type AttachHandler } from '~/message-channel';

export class TabEvents {
	[ChannelAttachAPI.OnTabActivatedOrUpdated]: AttachHandler<ChannelAttachAPI.OnTabActivatedOrUpdated> =
		(data, sendResponse) => {
			const handler = async ({ tabId }: chrome.tabs.TabActiveInfo) => {
				const tab = await chrome.tabs.get(tabId);

				sendResponse(tab);
			};

			const handleUpdate = (tabId: number, changeInfo: unknown, tab: chrome.tabs.Tab) => {
				if (tab.active) {
					sendResponse(tab);
				}
			};
			chrome.tabs.onUpdated.addListener(handleUpdate);

			chrome.tabs.onActivated.addListener(handler);

			return () => {
				chrome.tabs.onActivated.removeListener(handler);
				chrome.tabs.onUpdated.removeListener(handleUpdate);
			};
		};
}
