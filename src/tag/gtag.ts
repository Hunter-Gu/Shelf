import 'https://www.googletagmanager.com/gtag/js?id=G-42STL0XZ3C';

import { env, platform } from './constants';
import type { NonNullRecord, NullRecord, Params } from './types';

export class GTag<EventData extends Record<string, Params | void>> {
	init({ gTagId, clientId }: { gTagId: string; clientId: string }) {
		if (window.gtag) {
			return;
		}

		window.dataLayer = window.dataLayer || [];
		window.gtag = function gtag() {
			window.dataLayer.push(arguments); // eslint-disable-line
		};

		window.gtag('js', new Date());
		window.gtag('config', gTagId, {
			client_id: clientId,
			_platform: platform,
			_env: env,
		});
	}

	event<Name extends keyof NullRecord<EventData>>(name: Name): void;
	event<Name extends keyof NonNullRecord<EventData>>(name: Name, params: EventData[Name]): void;
	event(name: string, params?: unknown) {
		if (!window.gtag) {
			return;
		}

		window.gtag('event', name, {
			...(params || {}),
			_platform: platform,
			_env: env,
		});
	}
}
