import { apiContentChannel, ChannelAttachAPI, type AttachAPI } from '~/message-channel';
import type { State } from '~/state';

import { tabManager } from './tab-manager';

export class TabEvents {
	constructor(
		private state: State<AttachAPI[ChannelAttachAPI.OnTabActivatedOrUpdated]['Res'] | null>,
	) {
		this._init();
	}

	private async _init() {
		const tab = await tabManager.getCurrentActive();
		this.state.refresh(tab);
	}

	onActivatedAndUpdated() {
		return apiContentChannel.attach({ name: ChannelAttachAPI.OnTabActivatedOrUpdated }, (tab) => {
			this.state.refresh(tab);
		});
	}
}
