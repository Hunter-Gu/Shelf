import { apiContentChannel, ChannelCallAPI, type CallAPI } from '~/message-channel';

export class TabManager {
	getCurrentActive() {
		return this.query({ active: true, currentWindow: true }).then((tabs) => {
			return tabs[0];
		});
	}

	create(
		params: CallAPI[ChannelCallAPI.TabCreate]['Req'],
	): CallAPI[ChannelCallAPI.TabCreate]['Res'];
	create(
		urls: string[],
		params?: Omit<CallAPI[ChannelCallAPI.TabCreate]['Req'], 'active' | 'selected'>,
	): Promise<Awaited<CallAPI[ChannelCallAPI.TabCreate]['Res']>[]>;
	create(
		params1: string[] | CallAPI[ChannelCallAPI.TabCreate]['Req'],
		params2?: Omit<CallAPI[ChannelCallAPI.TabCreate]['Req'], 'active' | 'selected'>,
	): Promise<unknown> {
		if (Array.isArray(params1)) {
			return params1.length
				? Promise.all(
						params1.map((url, index) =>
							this.create({
								...params2,
								url,
								// active first tab
								active: !index,
							}),
						),
					)
				: Promise.resolve([]);
		} else {
			return this._create(params1);
		}
	}

	async createInGroup(title: string, urls: string[] | string) {
		urls = Array.isArray(urls) ? urls : [urls];

		if (!urls.length) {
			return;
		}

		const tabs = await this.create(urls);
		const groupId = await this.group({
			tabIds: tabs.map((tab) => tab.id).filter(Boolean) as number[],
		});

		await apiContentChannel.call({
			name: ChannelCallAPI.TabGroupsUpdate,
			body: {
				groupId,
				data: {
					title,
				},
			},
		});

		return groupId;
	}

	async createInNewWindow(url: string | string[], incognito?: boolean) {
		return apiContentChannel.call({
			name: ChannelCallAPI.WindowCreate,
			body: {
				url,
				incognito,
			},
		});
	}

	async replace(params: CallAPI[ChannelCallAPI.TabUpdate]['Req']['data']) {
		const current = await this.getCurrentActive();

		// can't navigation
		return this.update(current.id!, {
			...params,
		});
	}

	private _create(data: CallAPI[ChannelCallAPI.TabCreate]['Req']) {
		return apiContentChannel.call({
			name: ChannelCallAPI.TabCreate,
			body: data,
		});
	}

	query(params: CallAPI[ChannelCallAPI.Query]['Req']) {
		return apiContentChannel.call({
			name: ChannelCallAPI.Query,
			body: params,
		});
	}

	update(id: number, data: CallAPI[ChannelCallAPI.TabUpdate]['Req']['data']) {
		return apiContentChannel.call({
			name: ChannelCallAPI.TabUpdate,
			body: {
				id,
				data,
			},
		});
	}

	group(data: CallAPI[ChannelCallAPI.TabGroup]['Req']) {
		return apiContentChannel.call({
			name: ChannelCallAPI.TabGroup,
			body: data,
		});
	}
}

export const tabManager = new TabManager();
