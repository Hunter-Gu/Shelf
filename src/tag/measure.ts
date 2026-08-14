import { env, platform } from './constants';
import { getOrCreateSessionId } from './get-session-id';
import { TagEvent, type NonNullRecord, type NullRecord, type Params } from './types';

const GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect';
// bookmark app extension
const API_SECRET = process.env.PLASMO_PUBLIC_API_SECRET;
const DEFAULT_ENGAGEMENT_TIME_IN_MSEC = 100;

export class Measure<EventData extends Record<string, Params | void>> {
	private _clientId = '';
	private _measurementId = '';

	private async send(name: string, params = {}) {
		if (!this._clientId || !this._measurementId || !API_SECRET) {
			return;
		}

		return fetch(`${GA_ENDPOINT}?measurement_id=${this._measurementId}&api_secret=${API_SECRET}`, {
			method: 'POST',
			body: JSON.stringify({
				client_id: this._clientId,
				events: [
					{
						name,
						params: {
							// TODO consent
							session_id: await getOrCreateSessionId(),
							engagement_time_msec: DEFAULT_ENGAGEMENT_TIME_IN_MSEC,
							...params,
							_platform: platform,
							_env: env,
						},
					},
				],
			}),
		});
	}

	init({ clientId, gTagId }: { clientId: string; gTagId: string }) {
		this._clientId = clientId;
		this._measurementId = gTagId;
		this.send(TagEvent.PageView);
	}

	event<Name extends keyof NullRecord<EventData>>(name: Name): void;
	event<Name extends keyof NonNullRecord<EventData>>(name: Name, params: EventData[Name]): void;
	event(name: string, params?: unknown) {
		return this.send(name, params || {});
	}
}
