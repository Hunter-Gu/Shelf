import type { Payload, Responser } from './types';

export class Emitter {
	private currentExtensionId = chrome.runtime.id;

	on(
		name: PropertyKey,
		handler: (
			payload: Payload,
			senderInfo: chrome.runtime.MessageSender,
			respond: Responser,
		) => void,
	) {
		const _handler = (
			payload: Payload,
			senderInfo: chrome.runtime.MessageSender,
			response: Responser,
		) => {
			if (payload.name === name) {
				handler(payload, senderInfo, response);
			}
		};
		chrome.runtime.onMessage.addListener(_handler);

		return () => chrome.runtime.onMessage.removeListener(_handler);
	}

	emit(payload: Payload, respond?: Responser) {
		if (respond) {
			return chrome.runtime.sendMessage(this.currentExtensionId, payload, respond);
		} else {
			return chrome.runtime.sendMessage(this.currentExtensionId, payload);
		}
	}
}
