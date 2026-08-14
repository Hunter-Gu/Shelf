import { noop } from 'common/utils/noop';

import { Emitter } from './emitter';
import type { IChannel } from './interface';
import { PortConnect } from './port-message';
import { timeoutAction } from './timeout-action';
import type { EventMap, FlatPromise, MessageData, Payload, Protocol } from './types';

let id = 1;

export class MessageChannel<Call extends Protocol, Attach extends Protocol, Event extends EventMap>
	implements IChannel<Call, Attach, Event>
{
	private currentExtensionId = chrome.runtime.id;

	private _portConnect = new PortConnect();

	private _emitter = new Emitter();

	call<EventName extends keyof Call>(
		params: MessageData<EventName, Call[EventName]['Req']> & {
			timeout?: number;
		},
	): FlatPromise<Call[EventName]['Res']> {
		const callFlag = id++;

		const { name, timeout = 3000 } = params;
		const data = 'body' in params ? params.body : null;

		return new Promise<Awaited<Call[EventName]['Res']>>((resolve, reject) => {
			const port = this._portConnect.connect({ name: name as string });

			const action = timeoutAction({
				action: ({ error, data }: Payload) => {
					if (error) {
						reject(error);
					} else {
						resolve(data as Awaited<Call[EventName]['Res']>);
					}
				},
				timeout() {
					off();
					port.disconnect();
					reject();
				},
				ms: timeout,
			});

			const off = port.on(name, (payload?: Payload) => {
				if (payload?.callFlag !== callFlag) {
					return;
				}
				off();
				port.disconnect();
				action(payload);
			});

			port.emit({ name, data, callFlag });
		});
	}

	handleCall<EventName extends keyof Call>(
		name: EventName,
		handler: (
			rags: Call[EventName]['Req'],
		) => Protocol[EventName]['Res'] | Promise<Protocol[EventName]['Res']>,
	) {
		this._portConnect.onConnect(name, (port) => {
			const off = port.on(name, (payload: Payload) => {
				if (!payload.callFlag) {
					return;
				}

				const { callFlag, data } = payload;

				try {
					const res = handler(data);
					if (res instanceof Promise) {
						res
							.then((data) => {
								port.emit({ name, data, callFlag });
							})
							.catch((error) => {
								port.emit({ name, data: null, error, callFlag });
							});
					} else {
						port.emit({ name, data: res, callFlag });
					}
				} catch (e) {
					const error = (e as Error).message;
					port.emit({ name, data: null, error, callFlag });
				}
			});
			const remove = port.onDisconnect(() => {
				off();
				remove();
			});
		});
	}

	attach<EventName extends keyof Attach>(
		params: MessageData<EventName, Attach[EventName]['Req']>,
		handler: (data: Attach[EventName]['Res']) => void,
	) {
		const attachFlag = id++;

		const { name } = params;
		const data = 'body' in params ? params.body : null;

		const port = this._portConnect.connect({ name: name as string });

		const off = port.on(name, (payload?: Payload) => {
			if (payload?.attachFlag !== attachFlag) {
				return;
			}

			handler(payload.data);
		});
		port.emit({ name, data, attachFlag });

		return () => {
			off();
			port.disconnect();
		};
	}

	handleAttach<EventName extends keyof Attach>(
		name: EventName,
		handler: (
			param: Attach[EventName]['Req'],
			sendResponse: (data: Attach[EventName]['Res']) => void,
		) => Func,
	) {
		this._portConnect.onConnect(name, (port) => {
			let removeListener = noop;

			const off = port.on(name, (payload?: Payload) => {
				if (!payload?.attachFlag || payload.name !== name) {
					return;
				}
				const { attachFlag, data } = payload;
				off();
				removeListener = handler(data, (res) => {
					port.emit({ name, data: res, attachFlag });
				});
			});

			const disconnect = port.onDisconnect(() => {
				off();
				removeListener();
				disconnect();
			});
		});
	}

	dispose() {
		this._portConnect.dispose();
	}

	on<EventName extends keyof Event>(name: EventName, handler: (data: Event[EventName]) => void) {
		return this._emitter.on(name, (payload: Omit<Payload, 'error'>) => {
			handler(payload.data as Event[EventName]);
		});
	}

	emit<EventName extends keyof Event>(params: MessageData<EventName, Event[EventName]>) {
		const { name } = params;

		if ('body' in params) {
			return this._emitter.emit({ name, data: params.body });
		} else {
			return this._emitter.emit({ name });
		}
	}
}
