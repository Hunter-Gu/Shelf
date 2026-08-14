import { useLayoutEffect, useState } from 'react';

import { getDarkModeMatcher } from '../contents/theme';
import { isExtensionEnv } from '../env';
import { ChannelEvent, contentChannel } from '../message-channel';

enum Theme {
	Dark = 'dark',
	Light = 'light',
}

export function useTheme() {
	const [theme, setTheme] = useState(Theme.Light);

	useLayoutEffect(() => {
		const handleTheme = (isDark: boolean) => {
			setTheme(isDark ? Theme.Dark : Theme.Light);
		};
		if (isExtensionEnv) {
			return contentChannel.on(ChannelEvent.Theme, handleTheme);
		} else {
			const modeMatcher = getDarkModeMatcher();
			handleTheme(modeMatcher.matches);

			const handler = () => {
				const modeMatcher = getDarkModeMatcher();
				handleTheme(modeMatcher.matches);
			};
			modeMatcher.addEventListener('change', handler);

			return () => modeMatcher.removeEventListener('change', handler);
		}
	}, []);

	return theme;
}
