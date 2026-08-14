import type { PlasmoCSConfig } from 'plasmo';

import { ChannelEvent, contentChannel } from '../message-channel';

export const getDarkModeMatcher = () => window.matchMedia('(prefers-color-scheme: dark)');

// TODO should only care about current tab
function enableTheme() {
	const darkModeMatcher = getDarkModeMatcher();
	contentChannel.emit({
		name: ChannelEvent.Theme,
		body: darkModeMatcher.matches,
	});

	darkModeMatcher.addEventListener('change', () => {
		const darkModeMatcher = getDarkModeMatcher();
		contentChannel.emit({
			name: ChannelEvent.Theme,
			body: darkModeMatcher.matches,
		});
	});
}

// enableTheme();

export const config: PlasmoCSConfig = {
	matches: ['<all_urls>'],
};
