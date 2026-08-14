import { useEffect } from 'react';

import { getOrCreateClientId } from './get-client-id';
import { tag } from './tag';

export function usePageView() {
	useEffect(() => {
		(async function () {
			const clientId = await getOrCreateClientId();
			const gTagId = process.env.PLASMO_PUBLIC_GTAG_ID;
			if (!gTagId) {
				return;
			}
			tag.init({
				clientId,
				gTagId,
			});
		})();
	}, []);
}
